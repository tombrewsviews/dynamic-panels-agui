"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { AGENT_LIVE, streamAgent, type ChatTurn } from "@/lib/workspace/agent-client";
import { getItem } from "@/lib/workspace/demo-data";
import { useWorkspace } from "@/lib/workspace/store";
import type { StepKind, StepState } from "@/lib/workspace/types";
import { STEP_META, STEPS } from "@/lib/workspace/widgets";
import type { ActionEvent } from "@openuidev/react-lang";
import { ArrowLeftIcon, RotateCcwIcon, SparklesIcon, WrenchIcon } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { AgentMessage } from "./agent-message";
import { ChatInput, type SlashCommand } from "./chat-input";
import { PanelHeader } from "./panel-header";
import { StatusBadge, StepStateLabel } from "./status";

const STREAM_INTERVAL_MS = 24;
const STREAM_CHARS = 56;
const RUNNING_STEP_MS = 3500;

/** Pull the first non-empty string out of OpenUI's form state map. */
function firstText(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim() || undefined;
  if (v && typeof v === "object") {
    for (const x of Object.values(v)) {
      const t = firstText(x);
      if (t) return t;
    }
  }
  return undefined;
}

const COMMANDS: SlashCommand[] = [
  { name: "rerun", title: "Re-run results", description: "run the results step again with the latest context", icon: RotateCcwIcon },
  { name: "tool", title: "Open tool", description: "open the tool surface beside this item", icon: WrenchIcon },
];

export function ItemDetail() {
  const isMobile = useIsMobile();
  const id = useWorkspace((s) => s.selectedId);
  const thread = useWorkspace((s) => s.threads[id]);
  const { ensureThread, tick, sendMessage, resolveStep, rerunStep, openContext, openTool, back, appendAgent, setContent } = useWorkspace.getState();
  const item = getItem(id)!;

  useEffect(() => ensureThread(id), [id, ensureThread]);

  // Progressive reveal: stream the current agent card, then the next.
  const lastMsg = thread?.messages.at(-1);
  const done =
    !thread || (thread.revealed === thread.messages.length && (lastMsg?.role === "user" || thread.pos >= (lastMsg?.content.length ?? 0)));
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => tick(id, STREAM_CHARS), STREAM_INTERVAL_MS);
    return () => clearInterval(t);
  }, [done, id, tick]);

  // Demo: a running step finishes while the user watches.
  useEffect(() => {
    if (!done || lastMsg?.state !== "running") return;
    const t = setTimeout(() => resolveStep(id, "resolved"), RUNNING_STEP_MS);
    return () => clearTimeout(t);
  }, [done, lastMsg?.state, lastMsg?.id, id, resolveStep]);

  // Keep the newest output in view unless the user scrolled up.
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  useEffect(() => {
    const el = scroller.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  });
  useEffect(() => {
    pinned.current = true;
  }, [id]);

  // Chips jump to the LATEST output of a step (re-runs append newer cards) and flash it.
  const scrollToStep = (step: StepKind) => {
    const el = scroller.current;
    const all = el?.querySelectorAll<HTMLElement>(`[data-step="${step}"]`);
    const last = all?.[all.length - 1];
    if (!el || !last) return;
    pinned.current = false;
    el.scrollTo({ top: last.offsetTop - 12, behavior: "smooth" });
    last.classList.remove("ws-flash");
    void last.offsetWidth; // restart the highlight animation
    last.classList.add("ws-flash");
  };

  // Another panel asked to reveal a step's output.
  const focusStep = useWorkspace((st) => st.focusStep);
  useEffect(() => {
    if (focusStep) requestAnimationFrame(() => scrollToStep(focusStep.step));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run via nonce only
  }, [focusStep?.nonce]);

  /** Free text goes to the live agent when connected, else to the mock reply. */
  const ask = async (text: string) => {
    pinned.current = true;
    if (!AGENT_LIVE) return sendMessage(id, text);
    const t = useWorkspace.getState().threads[id];
    const history: ChatTurn[] = (t?.messages ?? []).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
    useWorkspace.setState((s) => ({
      threads: { ...s.threads, [id]: { ...s.threads[id], messages: [...s.threads[id].messages, { id: `u${Date.now()}`, role: "user", content: text }] } },
    }));
    const mid = appendAgent(id, { content: "" });
    try {
      await streamAgent([...history, { role: "user", content: text }], (full) => setContent(id, mid, full));
    } catch (err) {
      toast.error("Agent unavailable", { description: err instanceof Error ? err.message : String(err) });
    }
  };

  const onAction = useCallback(
    (e: ActionEvent) => {
      const p = e.params ?? {};
      switch (e.type) {
        case "open_entity":
          return openContext({ kind: "entity", itemId: id, id: String(p.id) });
        case "open_context":
          if (p.kind === "audit") return openContext({ kind: "audit", itemId: id, step: (p.step as StepKind) ?? "summary" });
          return openContext({ kind: "source", itemId: id });
        case "open_tool":
          return openTool();
        case "remove_entity":
          // Destructive-but-cheap actions act immediately and offer Undo.
          return void toast.success("Removed", { action: { label: "Undo", onClick: () => toast("Restored") } });
        case "rerun_step":
          pinned.current = true;
          return rerunStep(id, (p.step as StepKind) ?? "results");
        case "hitl_approve":
          return resolveStep(id, "resolved", `Approved: ${String(p.text ?? "suggestion")}`);
        case "hitl_retry":
          return resolveStep(id, "resolved", "Retry");
        case "hitl_abort":
          return resolveStep(id, "aborted", "Skip this step");
        case "continue_conversation": {
          // A HITL form answers the paused step; anything else is a message.
          if (e.formName?.startsWith("hitl_")) {
            const text = firstText(e.formState);
            if (!text) return void toast.warning("Add the missing context first");
            return resolveStep(id, "resolved", text);
          }
          return void ask(e.humanFriendlyMessage);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scrollToStep/ask only touch refs + store
    [id],
  );

  const stepStates = new Map<StepKind, StepState>();
  thread?.messages.forEach((m, i) => {
    if (m.step && m.state && i < thread.revealed) stepStates.set(m.step, m.state);
  });
  const waiting = lastMsg?.state === "paused" || lastMsg?.state === "failed";

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        leading={
          isMobile && (
            <Button variant="ghost" size="icon-sm" aria-label="Back to list" onClick={back}>
              <ArrowLeftIcon />
            </Button>
          )
        }
        title={item.title}
        subtitle={`#${item.id} · ${item.subtitle}`}
        actions={<StatusBadge status={item.status} />}
      />

      {/* Step chips: one per workflow step; jump to that step's latest card. */}
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
        <ol aria-label="Workflow steps" className="-m-1 flex min-w-0 flex-1 gap-1 overflow-x-auto p-1 [scrollbar-width:none]">
          {STEPS.map((step) => {
            const state = stepStates.get(step) ?? "pending";
            const ran = state !== "pending";
            return (
              <li key={step} className="shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <button
                        type="button"
                        disabled={!ran}
                        onClick={() => scrollToStep(step)}
                        className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent"
                      >
                        <span className="text-xs font-medium">{STEP_META[step].chip}</span>
                        <StepStateLabel state={state} compact />
                      </button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{ran ? `Jump to ${STEP_META[step].agent}` : "Pending: runs after the previous step"}</TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ol>
      </div>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
        }}
        className="relative min-h-0 flex-1 overflow-y-auto"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
          <div className="flex items-start gap-2 rounded-xl border border-dashed px-3 py-2 text-xs text-muted-foreground">
            <SparklesIcon className="mt-0.5 size-3.5 shrink-0 text-status-info" />
            <span>
              <span className="font-medium text-foreground">Learning applied · </span>A rule saved earlier shaped this run.
            </span>
          </div>
          {thread?.messages.slice(0, thread.revealed).map((m, i) => {
            const isCurrent = i === thread.revealed - 1;
            const visible = isCurrent && m.role === "agent" ? m.content.slice(0, thread.pos) : m.content;
            return (
              <div key={m.id} data-step={m.step}>
                <AgentMessage
                  message={m}
                  visible={AGENT_LIVE && !m.step ? m.content : visible}
                  streaming={isCurrent && thread.pos < m.content.length}
                  onAction={onAction}
                  onWhy={m.step ? () => openContext({ kind: "audit", itemId: id, step: m.step! }) : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>

      <ChatInput
        ariaLabel="Message the assistant about this item"
        placeholder={waiting ? "Add the missing context to unblock this step…" : "Ask, correct or teach · / for agents"}
        onSubmit={(text) => void ask(text)}
        commands={COMMANDS}
        onCommand={(name) => {
          if (name === "rerun") {
            pinned.current = true;
            return rerunStep(id, "results");
          }
          if (name === "tool") return openTool();
        }}
      />
    </div>
  );
}

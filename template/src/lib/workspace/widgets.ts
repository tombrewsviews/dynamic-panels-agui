/**
 * Agent output as OpenUI Lang. In production these strings stream from your
 * agents / LLM; here they are built from placeholder data so the Renderer,
 * streaming and actions behave exactly as they would live.
 *
 * Custom actions the shell handles (see item-detail.tsx onAction):
 *   open_entity   { id }        → opens the entity in the context panel
 *   open_context  { kind, … }   → opens another context panel kind
 *   open_tool     {}            → opens the big tool surface
 *   rerun_step    { step }      → appends a fresh card for that step
 *   hitl_approve / hitl_retry / hitl_abort → resolves a paused or failed step
 */
import { action, btn, cols, list, rows, s } from "@/lib/genui/lang";
import { ENTITIES, getEntity } from "./demo-data";
import type { Item, StepKind } from "./types";

export const STEP_META: Record<StepKind, { agent: string; step: number; chip: string }> = {
  summary: { agent: "Summary agent", step: 1, chip: "Summary" },
  analysis: { agent: "Analysis agent", step: 2, chip: "Analysis" },
  results: { agent: "Results agent", step: 3, chip: "Results" },
};

export const STEPS: StepKind[] = ["summary", "analysis", "results"];

function summaryWidget(item: Item): string {
  return [
    `root = Card([hdr, tags, body, more])`,
    `hdr = CardHeader(${s(item.title)}, ${s(`${item.subtitle} · received ${item.receivedAt}`)})`,
    `tags = TagBlock([Tag("Category", "default", "What kind of item this is"), Tag(${s(item.subtitle)}, "secondary"), Tag("Priority", "outline", "Edit priority", ${action("open_context", { kind: "source" })})])`,
    `body = TextContent("A one-paragraph summary the agent wrote. Keep it short: what came in, what it needs, and what happens next.")`,
    `more = Buttons([${btn("Open source", action("open_context", { kind: "source" }))}])`,
  ].join("\n");
}

function analysisWidget(): string {
  return [
    `root = Card([hdr, prog, tbl, note])`,
    `hdr = CardHeader("Analysis", ${s(`${ENTITIES.length} entities scored`)})`,
    `prog = Progress(66, "2 of 3 criteria met")`,
    `tbl = Table(${cols(["Entity", "Type", "Score"], ["string", "string", "number"])}, ${rows(
      ENTITIES.map((e) => [e.name, e.kind, `${e.score}%`]),
    )}, ${list(ENTITIES.map((e) => action("open_entity", { id: e.id })))}, [], ${list([
      `{ label: "Type 1", detail: "2 · covered", start: 0 }`,
      `{ label: "Type 2", detail: "1 · needs 1 more", start: 2 }`,
    ])}, true)`,
    `note = Alert("One entity needs a look", "Open a name to review it.", "warning", [{ label: ${s(ENTITIES[2].name)}, detail: "Partial match", action: ${action("open_entity", { id: ENTITIES[2].id })} }])`,
  ].join("\n");
}

function resultsWidget(): string {
  return [
    `root = Card([hdr, tbl, actions])`,
    `hdr = CardHeader("Results", "Ready to review")`,
    `tbl = Table(${cols(["Entity", "Score"], ["string", "number"])}, ${rows(ENTITIES.slice(0, 2).map((e) => [e.name, `${e.score}%`]))}, ${list(
      ENTITIES.slice(0, 2).map((e) => action("open_entity", { id: e.id })),
    )}, ${list(ENTITIES.slice(0, 2).map((e) => `{ label: "Remove", hint: ${s(`Remove ${e.name}`)}, action: ${action("remove_entity", { id: e.id })} }`))})`,
    `actions = Buttons([${btn("Open tool", action("open_tool"), "default")}, ${btn("Re-run with updated context", action("rerun_step", { step: "results" }))}])`,
  ].join("\n");
}

export function widgetFor(step: StepKind, item: Item): string {
  if (step === "summary") return summaryWidget(item);
  if (step === "analysis") return analysisWidget();
  return resultsWidget();
}

/** A paused step asking the human for missing context (human-in-the-loop). */
export function hitlWidget(): string {
  return [
    `root = Card([warn, form])`,
    `warn = Alert("Needs your input", "The agent is unsure how to continue. Pick a suggestion or add context.", "warning")`,
    `form = Form("hitl_answer", btns, [answer])`,
    `answer = FormControl("Context", TextArea("context", "Add the missing context…", 3, { required: true }))`,
    `btns = Buttons([${btn("Continue", `{ type: "continue_conversation" }`, "default")}, ${btn("Use suggestion", action("hitl_approve", { text: "suggestion" }), "secondary")}, ${btn("Skip step", action("hitl_abort"), "ghost")}])`,
  ].join("\n");
}

export function failedWidget(): string {
  return [
    `root = Card([err, btns])`,
    `err = Alert("Step failed", "The upstream service timed out after 3 attempts.", "destructive")`,
    `btns = Buttons([${btn("Retry", action("hitl_retry"), "default")}, ${btn("Skip step", action("hitl_abort"), "ghost")}])`,
  ].join("\n");
}

/** Reply to a free-text message when no live agent is connected. */
export function mockReply(text: string): string {
  return [
    `root = Card([t, fu])`,
    `t = TextContent(${s(`Got it. In demo mode there is no agent behind this input; connect /api/chat to answer “${text.slice(0, 60)}”.`)})`,
    `fu = Buttons([${btn("Show what changed", action("open_context", { kind: "audit", step: "analysis" }))}])`,
  ].join("\n");
}

/* ── Context panel content ─────────────────────────────── */

export function entityContext(id: string): string {
  const e = getEntity(id);
  if (!e) return `root = Card([TextContent("Not found")])`;
  return [
    `root = Card([hdr, tags, desc, tbl])`,
    `hdr = CardHeader(${s(e.name)}, ${s(e.kind)})`,
    `tags = TagBlock([Tag(${s(`${e.score}% fit`)}, "default"), Tag(${s(e.kind)}, "outline")])`,
    `desc = TextContent(${s(e.note)})`,
    `tbl = Table(${cols(["Field", "Value"])}, ${rows([["Score", `${e.score}%`], ["Type", e.kind]])})`,
  ].join("\n");
}

export function sourceContext(item: Item): string {
  return [
    `root = Card([hdr, body])`,
    `hdr = CardHeader(${s(`From ${item.subtitle}`)}, ${s(`Received ${item.receivedAt} · #${item.id}`)})`,
    `body = Blockquote("The original input that started this item goes here, quoted verbatim.")`,
  ].join("\n");
}

export function auditContext(step: StepKind): string {
  const m = STEP_META[step];
  return [
    `root = Card([hdr, tbl])`,
    `hdr = CardHeader(${s(`Why: ${m.agent}`)}, "Inputs, reasoning and checks behind this output")`,
    `tbl = Table(${cols(["Check", "Result"])}, ${rows([["Inputs read", "3 sources"], ["Rules applied", "2"], ["Confidence", "High"]])})`,
  ].join("\n");
}

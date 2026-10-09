"use client";

import { create } from "zustand";
import { getItem, ITEMS } from "./demo-data";
import { PARENT, type LayoutKey } from "./layout";
import type { ContextPayload, Item, StepKind, Thread, ThreadMessage } from "./types";
import { failedWidget, hitlWidget, mockReply, STEPS, widgetFor } from "./widgets";

let uid = 0;
const nextId = () => `m${++uid}`;

/** Demo: which item pauses / fails / is still running at which step. Replace with real agent state. */
function stepMessage(step: StepKind, item: Item): ThreadMessage {
  if (item.status === "attention" && step === "analysis")
    return { id: nextId(), role: "agent", step, state: "paused", confidence: "Low", content: hitlWidget() };
  if (item.status === "failed" && step === "analysis") return { id: nextId(), role: "agent", step, state: "failed", content: failedWidget() };
  if (item.status === "running" && step === "results") return { id: nextId(), role: "agent", step, state: "running", content: "" };
  return { id: nextId(), role: "agent", step, state: "completed", confidence: "High", content: widgetFor(step, item) };
}

/** Steps after `from` (or all), stopping after the first one that isn't completed. */
function buildSteps(item: Item, from?: StepKind): ThreadMessage[] {
  const out: ThreadMessage[] = [];
  for (const step of STEPS.slice(from ? STEPS.indexOf(from) + 1 : 0)) {
    const m = stepMessage(step, item);
    out.push(m);
    if (m.state !== "completed") break;
  }
  return out;
}

interface WorkspaceState {
  layout: LayoutKey;
  selectedId: string;
  context: ContextPayload | null;
  /** Second contextual panel, opened from a link inside the first. */
  context2: ContextPayload | null;
  query: string;
  threads: Record<string, Thread>;
  /** Ask the detail panel to scroll to a step's latest output (nonce re-triggers). */
  focusStep: { step: StepKind; nonce: number } | null;

  setLayout: (l: LayoutKey) => void;
  back: () => void;
  select: (id: string, opts?: { keepLayout?: boolean }) => void;
  openContext: (c: ContextPayload) => void;
  closeContext: () => void;
  openNestedContext: (c: ContextPayload) => void;
  closeNestedContext: () => void;
  openTool: () => void;
  toggleSide: () => void;
  setQuery: (q: string) => void;

  ensureThread: (id: string) => void;
  /** Progressive reveal: advance the current message by `chars`, then the next message. */
  tick: (id: string, chars: number) => void;
  sendMessage: (id: string, text: string) => void;
  /** Appends an agent card (e.g. a live streamed reply). Returns its message id. */
  appendAgent: (id: string, msg: Omit<ThreadMessage, "id" | "role">) => string;
  /** Replaces a message's content (live streaming writes here). */
  setContent: (id: string, messageId: string, content: string) => void;
  /** Resolves the paused / failed / running step, then runs the steps after it. */
  resolveStep: (id: string, outcome: "resolved" | "aborted", userText?: string) => void;
  /** Re-runs a step: a fresh card is appended; chips jump to the newest one. */
  rerunStep: (id: string, step: StepKind) => void;
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  layout: "overview",
  selectedId: ITEMS[0].id,
  context: null,
  context2: null,
  query: "",
  threads: {},
  focusStep: null,

  setLayout: (layout) => set({ layout }),
  back: () => set((s) => ({ layout: PARENT[s.layout] })),
  select: (id, opts) =>
    set((s) => ({
      selectedId: id,
      // A side panel belongs to one item: drop it when the item changes.
      context: s.context?.itemId === id ? s.context : null,
      context2: s.context2?.itemId === id ? s.context2 : null,
      layout: opts?.keepLayout ? s.layout : "focus",
    })),
  openContext: (context) => set({ context, layout: "context" }),
  closeContext: () => set({ layout: "focus" }),
  openNestedContext: (context2) => set({ context2, layout: "context2" }),
  closeNestedContext: () => set({ layout: "context" }),
  openTool: () => set({ layout: "tool" }),
  toggleSide: () => set((s) => ({ layout: s.layout === "toolSide" ? "tool" : "toolSide" })),
  setQuery: (query) => set({ query }),

  ensureThread: (id) => {
    if (get().threads[id]) return;
    const item = getItem(id);
    if (!item) return;
    const messages = buildSteps(item);
    set((s) => ({ threads: { ...s.threads, [id]: { messages, revealed: messages.length ? 1 : 0, pos: 0 } } }));
  },

  tick: (id, chars) =>
    set((s) => {
      const t = s.threads[id];
      if (!t || t.revealed === 0) return s;
      const current = t.messages[t.revealed - 1];
      const len = current.role === "user" ? 0 : current.content.length;
      if (t.pos < len) return { threads: { ...s.threads, [id]: { ...t, pos: Math.min(len, t.pos + chars) } } };
      if (t.revealed < t.messages.length) return { threads: { ...s.threads, [id]: { ...t, revealed: t.revealed + 1, pos: 0 } } };
      return s;
    }),

  sendMessage: (id, text) => {
    const t = get().threads[id];
    if (!t) return;
    // While a step waits on the human, a message answers it.
    if (t.messages.some((m) => m.state === "paused" || m.state === "failed")) return get().resolveStep(id, "resolved", text);
    const messages = [...t.messages, { id: nextId(), role: "user" as const, content: text }, { id: nextId(), role: "agent" as const, content: mockReply(text) }];
    set((s) => ({ threads: { ...s.threads, [id]: { ...t, messages } } }));
  },

  appendAgent: (id, msg) => {
    const t = get().threads[id];
    const mid = nextId();
    if (!t) return mid;
    set((s) => ({ threads: { ...s.threads, [id]: { ...t, messages: [...t.messages, { ...msg, id: mid, role: "agent" }] } } }));
    return mid;
  },

  setContent: (id, messageId, content) =>
    set((s) => {
      const t = s.threads[id];
      if (!t) return s;
      return { threads: { ...s.threads, [id]: { ...t, messages: t.messages.map((m) => (m.id === messageId ? { ...m, content } : m)) } } };
    }),

  resolveStep: (id, outcome, userText) => {
    const t = get().threads[id];
    const item = getItem(id);
    if (!t || !item) return;
    const idx = t.messages.findLastIndex((m) => m.state === "paused" || m.state === "failed" || m.state === "running");
    if (idx < 0) return;
    const step = t.messages[idx].step!;
    const messages = [...t.messages];
    if (outcome === "aborted") {
      messages[idx] = { ...messages[idx], state: "failed", confidence: undefined };
    } else {
      // The resolved step now shows its output; the human's answer sits above it.
      messages[idx] = { ...messages[idx], state: "completed", confidence: "High", content: widgetFor(step, item) };
      if (userText) messages.splice(idx, 0, { id: nextId(), role: "user", content: userText });
      // Later steps run as if the item were healthy.
      messages.push(...buildSteps({ ...item, status: "ready" }, step));
    }
    // Revealed points at the first changed message so the stream replays from there.
    set((s) => ({ threads: { ...s.threads, [id]: { messages, revealed: Math.min(t.revealed, idx + 1), pos: 0 } } }));
  },

  rerunStep: (id, step) => {
    const item = getItem(id);
    if (!item) return;
    get().appendAgent(id, { step, state: "completed", confidence: "High", content: widgetFor(step, item) });
  },
}));

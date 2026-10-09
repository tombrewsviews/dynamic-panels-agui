/**
 * PLACEHOLDER DATA — replace with your domain. It exists only so the shell
 * renders every state (needs attention, running, failed, ready, waiting, done)
 * on first run. Nothing in the components depends on these strings.
 */
import type { Item } from "./types";

export const ITEMS: Item[] = [
  { id: "1001", title: "Item one needs a decision", subtitle: "Source A", status: "attention", signal: "An agent paused and needs your input", receivedAt: "09:12", urgent: true },
  { id: "1002", title: "Item two is being processed", subtitle: "Source B", status: "running", receivedAt: "09:40" },
  { id: "1003", title: "Item three hit an error", subtitle: "Source A", status: "failed", signal: "A step failed: retry or skip it", receivedAt: "10:05" },
  { id: "1004", title: "Item four is ready", subtitle: "Source C", status: "ready", signal: "Everything is in place: review and send", receivedAt: "10:31" },
  { id: "1005", title: "Item five is waiting on someone else", subtitle: "Source B", status: "waiting", receivedAt: "Yesterday" },
  { id: "1006", title: "Item six is done", subtitle: "Source C", status: "done", receivedAt: "Mon" },
];

/** Entities an agent card can link to (opened in the context panel). */
export const ENTITIES = [
  { id: "e1", name: "Entity Alpha", kind: "Type 1", score: 94, note: "Strong match on every criterion." },
  { id: "e2", name: "Entity Beta", kind: "Type 1", score: 88, note: "Good match; one criterion unverified." },
  { id: "e3", name: "Entity Gamma", kind: "Type 2", score: 71, note: "Partial match." },
];

export const getItem = (id: string) => ITEMS.find((i) => i.id === id);
export const getEntity = (id: string) => ENTITIES.find((e) => e.id === id);

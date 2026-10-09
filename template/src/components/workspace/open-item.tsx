"use client";

import type { ActionSchema } from "@/lib/genui/action";
import { SelectionContext } from "@/lib/genui/selection";
import { useWorkspace } from "@/lib/workspace/store";
import type { ContextPayload } from "@/lib/workspace/types";
import { useCallback, type ReactNode } from "react";

/** "entity:e1"… for the item a side panel shows; undefined for panels that aren't one item. */
function keyOf(c: ContextPayload | null): string | undefined {
  if (c?.kind === "entity") return `entity:${c.id}`;
  return undefined;
}

/** The same key for a row's action, when the action opens one item. */
function actionKey(a: ActionSchema): string | undefined {
  const p = (a as { params?: Record<string, unknown> } | undefined)?.params;
  if (!a || !p) return undefined;
  if (a.type === "open_entity") return `entity:${p.id}`;
  return undefined;
}

/**
 * Marks rows (in every agent card and panel) whose action opens the item
 * currently open in a side panel, so the selection reads across panels.
 * Wrap the whole workspace once.
 */
export function OpenItemProvider({ children }: { children: ReactNode }) {
  const open = useWorkspace((s) => {
    const keys: string[] = [];
    if (s.layout === "context" || s.layout === "context2") keys.push(keyOf(s.context) ?? "");
    if (s.layout === "context2") keys.push(keyOf(s.context2) ?? "");
    // One string keeps the selector stable between renders.
    return keys.filter(Boolean).join("|");
  });
  const isSelected = useCallback(
    (a: ActionSchema) => {
      const k = actionKey(a);
      return !!k && open.split("|").includes(k);
    },
    [open],
  );
  return <SelectionContext.Provider value={isSelected}>{children}</SelectionContext.Provider>;
}

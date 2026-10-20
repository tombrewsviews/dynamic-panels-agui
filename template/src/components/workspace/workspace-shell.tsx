"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { getItem, ITEMS } from "@/lib/workspace/demo-data";
import { dividers, edges, MIN_WIDTH, resizeBetween, resolveSlots, type SlotKey, type SlotSpec } from "@/lib/workspace/layout";
import { useWorkspace } from "@/lib/workspace/store";
import { useEffect, useRef, useState } from "react";
import { ContextPanel } from "./context-panel";
import { Divider } from "./divider";
import { FluidSlot } from "./fluid-slot";
import { ItemDetail } from "./item-detail";
import { ItemList } from "./item-list";
import { OpenItemProvider } from "./open-item";
import { Rail } from "./rail";
import { SidePanel, ToolPanel } from "./tool-panels";
import { TopBar } from "./top-bar";

/**
 * The dynamic-panels workspace: a top bar over one row of FluidSlots. Every
 * surface is always mounted; the layout key decides each slot's width and
 * mode (full / rail / hidden), and CSS animates the change. Dividers in the
 * gaps between full panels let the user resize them (references/dividers.md).
 */
export function WorkspaceShell() {
  const layout = useWorkspace((s) => s.layout);
  const selectedId = useWorkspace((s) => s.selectedId);
  const prefs = useWorkspace((s) => s.prefs);
  const { setLayout, back, loadPrefs, setPrefs } = useWorkspace.getState();
  const isMobile = useIsMobile();
  const slots = resolveSlots(layout, isMobile, prefs);
  const at = edges(slots);
  const labels: Record<SlotKey, string> = { list: "List", detail: "Details", context: "Context", context2: "More context", tool: "Tool", side: "Tool options" };

  // A drag is measured from the widths it started with, so the divider stays
  // under the pointer even after the pointer ran past a panel's minimum.
  const dragFrom = useRef<Record<SlotKey, SlotSpec> | null>(null);
  const [resizing, setResizing] = useState(false);
  const resize = (from: Record<SlotKey, SlotSpec>, a: SlotKey, b: SlotKey, deltaPx: number, rowPx: number) =>
    setPrefs(resizeBetween(layout, from, a, b, (deltaPx / rowPx) * 100, rowPx, useWorkspace.getState().prefs));

  useEffect(loadPrefs, [loadPrefs]);

  // Escape steps back one surface, unless a dialog / popover owns the key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (document.querySelector(":is([role=dialog], [role=menu], [role=listbox])[data-state=open]")) return;
      back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back]);

  // After load the keyboard starts in the list, so ↑↓ work straight away.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (document.activeElement && document.activeElement !== document.body) return;
      const list = "[data-mode=full] [data-active=true] [data-item-id]";
      const row = document.querySelector<HTMLElement>(`${list}[tabindex="0"]`) ?? document.querySelector<HTMLElement>(list);
      row?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Typing anywhere in a panel goes to that panel's chat input: the panel
  // last focused or clicked takes the first character and keeps the focus.
  useEffect(() => {
    let lastPanel: Element | null = null;
    const remember = (e: Event) => {
      const panel = (e.target as Element | null)?.closest?.("section.ws-slot");
      if (panel) lastPanel = panel;
    };
    const onKey = (e: KeyboardEvent) => {
      // Printable characters only; space still activates buttons.
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1 || e.key === " ") return;
      const el = document.activeElement as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable=true], [role=menu], [role=listbox], [role=dialog]")) return;
      const panel = el?.closest("section.ws-slot") ?? lastPanel;
      const input = panel?.querySelector<HTMLTextAreaElement>("[data-mode=full] [data-active=true] textarea[data-chat-input]");
      if (!input) return;
      // Focused during keydown, the character lands in the input.
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    };
    document.addEventListener("focusin", remember);
    document.addEventListener("pointerdown", remember);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("focusin", remember);
      document.removeEventListener("pointerdown", remember);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <OpenItemProvider>
      <div className="flex h-dvh flex-col gap-2 bg-canvas p-2">
        <TopBar />
        <main className="relative -mx-1 flex min-h-0 flex-1" data-layout={layout} data-resizing={resizing || undefined}>
          <FluidSlot
            label="List"
            spec={slots.list}
            minWidth={MIN_WIDTH.list}
            full={<ItemList />}
            rail={<Rail label="Items" count={ITEMS.length} hint="Show the list" onExpand={() => setLayout(layout === "context2" ? "context" : "focus")} />}
          />
          <FluidSlot
            label="Details"
            spec={slots.detail}
            minWidth={MIN_WIDTH.detail}
            full={<ItemDetail />}
            rail={<Rail label={getItem(selectedId)?.title ?? "Details"} hint="Show details" onExpand={() => setLayout(layout === "context2" ? "context" : "tool")} />}
          />
          <FluidSlot label="Context" spec={slots.context} minWidth={MIN_WIDTH.context} full={<ContextPanel />} />
          <FluidSlot label="More context" spec={slots.context2} minWidth={MIN_WIDTH.context2} full={<ContextPanel level={2} />} />
          {/* keyed per item so a tool's state never carries over to another item */}
          <FluidSlot label="Tool" spec={slots.tool} minWidth={MIN_WIDTH.tool} full={<ToolPanel key={selectedId} />} />
          <FluidSlot label="Tool options" spec={slots.side} minWidth={MIN_WIDTH.side} full={<SidePanel />} />
          {!isMobile &&
            dividers(slots).map(([a, b]) => (
              <Divider
                key={`${a}-${b}`}
                left={at[a]}
                label={`Resize ${labels[a]} and ${labels[b]}`}
                onStart={() => {
                  dragFrom.current = slots;
                  setResizing(true);
                }}
                onMove={(dx, rowPx) => dragFrom.current && resize(dragFrom.current, a, b, dx, rowPx)}
                onEnd={() => {
                  dragFrom.current = null;
                  setResizing(false);
                }}
                onStep={(dx, rowPx) => resize(slots, a, b, dx, rowPx)}
              />
            ))}
        </main>
      </div>
    </OpenItemProvider>
  );
}

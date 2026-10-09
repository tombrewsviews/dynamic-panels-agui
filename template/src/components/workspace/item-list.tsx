"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ITEMS } from "@/lib/workspace/demo-data";
import { useWorkspace } from "@/lib/workspace/store";
import type { Item } from "@/lib/workspace/types";
import { BellIcon, Maximize2Icon, Minimize2Icon, ZapIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatInput, type SlashCommand } from "./chat-input";
import { PanelHeader } from "./panel-header";
import { StatusBadge, StatusDot } from "./status";

const DOUBLE_CLICK_MS = 220;
/** Lists longer than this paginate. */
const PAGE = 25;
const QUICK = ["attention", "urgent"] as const;
type Quick = (typeof QUICK)[number];

const COMMANDS: SlashCommand[] = [
  { name: "attention", title: "Needs-you filter", description: "show only items waiting on you", icon: BellIcon },
  { name: "urgent", title: "Urgent filter", description: "show only urgent items", icon: ZapIcon },
];

/** Needs-you first, then by status order; filtered by quick toggles and the typed query. */
export function useVisibleItems(quick: Record<Quick, boolean>) {
  const query = useWorkspace((s) => s.query);
  return useMemo(() => {
    const terms = query.startsWith("/") ? [] : query.toLowerCase().split(/\s+/).filter(Boolean);
    const rank = { attention: 0, failed: 1, ready: 2, running: 3, waiting: 4, done: 5 } as const;
    return ITEMS.filter((i) => {
      if (quick.attention && i.status !== "attention" && i.status !== "failed") return false;
      if (quick.urgent && !i.urgent) return false;
      const hay = `${i.title} ${i.subtitle} ${i.id}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    }).sort((a, b) => rank[a.status] - rank[b.status]);
  }, [query, quick]);
}

export function ItemList() {
  const layout = useWorkspace((s) => s.layout);
  const { setLayout, select, setQuery } = useWorkspace.getState();
  const query = useWorkspace((s) => s.query);
  const selectedId = useWorkspace((s) => s.selectedId);
  const [quick, setQuick] = useState<Record<Quick, boolean>>({ attention: false, urgent: false });
  const items = useVisibleItems(quick);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / PAGE));
  const shown = items.slice(page * PAGE, page * PAGE + PAGE);
  // The selected row takes Tab; if it's filtered out, the first row does.
  const tabId = shown.some((i) => i.id === selectedId) ? selectedId : shown[0]?.id;
  const wide = layout === "overview";
  useEffect(() => setPage(0), [query, quick]);

  return (
    <div className="@container flex h-full flex-col">
      <PanelHeader
        title="Items"
        subtitle={`${items.length} in queue`}
        actions={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={wide ? "Focus selected item" : "Expand list"} onClick={() => setLayout(wide ? "focus" : "overview")}>
                {wide ? <Minimize2Icon /> : <Maximize2Icon />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{wide ? "Focus selected item" : "Expand list"}</TooltipContent>
          </Tooltip>
        }
      />
      <div role="group" aria-label="Quick filters" className="flex shrink-0 flex-wrap items-center gap-1.5 border-b px-4 py-2">
        {QUICK.map((k) => (
          <Toggle
            key={k}
            size="sm"
            variant="outline"
            pressed={quick[k]}
            onPressedChange={() => setQuick((q) => ({ ...q, [k]: !q[k] }))}
            className="h-7 rounded-full px-3 text-xs capitalize data-[state=on]:border-foreground/30"
          >
            {k === "attention" ? "Needs me" : k}
          </Toggle>
        ))}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ul
          className="flex flex-col gap-1 p-2 pr-3"
          aria-label="Items"
          // ↑↓ move focus and selection row to row (instead of scrolling); Home/End jump.
          onKeyDown={(e) => {
            if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
            const rows = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("[data-item-id]")];
            const i = rows.indexOf(document.activeElement as HTMLButtonElement);
            if (i < 0) return;
            e.preventDefault();
            const next = e.key === "Home" ? 0 : e.key === "End" ? rows.length - 1 : Math.min(rows.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)));
            rows[next].focus({ preventScroll: true });
            rows[next].scrollIntoView({ block: "nearest" });
            select(rows[next].dataset.itemId!, { keepLayout: true });
          }}
        >
          {shown.map((i) => (
            <ItemRow key={i.id} item={i} tabbable={i.id === tabId} />
          ))}
        </ul>
        {items.length === 0 && (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyTitle>Nothing matches</EmptyTitle>
              <EmptyDescription>Clear a filter or change the search.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {pages > 1 && (
          <nav aria-label="Pages" className="flex items-center justify-between px-4 pb-3 text-xs text-muted-foreground">
            <Button variant="ghost" size="xs" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span className="tabular-nums">
              {page + 1} / {pages}
            </span>
            <Button variant="ghost" size="xs" disabled={page === pages - 1} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </nav>
        )}
      </ScrollArea>
      <ChatInput
        ariaLabel="Filter items"
        placeholder="Filter items · / for commands"
        value={query}
        onChange={setQuery}
        commands={COMMANDS}
        onCommand={(name) => setQuick((q) => ({ ...q, [name]: true }))}
      />
    </div>
  );
}

function ItemRow({ item, tabbable }: { item: Item; tabbable: boolean }) {
  const selected = useWorkspace((s) => s.selectedId === item.id);
  const { select, setLayout } = useWorkspace.getState();
  // Single click → focus layout; double click → back to the overview layout.
  // The layout change waits a beat so a double click doesn't lurch to focus first.
  const pendingFocus = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(pendingFocus.current), []);

  return (
    <li>
      <button
        type="button"
        data-item-id={item.id}
        // Roving focus: Tab lands on the selected row, arrows move from there.
        tabIndex={tabbable ? 0 : -1}
        onKeyDown={(e) => {
          // Enter acts as the second click: open the item large.
          if (e.key !== "Enter") return;
          e.preventDefault();
          clearTimeout(pendingFocus.current);
          select(item.id, { keepLayout: true });
          setLayout("focus");
        }}
        onClick={(e) => {
          if (e.detail > 1) return;
          select(item.id, { keepLayout: true });
          clearTimeout(pendingFocus.current);
          pendingFocus.current = setTimeout(() => setLayout("focus"), DOUBLE_CLICK_MS);
        }}
        onDoubleClick={() => {
          clearTimeout(pendingFocus.current);
          setLayout("overview");
        }}
        title="Click to focus · double-click for the overview · ↑↓ to move · Enter to open"
        aria-current={selected}
        className={cn(
          "group grid w-full grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl px-3 py-2.5 text-left transition-colors",
          "hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          // Selected: tinted fill + a 2px outline in the ring colour (≥ 3:1 in both themes).
          selected && "bg-selected ring-2 ring-ring hover:bg-selected",
        )}
      >
        <span className="pt-1.5">
          <StatusDot status={item.status} />
        </span>
        <span className="min-w-0">
          <span className="flex items-baseline gap-2">
            <span className={cn("truncate text-sm", selected ? "font-semibold" : "font-medium")}>{item.title}</span>
            {item.urgent && <ZapIcon aria-label="Urgent" className="size-3.5 shrink-0 fill-status-warn text-status-warn" />}
            <span className="ml-auto hidden shrink-0 text-xs text-muted-foreground @md:inline">{item.receivedAt}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{item.subtitle}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0 tabular-nums">#{item.id}</span>
            <span className="ml-auto hidden shrink-0 @xl:inline-flex">
              <StatusBadge status={item.status} />
            </span>
          </span>
          {item.signal && (
            <span className={cn("mt-1.5 flex items-start gap-1.5 text-xs", item.status === "attention" || item.status === "failed" ? "text-status-warn" : "text-muted-foreground")}>
              <BellIcon className="mt-0.5 size-3 shrink-0" />
              <span className="line-clamp-2">
                <Badge variant="outline" className="mr-1 h-4 px-1 text-[10px] uppercase">
                  {item.status === "attention" || item.status === "failed" ? "act" : "fyi"}
                </Badge>
                {item.signal}
              </span>
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ENTITIES } from "@/lib/workspace/demo-data";
import { useWorkspace } from "@/lib/workspace/store";
import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { ChatInput } from "./chat-input";
import { PanelHeader } from "./panel-header";

/**
 * The big task surface (search, editor, composer…). It takes most of the row
 * and pushes the list to a rail. Its own secondary panel (filters, preview)
 * opens beside it in the toolSide layout and pushes the detail to a rail too.
 */
export function ToolPanel() {
  const layout = useWorkspace((s) => s.layout);
  const { toggleSide, back } = useWorkspace.getState();
  const [q, setQ] = useState("");
  const results = ENTITIES.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        title="Tool"
        subtitle={`${results.length} results`}
        actions={
          <>
            <Button variant={layout === "toolSide" ? "secondary" : "ghost"} size="sm" aria-pressed={layout === "toolSide"} onClick={toggleSide}>
              <SlidersHorizontalIcon /> Filters
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Close tool" onClick={back}>
              <XIcon />
            </Button>
          </>
        }
      />
      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {results.map((e) => (
          <li key={e.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-foreground/[0.04]">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{e.name}</span>
              <span className="block text-xs text-muted-foreground">{e.kind}</span>
            </span>
            <span className="text-sm tabular-nums">{e.score}%</span>
          </li>
        ))}
      </ul>
      <ChatInput ariaLabel="Search the tool" placeholder="Search…" value={q} onChange={setQ} />
    </div>
  );
}

export function SidePanel() {
  const { toggleSide } = useWorkspace.getState();
  const [min, setMin] = useState([50]);
  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        title="Filters"
        actions={
          <Button variant="ghost" size="icon-sm" aria-label="Close filters" onClick={toggleSide}>
            <XIcon />
          </Button>
        }
      />
      <div className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-3">
          <Label>Minimum score · {min[0]}%</Label>
          <Slider value={min} onValueChange={setMin} max={100} step={5} aria-label="Minimum score" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="only-new">Only new</Label>
          <Switch id="only-new" />
        </div>
      </div>
    </div>
  );
}

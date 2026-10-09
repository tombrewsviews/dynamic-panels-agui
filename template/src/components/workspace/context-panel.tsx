"use client";

import { Button } from "@/components/ui/button";
import { shadcnChatLibrary } from "@/lib/genui";
import { getItem } from "@/lib/workspace/demo-data";
import { useWorkspace } from "@/lib/workspace/store";
import type { ContextPayload } from "@/lib/workspace/types";
import { auditContext, entityContext, sourceContext } from "@/lib/workspace/widgets";
import { Renderer } from "@openuidev/react-lang";
import { XIcon } from "lucide-react";
import { PanelHeader } from "./panel-header";

const TITLES: Record<ContextPayload["kind"], string> = {
  entity: "Details",
  source: "Source",
  audit: "Audit & explainability",
};

function contentFor(c: ContextPayload): string {
  switch (c.kind) {
    case "entity":
      return entityContext(c.id);
    case "source":
      return sourceContext(getItem(c.itemId)!);
    case "audit":
      return auditContext(c.step);
  }
}

/**
 * Contextual panel. Links inside level 1 open level 2 beside it (the list and
 * detail collapse to rails); links inside level 2 replace level 2.
 * Native React panels (forms, profiles) can return early per kind.
 */
export function ContextPanel({ level = 1 }: { level?: 1 | 2 }) {
  const context = useWorkspace((s) => (level === 2 ? s.context2 : s.context));
  const close = useWorkspace((s) => (level === 2 ? s.closeNestedContext : s.closeContext));
  const { openNestedContext } = useWorkspace.getState();
  if (!context) return null;
  const item = getItem(context.itemId);

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        title={TITLES[context.kind]}
        subtitle={item ? `#${item.id} · ${item.subtitle}` : undefined}
        actions={
          <Button variant="ghost" size="icon-sm" aria-label="Close panel" onClick={close}>
            <XIcon />
          </Button>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {/* key re-mounts the renderer so form state never leaks between items */}
        <div className="ws-genui" key={JSON.stringify(context)}>
          <Renderer
            response={contentFor(context)}
            library={shadcnChatLibrary}
            onAction={(e) => {
              const p = e.params ?? {};
              if (e.type === "open_entity") return openNestedContext({ kind: "entity", itemId: context.itemId, id: String(p.id) });
            }}
          />
        </div>
      </div>
    </div>
  );
}

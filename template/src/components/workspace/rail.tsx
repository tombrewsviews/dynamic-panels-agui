"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Collapsed panel: a full-height clickable bar with a vertical label. */
export function Rail({
  label,
  count,
  hint,
  onExpand,
}: {
  label: string;
  count?: number;
  hint: string;
  onExpand: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onExpand}
          className="group flex h-full w-full flex-col items-center gap-3 py-4 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          {count !== undefined && (
            <Badge variant="secondary" className="px-1.5 tabular-nums">
              {count}
            </Badge>
          )}
          <span className="truncate text-sm font-medium [writing-mode:vertical-rl] rotate-180">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{hint}</TooltipContent>
    </Tooltip>
  );
}

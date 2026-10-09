"use client";

import type { SlotSpec } from "@/lib/workspace/layout";
import type { CSSProperties, ReactNode } from "react";

/**
 * One column of the fluid grid. Width is a % of the workspace row and
 * animates with the shared ease-in-out curve. The full and rail layers
 * cross-fade; the full layer keeps a min-width so content clips instead of
 * reflowing while the column collapses.
 *
 * Every slot stays mounted (hidden = 0 width + inert), so scroll position,
 * drafts and form state survive layout changes.
 */
export function FluidSlot({
  spec,
  minWidth,
  full,
  rail,
  label,
}: {
  spec: SlotSpec;
  minWidth: number;
  full: ReactNode;
  rail?: ReactNode;
  label: string;
}) {
  return (
    <section
      aria-label={label}
      aria-hidden={spec.mode === "hidden"}
      data-mode={spec.mode}
      style={{ width: `${spec.width}%` } as CSSProperties}
      className="ws-slot relative h-full shrink-0 overflow-hidden px-1 data-[mode=hidden]:px-0 data-[mode=hidden]:opacity-0"
    >
      <div className="relative h-full overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs">
        <div
          className="ws-layer absolute inset-y-0 left-0 flex w-full flex-col"
          data-active={spec.mode === "full"}
          inert={spec.mode !== "full"}
          style={{ minWidth }}
        >
          {full}
        </div>
        {rail && (
          <div className="ws-layer absolute inset-0" data-active={spec.mode === "rail"} inert={spec.mode !== "rail"}>
            {rail}
          </div>
        )}
      </div>
    </section>
  );
}

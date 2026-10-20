"use client";

import { GripVertical } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/** One arrow-key press moves the divider this share of the row. */
const STEP = 0.02;

/**
 * The gap between two full panels (references/dividers.md). Sits over the gap
 * at `left` (% of the row) and takes no width of its own; a small grip shows
 * while the pointer is over the gap, the divider has focus or a drag is on.
 * Dragging trades width between the two panels; arrow keys move it one step.
 */
export function Divider({
  left,
  label,
  onStart,
  onMove,
  onEnd,
  onStep,
}: {
  left: number;
  /** "Resize Details and Context" */
  label: string;
  onStart: () => void;
  /** The pointer's distance from where the drag started, and the row's width, in px. */
  onMove: (deltaPx: number, rowPx: number) => void;
  onEnd: () => void;
  /** One keyboard step, in px, from the current widths. */
  onStep: (deltaPx: number, rowPx: number) => void;
}) {
  const start = useRef<{ x: number; rowPx: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    const row = e.currentTarget.parentElement;
    if (e.button !== 0 || !row) return;
    e.preventDefault();
    start.current = { x: e.clientX, rowPx: row.getBoundingClientRect().width };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    onStart();
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (start.current) onMove(e.clientX - start.current.x, start.current.rowPx);
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    start.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
    onEnd();
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const row = e.currentTarget.parentElement;
    if ((e.key !== "ArrowLeft" && e.key !== "ArrowRight") || !row) return;
    e.preventDefault();
    const rowPx = row.getBoundingClientRect().width;
    onStep((e.key === "ArrowLeft" ? -STEP : STEP) * rowPx, rowPx);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={Math.round(left)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
      data-dragging={dragging || undefined}
      style={{ left: `${left}%` }}
      className="ws-divider group absolute inset-y-0 z-10 flex w-4 -translate-x-1/2 cursor-col-resize touch-none items-center justify-center focus-visible:outline-none"
    >
      <span className="flex h-8 w-3 items-center justify-center rounded-full bg-card text-muted-foreground opacity-0 shadow-xs ring-1 ring-border transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-focus-visible:ring-2 group-focus-visible:ring-ring group-data-[dragging]:opacity-100 group-data-[dragging]:text-foreground">
        <GripVertical className="size-3.5" aria-hidden />
      </span>
    </div>
  );
}

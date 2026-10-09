import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import type { Confidence, ItemStatus, StepState } from "@/lib/workspace/types";
import { cn } from "@/lib/utils";
import { CheckIcon, CircleAlertIcon, CircleCheckIcon, CirclePauseIcon, CircleXIcon, ClockIcon } from "lucide-react";

/**
 * One status → one tone, used identically by the list dot, the header badge
 * and menus. Tones map to tokens only (status-warn/info/ok, destructive,
 * muted, foreground) so both themes keep AA contrast.
 */
export const ITEM_STATUS: Record<ItemStatus, { label: string; hint: string; className: string; dot: string }> = {
  attention: {
    label: "Needs you",
    hint: "An agent needs your input",
    className: "bg-status-warn/15 text-status-warn border-status-warn/30",
    dot: "bg-status-warn",
  },
  failed: {
    label: "Failed step",
    hint: "An agent step failed: retry or skip it",
    className: "bg-destructive/10 text-destructive border-destructive/30",
    dot: "bg-destructive",
  },
  running: {
    label: "Running",
    hint: "Agents are working through the steps",
    className: "bg-status-info/15 text-status-info border-status-info/30",
    dot: "bg-status-info animate-pulse",
  },
  ready: {
    label: "Ready",
    hint: "Everything is in place for the next move",
    className: "bg-status-ok/15 text-status-ok border-status-ok/30",
    dot: "bg-status-ok",
  },
  waiting: {
    label: "Waiting",
    hint: "Waiting on someone outside the workspace",
    className: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/60",
  },
  done: {
    label: "Done",
    hint: "Nothing left to do",
    className: "bg-status-ok text-background border-transparent",
    dot: "bg-status-ok ring-2 ring-status-ok/30",
  },
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  const s = ITEM_STATUS[status];
  return (
    <Badge variant="outline" className={cn("gap-1", s.className)}>
      {status === "running" && <Spinner className="size-3" />}
      {status === "done" && <CheckIcon className="size-3" />}
      {s.label}
    </Badge>
  );
}

export function StatusDot({ status }: { status: ItemStatus }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", ITEM_STATUS[status].dot)} />;
}

const STEP_STATE: Record<StepState, { label: string; icon: React.ReactNode; className: string }> = {
  pending: { label: "Pending", icon: <ClockIcon />, className: "text-muted-foreground" },
  running: { label: "Running", icon: <Spinner />, className: "text-status-info" },
  paused: { label: "Paused · Needs review", icon: <CirclePauseIcon />, className: "text-status-warn" },
  completed: { label: "Completed · Auto", icon: <CircleCheckIcon />, className: "text-status-ok" },
  failed: { label: "Failed", icon: <CircleXIcon />, className: "text-destructive" },
};

export function StepStateLabel({ state, compact }: { state: StepState; compact?: boolean }) {
  const s = STEP_STATE[state];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium [&_svg]:size-3.5", s.className)}>
      {s.icon}
      <span className={cn(compact && "sr-only")}>{s.label}</span>
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[11px]",
        confidence === "Low" && "border-status-warn/40 text-status-warn",
        confidence === "High" && "text-muted-foreground",
      )}
    >
      {confidence === "Low" && <CircleAlertIcon />}
      {confidence} confidence
    </Badge>
  );
}

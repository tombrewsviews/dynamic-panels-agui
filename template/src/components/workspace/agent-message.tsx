"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { shadcnChatLibrary } from "@/lib/genui";
import type { ThreadMessage } from "@/lib/workspace/types";
import { STEP_META } from "@/lib/workspace/widgets";
import { Renderer, type ActionEvent } from "@openuidev/react-lang";
import { BotIcon, CircleHelpIcon } from "lucide-react";
import { ConfidenceBadge, StepStateLabel } from "./status";

/**
 * One message in the agent thread. User messages are right-aligned bubbles;
 * agent messages are a header (agent · step · state · confidence · Why?)
 * over an OpenUI card. Running steps show a skeleton.
 */
export function AgentMessage({
  message,
  visible,
  streaming,
  onAction,
  onWhy,
  agentName = "Assistant",
}: {
  message: ThreadMessage;
  visible: string;
  streaming: boolean;
  onAction: (e: ActionEvent) => void;
  onWhy?: () => void;
  agentName?: string;
}) {
  if (message.role === "user") {
    return (
      <div className="ws-enter flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">
          {message.content}
        </p>
      </div>
    );
  }

  const meta = message.step ? STEP_META[message.step] : null;

  return (
    <article className="ws-enter flex flex-col gap-2">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1">
        <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <BotIcon className="size-3.5" />
        </span>
        <span className="text-sm font-medium">{meta?.agent ?? agentName}</span>
        {meta && <span className="text-xs text-muted-foreground">Step {meta.step}</span>}
        {message.state && <StepStateLabel state={message.state} />}
        <span className="ml-auto flex items-center gap-1">
          {message.confidence && <ConfidenceBadge confidence={message.confidence} />}
          {onWhy && (
            <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={onWhy}>
              <CircleHelpIcon />
              Why?
            </Button>
          )}
        </span>
      </header>
      {message.state === "running" || !visible ? (
        <div className="space-y-2 rounded-xl border p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ) : (
        <div className="ws-genui">
          <Renderer response={visible} library={shadcnChatLibrary} isStreaming={streaming} onAction={onAction} />
        </div>
      )}
    </article>
  );
}

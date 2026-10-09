"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BuiltinActionType, defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { z } from "zod";
import { actionSchema, type ActionSchema } from "../action";

type Variant = "default" | "secondary" | "destructive" | "outline" | "ghost";

const TagSchema = z.object({
  text: z.string(),
  variant: z.enum(["default", "secondary", "destructive", "outline", "ghost"]).optional(),
  hint: z.string().optional(),
  action: actionSchema,
});

/** Badge with an optional tooltip (`hint`) and click `action`. */
function TagView({ text, variant, hint, action }: { text: string; variant?: Variant; hint?: string; action?: ActionSchema }) {
  const triggerAction = useTriggerAction();
  const badge = action ? (
    <Badge variant={variant ?? "secondary"} asChild>
      <button
        type="button"
        className="cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() =>
          triggerAction(text, undefined, {
            type: action.type ?? BuiltinActionType.ContinueConversation,
            params: (action as { params?: Record<string, unknown> }).params,
          })
        }
      >
        {text}
      </button>
    </Badge>
  ) : (
    <Badge variant={variant ?? "secondary"} tabIndex={hint ? 0 : undefined}>
      {text}
    </Badge>
  );
  if (!hint) return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-64">{hint}</TooltipContent>
    </Tooltip>
  );
}

export const Tag = defineComponent({
  name: "Tag",
  props: TagSchema,
  description: "Styled tag/badge. Used inside TagBlock. Optional hint shows a tooltip; optional action makes it clickable.",
  component: ({ props }) => (
    <TagView text={props.text} variant={props.variant} hint={props.hint} action={props.action as ActionSchema} />
  ),
});

export const TagBlock = defineComponent({
  name: "TagBlock",
  props: z.object({
    tags: z.array(z.union([z.string(), Tag.ref])),
  }),
  description: "Group of tags. Accepts string array or Tag references.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tags = (props.tags ?? []) as any[];
    return (
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) =>
          typeof tag === "string" ? (
            <TagView key={i} text={tag} />
          ) : (
            <TagView
              key={i}
              text={String(tag?.props?.text ?? "")}
              variant={tag?.props?.variant}
              hint={tag?.props?.hint}
              action={tag?.props?.action}
            />
          ),
        )}
      </div>
    );
  },
});

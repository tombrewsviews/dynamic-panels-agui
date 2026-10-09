# Agent UI with OpenUI

Agents don't answer in prose; they answer in **OpenUI Lang**, a compact,
streamable description of a card built from a fixed component library. The
host renders it with `<Renderer>` and handles the actions it emits. The same
pipeline renders mock strings, deterministic app-built cards and live LLM
output.

Packages (pinned, verified together): `@openuidev/react-lang@0.3.0`,
`@openuidev/lang-core@0.3.0`, `@openuidev/react-ui@0.16.3`,
`@openuidev/react-headless@0.16.3`, dev `@openuidev/cli@0.4.1`.

## 1. OpenUI Lang in one screen

```
root = Card([hdr, tbl, actions])
hdr = CardHeader("Analysis", "3 entities scored")
tbl = Table([Col("Entity"), Col("Score", "number")], [["Alpha", 94], ["Beta", 88]],
            [{ type: "open_entity", params: { id: "e1" } }, { type: "open_entity", params: { id: "e2" } }])
actions = Buttons([Button("Open tool", { type: "open_tool" }, "default"), Button("Re-run", { type: "rerun_step", params: { step: "results" } }, "outline")])
```

- One statement per line: `identifier = Component(arg1, arg2, …)`.
- Arguments are **positional, in the order of the component's zod schema**
  (see `references/components.md`). Trailing optional args can be omitted;
  to skip a middle optional array pass `[]`.
- Values: JSON strings, numbers, booleans, arrays `[...]`, objects
  `{ key: value }` (bare keys), and references to other identifiers.
- `root` must be a `Card` (the library root). References may be defined after
  use, which is what makes streaming work: the root line arrives first and the
  children fill in as their lines stream.
- The Renderer tolerates incomplete input mid-stream; pass the growing string
  on every chunk.

When the **app** writes Lang (mocks, deterministic cards, re-renders after
state changes), use the builders in `src/lib/genui/lang.ts` (`s`, `list`,
`rows`, `cols`, `action`, `btn`) so every value is escaped.

## 2. Rendering

```tsx
<div className="ws-genui">
  <Renderer response={lang} library={shadcnChatLibrary} isStreaming={streaming} onAction={onAction} />
</div>
```

- Always wrap in `.ws-genui` (card padding 1rem, gap .75rem, no shadow).
- In a context panel, key the wrapper by the payload (`key={JSON.stringify(ctx)}`)
  so form state never leaks between items.
- `isStreaming` disables Buttons until the card is complete.

## 3. Actions: how cards drive the app

Every interactive component takes `action`:

| Action | Shape | Who handles it |
|---|---|---|
| Continue | `{ type: "continue_conversation", context? }` | host: send the button label (`e.humanFriendlyMessage`) as a user turn; if `e.formName` is set, read `e.formState` |
| Open URL | `{ type: "open_url", url }` | built in |
| Custom | `{ type: "your_verb", params: { … } }` | host `onAction` switch |

Custom verbs are the bridge from agent output to the panel system. Name them
`verb_object`, keep params flat strings, and handle each in **one** place:

```ts
case "open_entity":  return openContext({ kind: "entity", itemId: id, id: String(p.id) });
case "open_tool":    return openTool();
case "rerun_step":   return rerunStep(id, p.step as StepKind);    // appends a NEW card
case "remove_entity":return toast.success("Removed", { action: { label: "Undo", onClick: undo } });
case "hitl_approve" / "hitl_retry" / "hitl_abort": return resolveStep(…);
```

Rules:
- A button whose effect happens **in the app** (open a panel, re-run, attach,
  remove) must use a custom action, never `continue_conversation`. Otherwise
  the click is echoed as a user bubble and a generic reply.
- Re-running a step **appends a fresh card** for that step (no user bubble,
  no "got it" reply). Step chips always jump to the **latest** card of that
  step (`querySelectorAll('[data-step=x]')`, take the last one, then `.ws-flash`).
- Cards stay live: when app state changes (attach/remove), re-render the
  affected completed cards in place from state (`content: widgetFor(step, …)`).

## 4. The thread model

```ts
interface ThreadMessage { id; role: "agent" | "user"; step?: StepKind; state?: StepState;
                          confidence?: "High" | "Medium" | "Low"; content: string /* Lang or plain text */ }
interface Thread { messages; revealed: number; pos: number }   // progressive reveal cursor
```

- **Workflow steps**: an item runs ordered agent steps (`STEPS`), each producing
  one card with `step` set. `buildSteps` stops after the first step that isn't
  `completed`.
- **Step states** (`StepStateLabel`): `pending` · `running` (skeleton +
  spinner, info) · `paused` (needs review, warn, Low confidence) ·
  `completed` (Completed · Auto, ok) · `failed` (destructive).
- **Message header**: Bot tile · agent name · "Step n" · state · confidence
  badge · `Why?` (opens the audit context panel for that step).
- **Progressive reveal (mock/replay)**: an interval (24ms) advances `pos` by
  56 chars; when a message is fully shown, the next one reveals. Live
  streaming writes `content` directly instead.
- **Auto-scroll**: pinned to bottom unless the user scrolled up (>48px from the
  bottom); re-pinned when the user acts (send, re-run).
- **Step chips** under the panel header: one per step, disabled until the step ran,
  with compact state icon and optional count; click to jump.

## 5. Human-in-the-loop

A paused step renders an Alert (warning) and a `Form` whose name starts with
`hitl_`, with a TextArea and buttons: **Continue** (`continue_conversation`, validates
the form), **Use suggestion** (`hitl_approve`), **Skip step** (`hitl_abort`).
A failed step offers **Retry** (`hitl_retry`) and **Skip step**. While a step waits,
the chat input placeholder changes to "Add the missing context to unblock this
step…" and any typed message answers the step. Resolving puts the
human's answer above the resumed output and runs the following steps.

## 6. Going live

`src/app/api/chat/route.ts` is an OpenAI-compatible SSE proxy to the
Thesys/OpenUI gateway (`https://api.thesys.dev/v1/embed`):

1. The system prompt is `generateSystemPrompt({ cloud: true, library: spec })`
   from `src/generated/spec.json` (`npm run generate`, which runs automatically
   before dev/build). It teaches the model the exact component signatures,
   groups, rules and examples from `src/lib/genui/index.tsx`.
2. `tool-loop.ts` runs server-side function tools (declare them in
   `src/lib/app-tools.ts`) and streams only final assistant text.
3. The client (`agent-client.ts → streamAgent`) parses `data:` events and
   passes the growing Lang to the thread message.
4. Enable with `THESYS_API_KEY` in `.env.local` (server-only, created by the
   user, never committed, never echoed) and `NEXT_PUBLIC_AGENT_LIVE=1`. The
   model id lives in `src/lib/env.ts`.

To steer the model toward your custom actions, add them to
`shadcnAdditionalRules` (e.g. *"To open an entity use
`{ type: \"open_entity\", params: { id } }` on Table rowActions."*) and
regenerate the spec.

## 7. Extending the library

```tsx
export const Metric = defineComponent({
  name: "Metric",
  props: z.object({ label: z.string(), value: z.string(), action: actionSchema }),
  description: "Single KPI with optional click action.",
  component: ({ props }) => { const trigger = useTriggerAction(); … },
});
```

Then: add it to `createLibrary({ components })`, to a `componentGroups`
entry, and to `ContentChildUnion` in `unions.ts` (so Card accepts it); run
`npm run generate`. Build components only from `@/components/ui` primitives and
tokens so generated UI matches native UI. Accept `actionSchema` and fire with
`useTriggerAction()(label, formName, { type, params })`.

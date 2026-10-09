---
name: dynamic-panels-agui
description: "Build a new agent-first web app with a dynamic collapsible-panels workspace, shadcn/ui and OpenUI generative UI (AG-UI). Installs a self-contained kit into a Next.js app: design tokens and style guide (replaces a separate design system), all 62 shadcn/ui components, the OpenUI genui component library with actions, the fluid panel engine (layouts, rails, back stack, mobile), agent thread with streaming step cards and human-in-the-loop, slash-command chat inputs, and a live /api/chat route. Use when the user wants to start or restyle an app 'like the panels workspace', an agentic workspace, an AG-UI or OpenUI app, generative UI cards in panels, collapsible or fluid panels, a list → detail → context → tool layout, or says 'use the dynamic panels skill'. Not for marketing sites or single-page forms."
---

# Dynamic panels AG-UI

A complete, content-free kit for agent-first productivity apps. The app is
one row of always-mounted panels that re-proportion as the user goes deeper
(list → detail → context → tool), and agents answer with OpenUI cards whose
buttons drive those panels. This skill is the design system: follow
`references/style-guide.md` exactly instead of inventing styles.

## What gets installed

| Path in the app | What |
|---|---|
| `src/app/globals.css` | Tokens (light + dark), Tailwind v4 theme mapping, OpenUI layer, motion classes `ws-*` |
| `src/app/layout.tsx` | Geist fonts, ThemeProvider (`data-theme`), TooltipProvider, Toaster |
| `src/components/ui/*` | 62 shadcn/ui components (new-york, neutral, lucide) |
| `src/lib/genui/*` | OpenUI library: 59 components, actions, rules, examples, selection context, `lang.ts` builders |
| `src/components/workspace/*` | Panel engine and chrome: FluidSlot, Rail, PanelHeader, ChatInput, AgentMessage, status, TopBar, shell, placeholder panels |
| `src/lib/workspace/*` | `layout.ts` (layouts / parents / mobile), `store.ts` (zustand navigation + threads), `widgets.ts` (Lang cards), `types.ts`, `agent-client.ts`, `demo-data.ts` (placeholder) |
| `src/app/api/chat/route.ts`, `src/lib/{tool-loop,cloud-prompt,app-tools,env}.ts` | Live agent: OpenUI gateway proxy with server tools |
| `src/library.ts`, `src/generated/spec.json` | OpenUI CLI entry and generated spec (system prompt source) |

Stack: Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, zustand,
sonner, lucide, radix-ui, OpenUI (`@openuidev/react-lang` 0.3.0).

## Workflow

### 1. Install

```bash
<skill-dir>/scripts/setup.sh <app-dir>          # new dir → creates the Next.js app first
<skill-dir>/scripts/setup.sh <app-dir> --force  # existing app, overwrite instead of *.bak
```

The script installs pinned dependencies, copies `template/`, adds the
`generate` / `predev` / `prebuild` scripts, generates the OpenUI spec and type-checks.
If it is an existing app with its own `globals.css` / `layout.tsx`, merge the
`.bak` copies back by hand: keep this kit's tokens and layer order.

Run `npm run dev` and confirm the placeholder workspace works before changing anything.

### 2. Read the references before designing

- `references/style-guide.md`: tokens, type, spacing, radius, states, motion, writing. **Binding.**
- `references/panels.md`: the collapsible-panels model and how to adapt it.
- `references/agui-openui.md`: OpenUI Lang, actions, thread, HITL, going live.
- `references/components.md`: every component and exact genui signatures.
- `references/interactions.md`: input, list, thread, panel and feedback patterns plus a11y.

### 3. Map the new domain onto the shapes

Before writing code, write this mapping down and confirm it with the user if it's ambiguous:

| Kit concept | Your app |
|---|---|
| Item (list row) | the unit of work, e.g. ticket / deal / case |
| Detail thread steps (`StepKind`, `STEPS`, `STEP_META`) | the agent workflow for one item |
| Context payload kinds | things agent output links to |
| Tool + side | the big task surface and its secondary panel |
| `ItemStatus` | lifecycle states, each mapped to one tone (warn / destructive / info / ok / muted / done) |
| Custom actions | verbs cards can trigger (`open_x`, `rerun_step`, `remove_x`…) |

### 4. Replace content, keep the system

1. Replace `demo-data.ts` with real data or API calls. **No placeholder strings
   ship.** Nothing in this kit's text belongs to a previous app.
2. Rename types and slots (`types.ts`, `layout.ts`), keeping the six layout shapes.
3. Rewrite `widgets.ts` cards for your steps, using `lang.ts` builders and only
   the components in `references/components.md`.
4. Rename and fill `ItemList`, `ItemDetail`, `ContextPanel`, `ToolPanel`, `SidePanel`.
   Native React panels (forms, profiles) can replace a context `kind`.
5. Handle every custom action in exactly one `onAction` switch per panel.
6. Brand only through tokens: change `--primary`, `--ring`, `--canvas`,
   fonts and radius in `globals.css`, in both themes. Keep the status tones.
7. Going live: the user puts `THESYS_API_KEY` in `.env.local` themselves; set
   `NEXT_PUBLIC_AGENT_LIVE=1`; add custom-action rules to
   `shadcnAdditionalRules`; run `npm run generate`. Never write, echo or commit a key.

### 5. Verify (required before calling it done)

- `npx tsc --noEmit` passes; `npm run build` passes.
- Drive it in a browser (Playwright or Chrome): every layout is reachable; Esc
  walks `PARENT` back to overview; rails expand; ↑↓ / Enter work in the
  list from first load; `/` opens the slash menu; a card link opens a context
  panel and marks the row selected; re-run appends a card and the chip jumps
  to it; HITL resolves; dark mode and a 420px viewport look right; the console
  has no errors.

## Hard rules

- Colour means status. Neutral UI everywhere else; never raw palette classes in app code.
- Panels never overlay content; deeper surfaces re-proportion the row. Modals
  only for confirmations and genui `DialogBlock` / `DrawerBlock`.
- One filled (`default`) button per action group.
- In-app effects use custom actions, never `continue_conversation`.
- Every slot stays mounted; reset state per item with `key`, not unmounting.
- No icons on rails. No text above `text-lg` in the workspace.
- All motion through `--ws-ease` / `--ws-dur`; respect reduced motion.

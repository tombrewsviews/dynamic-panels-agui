---
name: dynamic-panels-agui
description: "Build a new agent-first web app with a dynamic collapsible-panels workspace, shadcn/ui and OpenUI generative UI (AG-UI). Installs a self-contained kit into a Next.js app: design tokens and style guide (replaces a separate design system), all 62 shadcn/ui components, the OpenUI genui component library with actions, the fluid panel engine (layouts, rails, back stack, mobile), agent thread with streaming step cards and human-in-the-loop, slash-command chat inputs, and a live /api/chat route. Use when the user wants to start or restyle an app 'like the panels workspace', an agentic workspace, an AG-UI or OpenUI app, generative UI cards in panels, collapsible or fluid panels, a list → detail → context → tool layout, or says 'use the dynamic panels skill'. On an existing project it changes the interface layer only: data, APIs, server code, auth and config stay untouched. Not for marketing sites or single-page forms."
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
<skill-dir>/scripts/setup.sh <app-dir>
```

The script picks the mode itself:

- **New app** (no `package.json`): creates the Next.js app, installs pinned
  dependencies, copies all of `template/`, adds the `generate` / `predev` /
  `prebuild` scripts, generates the OpenUI spec and type-checks. Run
  `npm run dev` and confirm the placeholder workspace works before changing anything.
- **Existing app** (`package.json` present): plan first, ask, then apply the
  **interface layer only**. Follow "Existing project" below.

## Existing project: interface layer only

When the app already exists, this skill restyles and restructures its UI. It
does not change what the app does. Treat the boundary as binding:

| Change (interface layer) | Never change |
|---|---|
| Components, pages' JSX, layouts' providers and wrappers | API routes, route handlers, server actions, middleware |
| Styles: `globals.css` tokens, Tailwind classes, fonts | Data fetching and mutation logic, API clients, query keys, caches |
| UI-only client state (layout key, selection, open panels, drafts) | Database, ORM, schemas, migrations, validation rules |
| `src/components/ui`, `src/lib/genui`, `src/components/workspace`, `src/lib/workspace` | Auth, permissions, env files, secrets |
| Copy (labels, placeholders, empty states, toasts) | Business rules, domain types, state machines, calculations |
| Adding missing UI packages | `next.config`, `tsconfig`, `postcss`, ESLint, npm scripts, CI, package upgrades or removals |

### Plan, ask, apply

The interface changes are always applied in full: tokens, providers, the
mounted shell and the extended components. What needs the user's consent is
anything that **installs** something or **replaces** something the app
already has.

1. **Plan** (changes nothing):
   `<skill-dir>/scripts/setup.sh <app-dir> --plan`. It lists the files it will
   add, the existing files that differ from the kit, the missing UI packages
   and any blockers (not Next.js, Tailwind below v4, no `@/*` alias).
2. **Ask once, together** (AskUserQuestion, one question per decision, a
   recommended option first):
   - **Missing packages**: show the list and ask to install it. Without
     them the kit can't compile, so if the user declines, stop and say so.
   - **Blockers**: they need config changes. Ask whether to make that change
     or stop. Never make it silently.
   - **Current interface or preview route**: by default the refactor
     applies to the app's current interface in place: its existing pages
     become the panels shell. A separate preview route (e.g. `/workspace`)
     next to the old UI is an option only, never the default: add one only
     when the user asks for it, or offer it here as the second option
     (current interface first, recommended).
   - **Overrides that change what users already see**: a token the app
     already defines with a different value (keep the app's brand, or take
     the kit's?) and a provider that already exists (reuse it, or add the
     kit's?).
   Additive changes need no question: new files, new tokens, new variants,
   new CSS classes.
3. **Apply**: `setup.sh <app-dir> --install-deps` if packages were approved,
   or plain `setup.sh <app-dir>` if nothing is missing. The script refuses to
   add files while packages are missing, so the app never ends up with
   imports that don't resolve. It adds new files only and never overwrites one.

What the script never does on an existing app: copy `app/` (pages, layout,
`globals.css`), add `/api/chat`, the server tool loop or `env.ts`, edit any
config or npm script, or install `openai`.

Then apply the rest of the interface yourself, following the user's answers:

1. **Collisions**: for each listed file (often `components/ui/*` or
   `lib/utils.ts`), compare it with `<skill-dir>/template/src/<same path>`
   and add only what the kit needs (a missing variant such as `size: "xs"` or
   `"icon-sm"`, a missing export). Never remove or change the app's existing
   variants, because other screens use them. If the kit needs an existing
   variant to *look* different, that's an override: ask.
2. **Styles**: merge `<skill-dir>/template/src/app/globals.css` into the app's
   global CSS. Add the layer order, the OpenUI import, the kit-only tokens
   (`--canvas`, `--selected`, `--status-*`, `--ws-*`), their `@theme`
   mappings and the `ws-*` / `.ws-genui` rules. Where the app already defines a
   token (`--primary`, `--radius`, fonts), use the user's answer from the plan
   step (the default is to keep the app's value, because that is its brand). Bind the kit's `dark` variant to the app's existing theme mechanism
   (class or attribute) instead of changing that mechanism.
3. **Providers**: wrap the pages that render the shell in `TooltipProvider`
   and `Toaster` (the existing layout that holds them, or the preview route's
   layout if the user chose one); use the app's existing theme provider if it
   has one.
4. **Mount**: by default render `WorkspaceShell` in the app's existing pages,
   replacing only their JSX; don't add a new route. Only if the user chose a
   preview route, add it as a new page and leave the existing pages as they
   are. Either way, data loading (server component fetches, loaders, hooks)
   stays where it is and is passed into the shell as props or through an
   adapter.
5. **Data adapter, not demo data**: replace `lib/workspace/demo-data.ts` with
   an adapter that **reads through the app's existing functions** (its hooks,
   API client, server-component props) and maps their results to the kit's
   `Item` shape. Mapping and formatting only; no new queries, endpoints or
   fields. Map the app's existing statuses onto the six tones; never add a
   status to the domain.
6. **Actions**: each custom action and each button calls a function the app
   already has (its mutation, server action or client method). If a panel
   needs a capability the backend doesn't offer, render it disabled with a
   tooltip and tell the user. Don't build it.
7. **Agent**: if the app already has an agent or chat endpoint, point
   `lib/workspace/agent-client.ts` at it and render its output. If it has none,
   leave `AGENT_LIVE` off and tell the user that the live agent needs a server
   route (`<skill-dir>/template/src/app/api/chat`), which is a backend change
   they must approve.
8. **Done check**: `git diff --stat` shows only files in the left column
   above plus `package.json` / lockfile dependency additions. Anything else gets
   reverted or raised with the user.

Whenever the interface change seems to need something from the right column,
or would replace something the app has for no reason the user gave, stop and
ask. Don't work around the boundary, and don't override silently.

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

On an existing project, the "Existing project" rules above override anything
in this step that would touch data, APIs or config.

1. Replace `demo-data.ts` with real data or API calls (existing project: an
   adapter over the app's existing functions). **No placeholder strings
   ship.** Nothing in this kit's text belongs to a previous app.
2. Rename types and slots (`types.ts`, `layout.ts`), keeping the six layout shapes.
3. Rewrite `widgets.ts` cards for your steps, using `lang.ts` builders and only
   the components in `references/components.md`.
4. Rename and fill `ItemList`, `ItemDetail`, `ContextPanel`, `ToolPanel`, `SidePanel`.
   Native React panels (forms, profiles) can replace a context `kind`.
5. Handle every custom action in exactly one `onAction` switch per panel.
6. Brand only through tokens: change `--primary`, `--ring`, `--canvas`,
   fonts and radius in `globals.css`, in both themes. Keep the status tones.
7. Going live (new apps; existing apps follow "Existing project" step 7): the user puts `THESYS_API_KEY` in `.env.local` themselves; set
   `NEXT_PUBLIC_AGENT_LIVE=1`; add custom-action rules to
   `shadcnAdditionalRules`; run `npm run generate`. Never write, echo or commit a key.

### 5. Verify (required before calling it done)

- `npx tsc --noEmit` passes; `npm run build` passes. On an existing project,
  no new errors compared with before the install, and the boundary check
  (`git diff --stat`) is clean.
- Drive it in a browser (Playwright or Chrome): every layout is reachable; Esc
  walks `PARENT` back to overview; rails expand; ↑↓ / Enter work in the
  list from first load; `/` opens the slash menu; a card link opens a context
  panel and marks the row selected; re-run appends a card and the chip jumps
  to it; HITL resolves; dark mode and a 420px viewport look right; the console
  has no errors.

## Hard rules

- Existing project: apply the interface layer only. Never touch data, APIs,
  server code, auth, env or config. Get consent before installing packages
  and before overriding anything the app already has.
- Existing project: refactor the current interface in place. Add a preview
  route (e.g. `/workspace`) only when the user asks for one or accepts it
  when offered.
- Colour means status. Neutral UI everywhere else; never raw palette classes in app code.
- Panels never overlay content; deeper surfaces re-proportion the row. Modals
  only for confirmations and genui `DialogBlock` / `DrawerBlock`.
- One filled (`default`) button per action group.
- In-app effects use custom actions, never `continue_conversation`.
- Every slot stays mounted; reset state per item with `key`, not unmounting.
- No icons on rails. No text above `text-lg` in the workspace.
- All motion through `--ws-ease` / `--ws-dur`; respect reduced motion.

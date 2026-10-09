# dynamic-panels-agui

A Claude Code skill that sets up a brand-new **agent-first web app**. The app
uses a **dynamic collapsible-panels** workspace, **shadcn/ui** and **OpenUI**
generative UI (AG-UI). It is self-contained, ships no project content and
works as the design system.

```bash
git clone git@github.com:tombrewsviews/dynamic-panels-agui.git ~/.claude/skills/dynamic-panels-agui
~/.claude/skills/dynamic-panels-agui/scripts/setup.sh my-app && cd my-app && npm run dev
```

## What you get

- **Panels**: one row of always-mounted panels driven by a single layout key:
  `overview → focus → context → context2`, `tool → toolSide`. Panels animate
  width on one curve; collapsed panels become clickable rails; Esc walks back;
  below 768px one panel shows at a time.
- **Agent UI**: agent steps stream as OpenUI cards (tables with row actions,
  sections and row buttons; alerts with linked items; forms; charts…). Card
  buttons drive the panels through custom actions. Includes human-in-the-loop
  steps, re-run, Why? audit, step chips that jump to the latest card, and
  cross-panel selected rows.
- **Input**: a chat input docked in every panel with a `/` slash-command
  menu, type-to-chat from anywhere, a ⌘K palette, and roving keyboard lists.
- **Design system**: tokens for light and dark, type, spacing, radius, states,
  motion and writing rules (`references/style-guide.md`).
- **Live agent**: an `/api/chat` SSE route to the OpenUI gateway with a
  server-side tool loop. Bring your own `THESYS_API_KEY`.

## Layout

```
SKILL.md                 workflow and hard rules (entry point for the agent)
references/              style guide, panels, AG-UI/OpenUI, components, interactions
template/                files copied into the app (src/…, configs, .env.example)
scripts/setup.sh         create or patch a Next.js app, install deps, copy, generate, type-check
```

Verified with Next.js 16.2.6, React 19.2, Tailwind 4, `@openuidev/react-lang` 0.3.0.

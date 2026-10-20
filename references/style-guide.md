# Style guide

The complete visual language. If a decision isn't covered here, pick the
nearest rule below; do not invent new values. Every value maps to a token in
`template/src/app/globals.css` or a Tailwind v4 default.

## Principles

1. **Monochrome first, colour means status.** Surfaces, text and controls are
   neutral (oklch chroma 0). Colour appears only to carry meaning: status-ok
   (green), status-warn (amber), status-info (blue), destructive (red), and
   charts. Never use colour for decoration or branding inside the workspace.
2. **Panels are cards on a canvas.** The app background is `--canvas`; every
   surface is a rounded card (`rounded-2xl border bg-card shadow-xs`) with 8px
   between cards. Nothing floats over the canvas except overlays.
3. **Density of a productivity tool.** Body text is 14px; metadata is 12px.
   Rows are about 44 to 56px tall. Use whitespace through consistent gaps, not big
   paddings.
4. **One motion curve.** Everything that moves uses `--ws-ease`
   (`cubic-bezier(0.65, 0, 0.35, 1)`). Layout changes take `--ws-dur` (560ms);
   entrances 320ms. All of it collapses to 1ms under `prefers-reduced-motion`.
5. **Agent output is the same UI as hand-built UI.** OpenUI components render
   the same shadcn primitives and tokens, so you can't tell generated cards from
   native ones.

## Colour tokens

Both themes are defined; the theme is switched with `data-theme="light|dark"`
on `<html>` (next-themes, `attribute="data-theme"`, default `system`). The
`dark:` variant is bound to `[data-theme="dark"]`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--canvas` | `#f2f4f8` | `oklch(0.17 0.008 260)` | App background behind panels. Only the shell root uses `bg-canvas`. |
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | Inputs, page fallback |
| `--card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Every panel and agent card |
| `--popover` | white | `oklch(0.269 0 0)` | Menus, tooltips, toasts, command palette |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary text |
| `--muted-foreground` | `oklch(0.5 0 0)` | `oklch(0.76 0 0)` | Secondary text, metadata, placeholders (AA ≥ 4.5:1 on card, muted and selected) |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` | Default buttons, user chat bubbles, active badges |
| `--secondary` / `--muted` / `--accent` | `oklch(0.97 0 0)` | `0.269 / 0.269 / 0.371` | Secondary buttons, hover fills, section rows, skeletons |
| `--border` / `--input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` / `15%` | All 1px borders |
| `--ring` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | Focus rings **and** the selected-state outline (≥ 3:1) |
| `--selected` | foreground 8% over background | 20% | Fill of the selected/active item (see "Selected / active state" below) |
| `--status-ok` | `oklch(0.45 0.11 155)` | `oklch(0.78 0.14 155)` | Completed, ready, covered |
| `--status-warn` | `oklch(0.47 0.12 55)` | `oklch(0.82 0.14 75)` | Needs the human, paused, low confidence, urgent |
| `--status-info` | `oklch(0.46 0.15 255)` | `oklch(0.78 0.12 255)` | Running, informational, "learning applied" |
| `--destructive` | `oklch(0.47 0.19 27)` | `oklch(0.75 0.17 22)` | Failed, errors, destructive actions |
| `--chart-1…5` | warm/teal set | blue/green/amber/violet/rose set | Charts only |

### Status tints, the only allowed recipe

A status colour is used as **text + 15% fill + 30% border**:
`bg-status-warn/15 text-status-warn border-status-warn/30`. For destructive,
the fill is 10%: `bg-destructive/10 text-destructive border-destructive/30`. The
"done" state inverts: `bg-status-ok text-background`. Dots use the solid
colour (`bg-status-ok`); "running" dots pulse (`animate-pulse`).

Never use raw Tailwind palette colours (`text-green-600`) in app code. The one
exception is inside `genui/components/alert.tsx`, which maps Alert variants
to Tailwind blue, green and amber tints for both themes.

## Typography

Font: **Geist Sans** (`--font-sans`) and **Geist Mono** (`--font-mono`), loaded via
`next/font/google` in `layout.tsx`. `antialiased` on body. Numbers that update
or align use `tabular-nums`.

| Role | Classes | Size / weight |
|---|---|---|
| Panel title | `text-sm font-semibold leading-tight` | 14 / 600 |
| Panel subtitle, row metadata | `text-xs text-muted-foreground` | 12 / 400 |
| Body, row titles, chat | `text-sm` (row title `font-medium`, selected row `font-semibold`) | 14 / 500 |
| Card title (agent cards) | `CardTitle`: `leading-none font-semibold` (16px inherited) | 16 / 600 |
| Card description | `text-sm text-muted-foreground` | 14 / 400 |
| Large callout (TextContent large-heavy) | `text-lg font-semibold` | 18 / 600 |
| Badges, chips, toggles | `text-xs font-medium` | 12 / 500 |
| Confidence badge, key hints | `text-[11px]` | 11 |
| Signal tag (ACT / FYI) | `text-[10px] uppercase` in an outline badge, `h-4 px-1` | 10 |
| Vertical rail label | `text-sm font-medium [writing-mode:vertical-rl] rotate-180` | 14 / 500 |
| App name | `text-sm font-semibold`; mark `text-[11px] font-bold tracking-tight` | — |

Never go above `text-lg` inside the workspace. Headings inside agent output
use the `Heading` component (h1 to h4), which applies shadcn typography.

## Spacing and sizing

Tailwind's 4px scale only. The values below are fixed.

| Element | Value |
|---|---|
| Shell padding / gap between bar and row | `p-2` / `gap-2` (8px) |
| Gap between panels | each slot `px-1` (4px each side, so 8px between cards); the row is `-mx-1` |
| Divider | `w-4` hit area centred on the gap (`absolute -translate-x-1/2`), takes no width; grip `h-8 w-3`, vertically centred |
| Top bar | `h-12 rounded-2xl border bg-card px-3 shadow-xs`, items `gap-3` |
| Panel header | `min-h-14 px-4 py-2.5 border-b gap-2` |
| Sub-header strip (filters, step chips) | `px-4 py-2 border-b`, items `gap-1.5` (filters) / `gap-1` (chips) |
| Panel body padding | `p-4`; lists `p-2 pr-3` with `gap-1` between rows |
| List row | `rounded-xl px-3 py-2.5`, grid `grid-cols-[auto_1fr] gap-x-3 gap-y-1` |
| Agent thread | `mx-auto max-w-3xl flex flex-col gap-6 p-4` |
| Agent card inner | `.ws-genui [data-slot=card]`: `gap: .75rem; padding: 1rem; box-shadow: none` |
| Chat input dock | `p-3 pt-2`; InputGroup `rounded-xl bg-background`; textarea `min-h-10 max-h-32 py-2.5 text-sm` |
| Rail | 6% width; content `py-4 gap-3`, count badge `px-1.5 tabular-nums` |
| Icons | lucide, `size-4` default, `size-3.5` in headers and chips, `size-3` in badges |
| Panel min-widths | list 232, detail 340, context 280, tool 420, side 260 (px) |

## Radius

`--radius: 0.625rem` (10px). `rounded-md` = 8px (buttons, inputs, tables),
`rounded-lg` = 10px (menus, small tiles), `rounded-xl` = 14px (rows, chat input,
skeleton boxes), `rounded-2xl` = 16px (panels, top bar), `rounded-full`
(badges, chips, toggles, status dots). User bubbles are `rounded-2xl rounded-br-md`.

## Elevation

Flat. Panels and the bar use `shadow-xs`; agent cards inside panels have
**no** shadow (the `.ws-genui` rule removes it). Overlays (popover, dialog,
command, toast) use their shadcn defaults. Do not add shadows elsewhere.

## Controls

- **Buttons**: shadcn sizes. `xs` h-6 for in-row and toolbar actions, `sm` h-8
  for card actions, `default` h-9 for forms, `icon-sm` (32px) for panel header
  icons. One `default` (filled) button per group: the main move. Everything
  else is `outline`, `secondary` or `ghost`. Destructive moves that are cheap
  to undo get `ghost` + an Undo toast, not a confirm dialog.
- **Toggles as filter pills**: `Toggle size="sm" variant="outline"` +
  `h-7 rounded-full px-3 text-xs data-[state=on]:border-foreground/30`.
- **Step chips**: `rounded-full border px-2.5 py-1`, label `text-xs font-medium`,
  optional count `text-xs tabular-nums text-muted-foreground`, and a compact
  state icon. Disabled until the step has run (`disabled:opacity-60`).
- **Badges**: `outline` for status (with tint recipe), `secondary` for neutral
  counts and tags.
- **Tables**: `rounded-md border` wrapper; section rows `bg-muted/50 py-1.5 text-xs`
  with the label `font-medium` and the detail `text-muted-foreground tabular-nums`
  right-aligned; numeric columns right-aligned with `tabular-nums`; row buttons
  `xs ghost` in a trailing `w-0` column.

## States

| State | Recipe |
|---|---|
| Hover (rows) | `hover:bg-foreground/[0.04]` |
| Hover (buttons, chips) | `hover:bg-accent` |
| Focus | `focus-visible:ring-2 ring-ring` (rows add `ring-offset-1 ring-offset-background`); never remove focus without a replacement |
| Selected list row | `bg-selected ring-2 ring-ring` + `aria-current` + title `font-semibold` |
| Selected nav / tab item (no ring) | `bg-selected text-foreground` + `aria-current`; resting `text-muted-foreground hover:bg-accent hover:text-foreground` |
| Selected table row (item open in a side panel) | `bg-muted font-medium shadow-[inset_3px_0_0_var(--ring)]` + `aria-current` |
| Pressed toggle | `aria-pressed`, `bg-selected` or `data-[state=on]:border-foreground/30` |
| Disabled | `opacity-50` (buttons) / `opacity-60` (chips); keep a tooltip explaining why |
| Loading agent step | three `Skeleton` bars (`h-4 w-1/3`, `h-3 w-5/6`, `h-3 w-2/3`) in `rounded-xl border p-4` |
| Empty | shadcn `Empty` with a title and one-line next step ("Clear a filter or change the search.") |
| Jump target | `.ws-flash` (3px ring pulse, 1.4s) on the element scrolled to |
| Divider grip (gap between full panels) | hidden until hover, focus or drag; `h-8 w-3 rounded-full bg-card ring-1 ring-border shadow-xs`, `GripVertical size-3.5 text-muted-foreground`; focus adds `ring-2 ring-ring` |

### Selected / active state — make the fill carry its own weight

`--selected` is the active fill for nav items, open list rows and pressed
toggles. A nav item (the left-rail "Pain points", a top-bar tab) has **no ring**
— `bg-selected` is the *only* thing marking it active, so the fill must be
clearly visible on `bg-card` and clearly stronger than the hover tint
(`bg-accent`) in both themes.

Two traps the first version fell into, and the rule that fixes them:

- **It was far too faint** (foreground 3% light / 6% dark). On a list row the
  `ring-2 ring-ring` did the work and hid the problem; on a ring-less nav item
  the active state was nearly invisible.
- **Dark is painted on the wrong surface.** `--selected` is mixed against
  `--background` (0.145) but the nav sits on the lighter `--card` (0.205). A
  small mix therefore lands *darker than the card* and vanishes — and worse,
  hover (`bg-accent`, 0.269) ends up more prominent than the active item. The
  dark percentage must be large enough to clear both the card and hover.

So the two themes carry **different** percentages by design (that's why `:root`
and the dark block set `--selected` separately): light **8%** (a gentle grey on
the white card, darker than the 0.97 hover), dark **20%** (~0.31 lightness,
comfortably above card 0.205 and hover 0.269). When you retune any neutral,
re-check that an active nav item still beats its own hover in **both** themes.

## Motion

```css
--ws-ease: cubic-bezier(0.65, 0, 0.35, 1);
--ws-dur: 560ms;
.ws-slot   { transition: width, padding, opacity var(--ws-dur) var(--ws-ease) }
.ws-layer  { opacity 0 → 1, fades out in 45% of dur, fades in after a 40% delay }
.ws-enter  { 320ms translateY(6px) → 0, opacity 0 → 1 }   /* new messages, chips */
.ws-flash  { 1.4s ring pulse }                             /* jump-to highlight */
.ws-divider { transition: left var(--ws-dur) var(--ws-ease) } /* moves with the columns */
[data-resizing] .ws-slot, [data-resizing] .ws-divider { transition: none } /* a drag tracks the pointer */
```

Panels never slide over content; columns resize together. A divider drag is
the one exception to easing: while it is on, nothing animates, or the column
chases the pointer and the app reads as slow. Use `.ws-enter`
for anything appended (messages, filter chips, Clear buttons).

## Iconography

lucide-react only. Stroke icons, never filled, except the urgent `ZapIcon`
(`fill-status-warn`). Icons in buttons sit before the label. Panel rails have
**no icons**: a count badge plus a vertical label. Agent identity is `BotIcon`
in a `size-6 rounded-md bg-muted` tile.

## Writing

- Sentence case everywhere. No ALL CAPS except the 10px ACT and FYI tags.
- Labels say what happens: "Open tool", "Re-run with updated context", "Skip step".
- Status hints explain *why* and *what next* in one line ("A step failed:
  retry or skip it").
- Counts read "n of m" or "n / m · detail"; use `·` (middle dot) as the
  separator in metadata lines.
- Toasts: past tense + object ("Removed Entity Alpha"), with an **Undo**
  action when reversible.
- Placeholders end with an ellipsis and mention the slash menu when it exists
  ("Ask, correct or teach · / for agents").

# Interaction patterns

Where the template implements a pattern, the file is named in brackets. The rest are specs to build from the listed components.

## Input

- **Every panel docks a ChatInput at the bottom** (`chat-input.tsx`). It plays
  one of three roles: *filter* (controlled `value`/`onChange`, filters live as
  you type: list and tool panels), *message* (`onSubmit` to the agent:
  detail panel), *command* (`commands` + `onCommand`, typed as `/name args`).
  One input per panel, always in the same place.
- **Slash menu**: typing `/` opens the panel's command list above the input:
  icon tile, `/name <arg>`, title, "to …" description, and a key-hint strip
  (↑↓ to move · ⏎ to run · esc closes). Tab also runs the highlighted command.
  Commands with `arg` fill `/name ` and wait. A fully typed `/name args` runs on
  Enter. Esc closes the menu before anything else sees it.
- **Type-to-chat** (`workspace-shell.tsx`): a printable key pressed anywhere
  (not in a field or menu) focuses the chat input of the panel last focused
  or clicked, and the character lands in it.
- **⌘K palette** (`top-bar.tsx`): items first, then actions; selecting closes it
  and performs the action.

## Lists

- **Roving focus** (`item-list.tsx`): only the selected row is tabbable;
  ↑↓/Home/End move focus *and* selection without changing the layout; Enter
  opens. On load, focus starts on the selected row.
- **Click vs double-click**: click selects immediately and switches layout after
  220ms; double-click cancels that and goes to the overview.
- **Sort for action**: rows needing the human come first (attention, failed, ready…).
- **Signals**: a third line with a bell, an ACT/FYI tag and one-line reason; ACT
  in warn colour.
- **Container queries** (`@container`, `@md:`, `@xl:`): rows reveal timestamp
  and status badge only when the *panel* is wide enough, not the viewport.
- **Quick filters**: outline toggle pills in a strip under the header; a
  **Clear** ghost pill appears (`ws-enter`) when any filter is on.
- **Pagination** past 25 rows; reset to page 1 when filters change.
- **Grouped lists**: group by a meaningful band (for example strong / good / weak
  matches) with collapsible headers showing counts; the important groups start
  open; each group can offer a bulk action ("Add all"). A threshold slider in
  the side panel moves items between groups.

## Agent thread

- **Steps as cards**, each with a header (agent, step n, state, confidence, Why?).
- **Step chips** jump to the *latest* card of the step and flash it (`.ws-flash`).
- **Re-run appends** a new card for that step. No user bubble, no "got it" reply.
- **Live cards**: when state changes elsewhere (an item attached in the tool
  panel), completed cards that show that state re-render in place, and the
  panel scrolls to the affected step (`focusStep` nonce).
- **Human-in-the-loop**: paused cards hold a small form plus Continue / Use
  suggestion / Skip step; the input placeholder switches to "Add the missing
  context to unblock this step…".
- **Why?** opens an audit card (inputs, rules, checks) in the context panel.
- **Learning applied** banner (dashed border, info sparkle) at the top of the
  thread when a saved rule shaped the run.

## Panels

- Links in cards open **context panels**, never modals. Rows whose item is
  open show as selected in every table (`OpenItemProvider`).
- Edit-in-place: clickable tags or rows (for example "Edit priority") replace
  the context panel with a focused form at the same level; Save returns to
  the view and re-renders affected cards.
- Big tasks (search, compose, review) open as the **tool** surface; its
  secondary panel (filters, profile, preview) toggles beside it with an
  `aria-pressed` header button.
- Escape always steps back one level; ✕ in a panel header does the same.

## Feedback

- Toast for every state change initiated by the user; include **Undo** when it
  is reversible (remove, detach, move status).
- Status moves via a header dropdown on the status badge: lists every status
  with its hint, disables impossible moves and says why ("Set by the agents",
  "Add 2 more first").
- Counters in headers and chips use `filled/target` and update live.
- A timer on items waiting for the human (`tabular-nums`, warn when over its SLA)
  freezes at its final value when the wait ends.

## Accessibility (non-negotiable)

- Landmarks: every slot is a `<section aria-label>`; hidden slots are
  `aria-hidden` and `inert`.
- Every icon-only control has `aria-label` and a tooltip.
- Selection uses `aria-current`; toggles use `aria-pressed`; the slash menu is
  a combobox with `aria-activedescendant`.
- Contrast: text tokens hold ≥ 4.5:1 on card, muted and selected; rings and
  outlines ≥ 3:1 in both themes.
- `prefers-reduced-motion` reduces all motion to 1ms.

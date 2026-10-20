# Resizable dividers between panels

The gap between two neighbouring full panels is a **divider**: invisible until
the pointer is over it, then a small three-dot grip centred vertically.
Dragging it trades width between those two panels and nothing else. The
layouts stay the defaults; a drag is the user's adjustment on top of them,
remembered per layout.

Taken from a production port of this kit (Mattr's console, spec DP8,
2026-10-16), where the owner asked for "3 dots subtle icon that shows on hover
of the gap and will allow to drag and resize the panels freely".

Files: `src/lib/workspace/layout.ts` (`MIN_WIDTH`, `PanelPrefs`, `dividers`,
`edges`, `resizeBetween`), `src/lib/workspace/store.ts` (`prefs`,
`loadPrefs`, `setPrefs`), `src/components/workspace/divider.tsx`,
`workspace-shell.tsx` (renders them), `globals.css` (`.ws-divider`,
`[data-resizing]`).

## Requirements

- **DV1. Where.** One divider between each pair of neighbouring **full**
  panels in row order (`dividers(slots)`). None beside a rail or a hidden slot,
  none on a phone (one panel). So `overview`/`focus` have one, `context` has
  two, `context2`/`tool`/`toolSide` have one.
- **DV2. It takes no width.** The divider is `position: absolute` in the row
  (`relative`), at the left panel's right edge (`edges(slots)[a]`, % of the
  row), `w-4 -translate-x-1/2`, over the 8px gap the slots' `px-1` already
  make. It is not a flex child, so widths keep summing to 100 and nothing
  shifts when a divider appears or disappears.
- **DV3. Looks.** The grip is hidden until the gap is hovered, the divider is
  focused or a drag is on: `h-8 w-3 rounded-full bg-card ring-1 ring-border
  shadow-xs` with `GripVertical size-3.5 text-muted-foreground` (the six dots).
  Keyboard focus adds `ring-2 ring-ring` to the grip. The cursor is
  `col-resize` over the hit area and, during a drag, over the whole row.
- **DV4. Only two panels move.** `resizeBetween` changes `a` and `b` and
  nothing else; their sum stays the same, so every other column keeps its
  width. Rails are never resized (always 6).
- **DV5. Limits in pixels.** Neither panel goes under its `MIN_WIDTH` (the same
  px the `FluidSlot` uses for `minWidth`, at which its content would start to
  clip), converted to % of the row's current width. The pointer may run past
  the limit; the divider stops at it. If the row is too narrow for both
  minimums, nothing moves.
- **DV6. Measured from the drag's start.** The shell snapshots the slots on
  pointer-down and applies the pointer's *total* distance to that snapshot.
  So after running past a limit, the divider moves again only when the
  pointer comes back to it: it never drifts out from under the pointer.
  (Applying per-move deltas to the current widths makes the divider drift.)
- **DV7. Remembered per layout.** The result is stored as the full panels'
  widths for that layout (`PanelPrefs`) in `localStorage`
  (`workspace.panel-prefs.v1`), wrapped in try/catch. `resolveSlots` applies a
  layout's saved widths only if they still fit (same full slots, same total);
  otherwise the defaults. Bump the key's version when the layouts change
  shape. Other layouts are untouched by a drag.
- **DV8. Hydration-safe.** The store starts with no prefs; the shell calls
  `loadPrefs()` in an effect after the first render, so the server render
  and the first client render agree.
- **DV9. No easing while dragging.** The row carries `data-resizing` during a
  drag; under it `.ws-slot` and `.ws-divider` have `transition: none`,
  `user-select: none`. Otherwise the column eases after the pointer and the
  app feels slow. Outside a drag, `.ws-divider` transitions `left` on
  `--ws-ease`/`--ws-dur`, so dividers move with the columns on a layout change.
- **DV10. Pointer.** Primary button only; `setPointerCapture` so the drag
  survives the pointer leaving the hit area; `touch-none`; `pointercancel`
  ends the drag like `pointerup`.
- **DV11. Keyboard and assistive tech.** `role="separator"`,
  `aria-orientation="vertical"`, `aria-label="Resize <A> and <B>"`,
  `aria-valuenow` (its position, % of the row), `tabIndex={0}`. ←/→ move it by
  2% of the row from the current widths, with the same limits.

## Adapting

- Rename `MIN_WIDTH` keys with the slots; pass `MIN_WIDTH[k]` as each
  `FluidSlot`'s `minWidth` so the limit and the clip point are the same number.
- Labels in `aria-label` are the panels' visible names ("Resize Tickets and
  Ticket 42"), not slot keys.
- A panel that is a sidebar inside a page (a conversation list, a file tree)
  is not a slot. If it is resizable, use the same rules in a smaller form: a
  clamped px width, `localStorage`, transition off during the drag, and a
  `separator` with a label.
- If the app has a menu panel whose width should carry across layouts, store
  it separately from the per-layout shares and give it a % floor and ceiling.

## Verify

- `overview`: one divider at 65%; hover shows the grip; drag left past the
  list's minimum: the list stops at `MIN_WIDTH.list`, the divider stays where
  it stopped, the row has `data-resizing` only during the drag.
- Reload: the dragged widths come back; `focus` still has its defaults.
- Tab to the divider, ←/→: it moves 2% and `aria-valuenow` follows.
- `context`: two dividers; dragging one leaves the third panel's width as it
  was. `context2`: none beside the rails. 420px: none.
- Dark mode: the grip reads on `bg-card`. No console errors (hydration).

# Dynamic collapsible panels

The signature pattern: the whole app is **one row of always-mounted panels**
whose widths are driven by a single `layout` key. Opening something deeper
does not push a page or float a drawer. The row re-proportions itself:
shallower panels shrink, then collapse to 6% **rails**, and the new panel
takes the room. Back / Escape walks the same path in reverse.

Files: `src/lib/workspace/layout.ts` (the model), `src/components/workspace/fluid-slot.tsx`
(a column), `rail.tsx` (collapsed column), `panel-header.tsx`, `workspace-shell.tsx`
(composition plus global keyboard), `src/lib/workspace/store.ts` (navigation actions).

## 1. The model

```ts
type SlotMode = "full" | "rail" | "hidden";
interface SlotSpec { width: number /* % of row */; mode: SlotMode }
LAYOUTS: Record<LayoutKey, Record<SlotKey, SlotSpec>>   // widths per layout sum to 100
PARENT:  Record<LayoutKey, LayoutKey>                   // where Back/Esc goes
MOBILE_PRIMARY: Record<LayoutKey, SlotKey>              // the only slot shown below 768px
```

The six canonical shapes cover almost every app. Rename the slots to your
surfaces but keep the shapes:

| Layout | Shape | Opened by | Back to |
|---|---|---|---|
| `overview` | list 65 · detail 35 | first load; double-click a row; "Expand list" | — |
| `focus` | list 25 · detail 75 | click / Enter on a row | overview |
| `context` | list 20 · detail 52 · context 28 | a link inside agent output | focus |
| `context2` | ▌6 · ▌6 · context 44 · context2 44 | a link inside the context panel | context |
| `tool` | ▌6 · detail 35 · tool 59 | a primary task action ("Search", "Compose", "Open tool") | focus |
| `toolSide` | ▌6 · ▌6 · tool 61 · side 27 | the tool's own secondary toggle (Filters, Preview, Profile) | tool |

Rules for adding layouts:
- Widths sum to 100. A rail is always exactly 6.
- The surface the user is acting in gets the largest share (≥ 44%).
- At most **two** full panels beside rails when the deepest panel is open; at most
  three full panels in total (`context` is the max).
- A deeper layout collapses the panels furthest from it first (the list
  becomes a rail before the detail does).
- Two layouts with the same geometry are fine (e.g. `toolSide` for filters and for
  a profile preview: same widths, different side content).
- Every layout has a parent; Back from the root does nothing.

## 2. FluidSlot: one column

```tsx
<FluidSlot label="Details" spec={slots.detail} minWidth={340}
  full={<ItemDetail />}
  rail={<Rail label={title} hint="Show details" onExpand={() => setLayout("tool")} />} />
```

- `<section aria-label data-mode style={{width: '%'}} class="ws-slot px-1">`.
  Width animates via CSS transition. Hidden slots get `px-0 opacity-0` and
  `aria-hidden`.
- Inside, a `rounded-2xl border bg-card shadow-xs` card holds two absolutely
  positioned **layers** (`.ws-layer`): `full` and `rail`. Only the active layer
  has `data-active=true`; the inactive one is `inert` (no focus, no clicks, not in the
  a11y tree) and transparent.
- Cross-fade timing: the outgoing layer fades in 45% of the duration; the
  incoming layer waits 40% before fading in. The column visibly resizes
  *between* the two fades, so content never squashes.
- The full layer keeps `minWidth` (px) so its content **clips** while
  the column narrows instead of reflowing on every frame.
- Slots are **always mounted**. Scroll position, half-typed drafts, form
  state and streaming survive any layout change. Key a slot's content
  (`key={selectedId}`) only when its state must reset per item.

## 3. Rail: a collapsed column

A full-height `<button>` (whole bar is the target) with an optional count
`Badge` at the top and the panel's label written vertically
(`[writing-mode:vertical-rl] rotate-180`, truncated). Tooltip on the right says
what clicking does ("Show the list"). `onExpand` sets the layout that brings
that panel back as `full` (from `context2` → `context`; otherwise the nearest
layout where it is full). **No icons on rails.**

## 4. Navigation API (store)

```ts
setLayout(l)            // explicit jump
back()                  // layout = PARENT[layout]  (Esc, mobile ←, close buttons)
select(id, {keepLayout})// change item; drops context panels that belong to another item
openContext(payload)    // context = payload; layout = "context"
openNestedContext(p)    // context2 = p; layout = "context2"
openTool() / toggleSide()
```

- Context payloads are data (`{kind, itemId, id}`), not components. The panel
  switches on `kind`. A link inside level 1 opens level 2; a link inside
  level 2 **replaces** level 2 (no level 3).
- Editing something shown in a context panel replaces that panel at the
  same level with a form, and saving returns to the view.
- Closing (✕ in a panel header) = `back()` to the parent layout; the payload is
  kept so reopening is instant.

## 5. Global keyboard (workspace-shell.tsx)

| Key | Behaviour |
|---|---|
| `Esc` | `back()`, unless an open dialog/menu/listbox (`[data-state=open]`) owns it, or a handler called `preventDefault` (the slash menu does) |
| `⌘K` / `Ctrl+K` | command palette (items + actions) |
| any printable key | goes to the chat input of the panel last focused or clicked; the character lands in it |
| `↑ ↓ Home End` in the list | move focus **and** selection (roving tabindex; layout unchanged) |
| `Enter` on a row | open it (`focus` layout) |
| `Tab` | lands on the selected row, not the first |

On load, focus starts on the selected list row so arrows work immediately.

## 6. Pointer behaviour

- Click a row → select + `focus` layout, after a 220ms delay so a double-click
  doesn't lurch to focus and back.
- Double-click a row → `overview`.
- Panel header expand/minimise icon toggles `overview` ↔ `focus`.
- Clicking a rail expands it.

## 7. Mobile (< 768px)

`resolveSlots(layout, isMobile)` shows only `MOBILE_PRIMARY[layout]` at 100%;
all others are hidden. The detail header gets a ← back button
(`isMobile && <Button aria-label="Back to list" onClick={back}>`). The same
layout keys and Back logic drive both form factors.

## 8. Cross-panel selection

`OpenItemProvider` (wrap the shell once) computes which entity keys are open
in side panels and exposes `isSelected(action)` through `SelectionContext`.
Generated tables call `useIsSelected()` and mark rows whose `rowAction` opens
an open entity (`aria-current`, a 3px inset bar in `--ring`). Native lists use
`aria-current` + `bg-selected ring-2 ring-ring`. Users always see which row
the side panel belongs to.

## 9. Adapting checklist

1. Rename `SlotKey`s to your surfaces; keep six or fewer.
2. Write `LAYOUTS`, `PARENT`, `MOBILE_PRIMARY` (widths sum to 100, rails = 6).
3. In the shell, render one `FluidSlot` per slot in left-to-right reading
   order, each with a `minWidth` and, if it can collapse, a `rail`.
4. Expose one store action per transition; components call actions, never
   `setLayout` with a hard-coded deeper layout from inside another panel.
5. Verify: every layout reachable, Esc returns along `PARENT`, rails expand,
   nothing reflows mid-animation, mobile shows one panel with ←.

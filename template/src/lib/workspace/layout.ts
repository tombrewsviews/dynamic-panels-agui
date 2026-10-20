/**
 * The workspace is one row of slots. Each layout gives every slot a width
 * (% of the row) and a mode. Changing layout animates every column at once.
 *
 *  overview  [ list 65 | detail 35 ]                    first load: the list is the hero
 *  focus     [ list 25 | detail 75 ]                    an item is open
 *  context   [ list 20 | detail 52 | context 28 ]       a link in agent output opened a side panel
 *  context2  [ ▌6 | ▌6 | context 44 | context2 44 ]     a link inside the side panel opened another
 *  tool      [ ▌6 | detail 35 | tool 59 ]               a big task surface (search, editor, composer…)
 *  toolSide  [ ▌6 | ▌6 | tool 61 | side 27 ]            the tool's own side panel (filters, preview…)
 *
 * Widths in a layout always sum to 100. "rail" slots collapse to a clickable
 * 6% bar with a vertical label; "hidden" slots take 0 width and fade out.
 *
 * To adapt: rename slots to your surfaces, keep the 6 shapes, and adjust
 * widths so the surface the user is working in gets the most room.
 *
 * Dividers (references/dividers.md): the gap between two neighbouring full
 * panels can be dragged. `resizeBetween` trades width between those two only
 * and returns the user's `PanelPrefs`, which `resolveSlots` applies over
 * `LAYOUTS`, per layout.
 */
export type LayoutKey = "overview" | "focus" | "context" | "context2" | "tool" | "toolSide";
export type SlotKey = "list" | "detail" | "context" | "context2" | "tool" | "side";
export type SlotMode = "full" | "rail" | "hidden";

export interface SlotSpec {
  width: number;
  mode: SlotMode;
}

const H: SlotSpec = { width: 0, mode: "hidden" };
const RAIL: SlotSpec = { width: 6, mode: "rail" };
const full = (width: number): SlotSpec => ({ width, mode: "full" });

export const LAYOUTS: Record<LayoutKey, Record<SlotKey, SlotSpec>> = {
  overview: { list: full(65), detail: full(35), context: H, context2: H, tool: H, side: H },
  focus: { list: full(25), detail: full(75), context: H, context2: H, tool: H, side: H },
  context: { list: full(20), detail: full(52), context: full(28), context2: H, tool: H, side: H },
  context2: { list: RAIL, detail: RAIL, context: full(44), context2: full(44), tool: H, side: H },
  tool: { list: RAIL, detail: full(35), context: H, context2: H, tool: full(59), side: H },
  toolSide: { list: RAIL, detail: RAIL, context: H, context2: H, tool: full(61), side: full(27) },
};

/** Narrower than this a panel's content clips (FluidSlot `minWidth`), so a divider stops here. */
export const MIN_WIDTH: Record<SlotKey, number> = { list: 232, detail: 340, context: 280, context2: 280, tool: 420, side: 260 };

/** Widths the user dragged: per layout, the % of each full slot. Rails and hidden slots never change. */
export type PanelPrefs = Partial<Record<LayoutKey, Partial<Record<SlotKey, number>>>>;

/** Below 768px only the deepest open surface shows, full width. */
const MOBILE_PRIMARY: Record<LayoutKey, SlotKey> = {
  overview: "list",
  focus: "detail",
  context: "context",
  context2: "context2",
  tool: "tool",
  toolSide: "side",
};

export function resolveSlots(layout: LayoutKey, isMobile: boolean, prefs: PanelPrefs = {}): Record<SlotKey, SlotSpec> {
  if (!isMobile) return withPrefs(layout, prefs[layout]);
  const primary = MOBILE_PRIMARY[layout];
  const out = {} as Record<SlotKey, SlotSpec>;
  for (const k of Object.keys(LAYOUTS[layout]) as SlotKey[]) out[k] = k === primary ? full(100) : H;
  return out;
}

/** The layout's widths with the user's drag applied, if it still fits: same full slots, same total. */
function withPrefs(layout: LayoutKey, saved: Partial<Record<SlotKey, number>> | undefined): Record<SlotKey, SlotSpec> {
  const base = LAYOUTS[layout];
  if (!saved) return base;
  const fulls = (Object.keys(base) as SlotKey[]).filter((k) => base[k].mode === "full");
  const total = (w: (k: SlotKey) => number) => fulls.reduce((n, k) => n + w(k), 0);
  const fits = fulls.every((k) => typeof saved[k] === "number" && saved[k]! > 0) && Math.abs(total((k) => saved[k]!) - total((k) => base[k].width)) < 0.01;
  if (!fits) return base;
  const out = { ...base };
  for (const k of fulls) out[k] = full(saved[k]!);
  return out;
}

/** Slots in the row's left-to-right order. */
const ORDER: SlotKey[] = ["list", "detail", "context", "context2", "tool", "side"];

/** Neighbouring full panels, left to right: where a divider sits. None beside a rail, none on a phone (one panel). */
export function dividers(slots: Record<SlotKey, SlotSpec>): [SlotKey, SlotKey][] {
  const shown = ORDER.filter((k) => slots[k].mode !== "hidden");
  const out: [SlotKey, SlotKey][] = [];
  for (let i = 1; i < shown.length; i++) {
    if (slots[shown[i - 1]].mode === "full" && slots[shown[i]].mode === "full") out.push([shown[i - 1], shown[i]]);
  }
  return out;
}

/** The right edge of each slot, as % of the row: a divider between `a` and `b` sits at `edges[a]`. */
export function edges(slots: Record<SlotKey, SlotSpec>): Record<SlotKey, number> {
  let x = 0;
  return Object.fromEntries(ORDER.map((k) => [k, (x += slots[k].width)])) as Record<SlotKey, number>;
}

/**
 * Moves the divider between `a` and `b` by `deltaPct` (% of the row, right is
 * positive) from `slots`, the widths when the drag started. `a` and `b` trade
 * width, nothing else moves, and neither goes under its MIN_WIDTH at `rowPx`:
 * the pointer may run past the limit, the divider stops at it.
 */
export function resizeBetween(layout: LayoutKey, slots: Record<SlotKey, SlotSpec>, a: SlotKey, b: SlotKey, deltaPct: number, rowPx: number, prefs: PanelPrefs): PanelPrefs {
  if (slots[a].mode !== "full" || slots[b].mode !== "full" || !rowPx) return prefs;
  const pair = slots[a].width + slots[b].width;
  const minA = (MIN_WIDTH[a] / rowPx) * 100;
  const minB = (MIN_WIDTH[b] / rowPx) * 100;
  // A row too narrow for both minimums: leave it as it is.
  if (minA + minB > pair) return prefs;
  const widthA = Math.round(Math.min(pair - minB, Math.max(minA, slots[a].width + deltaPct)) * 100) / 100;
  const shares: Partial<Record<SlotKey, number>> = {};
  for (const k of ORDER) if (slots[k].mode === "full") shares[k] = slots[k].width;
  shares[a] = widthA;
  shares[b] = Math.round((pair - widthA) * 100) / 100;
  const current = prefs[layout];
  if (current && current[a] === shares[a] && current[b] === shares[b]) return prefs;
  return { ...prefs, [layout]: shares };
}

/** Where Back / Escape goes from each layout. */
export const PARENT: Record<LayoutKey, LayoutKey> = {
  overview: "overview",
  focus: "overview",
  context: "focus",
  context2: "context",
  tool: "focus",
  toolSide: "tool",
};

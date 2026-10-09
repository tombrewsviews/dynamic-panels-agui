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

/** Below 768px only the deepest open surface shows, full width. */
const MOBILE_PRIMARY: Record<LayoutKey, SlotKey> = {
  overview: "list",
  focus: "detail",
  context: "context",
  context2: "context2",
  tool: "tool",
  toolSide: "side",
};

export function resolveSlots(layout: LayoutKey, isMobile: boolean): Record<SlotKey, SlotSpec> {
  if (!isMobile) return LAYOUTS[layout];
  const primary = MOBILE_PRIMARY[layout];
  const out = {} as Record<SlotKey, SlotSpec>;
  for (const k of Object.keys(LAYOUTS[layout]) as SlotKey[]) out[k] = k === primary ? full(100) : H;
  return out;
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

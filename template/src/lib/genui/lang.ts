/**
 * Small builders for OpenUI Lang strings. Use them when the app (not an LLM)
 * produces agent output — mocks, deterministic cards, re-renders after a
 * state change — so every value is escaped and every call has the right shape.
 *
 *   [
 *     `root = Card([hdr, tbl, actions])`,
 *     `hdr = CardHeader(${s("Title")}, ${s("Subtitle")})`,
 *     `tbl = Table(${cols(["Name", "Score"])}, ${rows([["A", 1]])}, ${list([action("open_entity", { id: "a" })])})`,
 *     `actions = Buttons([${btn("Primary", action("do_it"), "default")}])`,
 *   ].join("\n")
 */
export const s = (v: string) => JSON.stringify(v);
export const list = (items: string[]) => `[${items.join(", ")}]`;
export const rows = (r: (string | number)[][]) =>
  list(r.map((row) => list(row.map((c) => (typeof c === "number" ? String(c) : s(c))))));
export const cols = (headers: string[], types?: ("string" | "number")[]) =>
  list(headers.map((h, i) => (types?.[i] ? `Col(${s(h)}, ${s(types[i])})` : `Col(${s(h)})`)));
/** A custom action the host handles in its onAction switch. */
export const action = (type: string, params?: Record<string, string>) =>
  params
    ? `{ type: ${s(type)}, params: { ${Object.entries(params)
        .map(([k, v]) => `${k}: ${s(v)}`)
        .join(", ")} } }`
    : `{ type: ${s(type)} }`;
export const btn = (label: string, act: string, variant = "outline", size = "sm") =>
  `Button(${s(label)}, ${act}, ${s(variant)}, ${s(size)})`;

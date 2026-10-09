# Component reference

Three layers, all installed by `scripts/setup.sh`:

1. **shadcn/ui primitives** (`src/components/ui`, 62 files): the only building
   blocks for native UI.
2. **OpenUI genui library** (`src/lib/genui`): the components agents can emit,
   built from layer 1. Exact signatures below (generated from the spec, so
   they are authoritative).
3. **Workspace components** (`src/components/workspace`): the panel system and
   agent-thread chrome.

Never hand-roll a control that exists in layer 1. Never style a component
with values outside `references/style-guide.md`.

## 1. Workspace components

| Component | Props | Use |
|---|---|---|
| `WorkspaceShell` | none | Root: TopBar plus a row of FluidSlots, global Esc, ⌘K, type-to-chat, initial focus |
| `FluidSlot` | `spec, minWidth, full, rail?, label` | One animated column (see panels.md) |
| `Rail` | `label, count?, hint, onExpand` | Collapsed column: count badge plus a vertical label, no icon |
| `PanelHeader` | `title, subtitle?, leading?, actions?, className?` | Header of every panel (`min-h-14`, border-b) |
| `ChatInput` | `placeholder, ariaLabel, onSubmit?, onChange?, value?, leading?, commands?, onCommand?` | Bottom dock of every panel. Controlled (`value` and `onChange`) for live filtering; `onSubmit` for messages; `commands` adds a "/" slash menu (↑↓ ⏎ Tab Esc) |
| `SlashCommand` | `{ name, title, description, icon, arg? }` | `description` completes "… to {description}"; `arg` makes the command wait for an argument |
| `AgentMessage` | `message, visible, streaming, onAction, onWhy?, agentName?` | User bubble or agent card with header (agent · step · state · confidence · Why?) |
| `StatusBadge` / `StatusDot` | `status` | The status vocabulary (`ITEM_STATUS`: label, hint, tint, dot) |
| `StepStateLabel` | `state, compact?` | Step lifecycle icon plus label (sr-only when compact) |
| `ConfidenceBadge` | `confidence` | High (muted) / Medium / Low (warn plus icon) |
| `OpenItemProvider` | `children` | Cross-panel selected rows for generated tables |
| `TopBar` | `appName?, mark?` | Mark, ⌘K palette trigger, stats slot, account menu with theme switch |
| `ItemList` / `ItemDetail` / `ContextPanel` / `ToolPanel` / `SidePanel` | none | Placeholder surfaces to rename and fill with your domain |

## 2. shadcn/ui primitives: what to reach for

| Need | Component |
|---|---|
| Actions | `button`, `button-group`, `toggle`, `toggle-group`, `dropdown-menu`, `context-menu`, `menubar` |
| Text entry | `input`, `textarea`, `input-group` (input + addons, used by ChatInput), `input-otp`, `native-select`, `select`, `combobox`, `command` |
| Choice | `checkbox`, `radio-group`, `switch`, `slider`, `calendar` |
| Forms | `form` (react-hook-form), `field`, `label` |
| Display | `badge`, `avatar`, `card`, `item`, `table`, `data-table` (TanStack), `chart` (recharts), `progress`, `skeleton`, `spinner`, `kbd`, `marker`, `empty`, `separator`, `aspect-ratio` |
| Disclosure | `accordion`, `collapsible`, `tabs`, `hover-card`, `tooltip`, `popover` |
| Overlays | `dialog`, `alert-dialog`, `sheet`, `drawer` (vaul), `sonner` (toasts) |
| Navigation | `breadcrumb`, `navigation-menu`, `pagination`, `sidebar` |
| Layout | `scroll-area`, `resizable`, `carousel`, `direction` |
| Chat | `message`, `bubble`, `message-scroller`, `attachment` |

House rules on top of shadcn defaults:
- Tooltips on every icon-only button and every disabled control (say why it's disabled).
- `ScrollArea` for lists in panels; plain `overflow-y-auto` for the agent thread
  (it needs `scrollTop` control).
- Toasts (`sonner`, bottom-center) confirm actions; reversible ones carry
  `action: { label: "Undo", onClick }`.
- Lists longer than 25 rows paginate (Previous · n / m · Next, `xs ghost`).

## 3. OpenUI genui components (agent-emittable)

Root: `Card(children: (any content | Tabs | Carousel | FollowUpBlock)[])`: the
only container; children stack vertically.

`action` everywhere is
`{ type: "continue_conversation", context? } | { type: "open_url", url } | { type: string, params? }`.

### Content

- `CardHeader(title: string, description?: string)`: Title/description header block for a Card.
- `TextContent(text: string, size?: "small" | "default" | "large" | "small-heavy" | "large-heavy")`: Text block with optional size. size: "small" | "default" | "large" | "small-heavy" | "large-heavy".
- `MarkDownRenderer(text: string)`: Renders markdown text with GFM support.
- `Alert(title: string, description: string, variant?: "default" | "destructive" | "info" | "success" | "warning", items?: {label: string, detail?: string, action?: Action}[])`: Alert banner with icon, title, and description. variant: "default" | "destructive" | "info" | "success" | "warning". Optional items [{label, detail?, action?}]; labels with an action render as links.
- `Badge(text: string, variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link")`: Inline label/badge. variant: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link".
- `Avatar(src?: string, alt?: string, fallback: string)`: Circular avatar with image and fallback text.
- `CodeBlock(code: string, language?: string, title?: string)`: Syntax-highlighted code block with optional language and title.
- `Image(src: string, alt?: string)`: Displays an image with optional alt text.
- `ImageBlock(src: string, alt?: string, caption?: string)`: Image with optional caption.
- `Progress(value: number, label?: string)`: Progress bar showing completion percentage (0-100). Optional label.
- `Separator(orientation?: "horizontal" | "vertical")`: Horizontal or vertical rule. orientation: "horizontal" | "vertical".

### Tables

- `Table(columns: Col[], rows: any[][], rowActions?: (Action)[], rowButtons?: {label: string, hint?: string, action?: Action}[], sections?: {label: string, detail?: string, start: number}[], wrap?: boolean)`: Data table. columns: Col[] with header/type, rows: 2D array of values, rowActions: optional action per row, rowButtons: optional {label, hint, action} button per row, sections: optional {label, detail, start} headings, wrap: wrap text instead of scrolling.
- `Col(header: string, type?: "string" | "number" | "boolean")`: Column definition for Table — header label and optional type.

### Charts (2D)

- `BarChart(labels: string[], series: Series[], variant?: "grouped" | "stacked", xLabel?: string, yLabel?: string)`: Vertical bar chart. Use for comparing values across categories.
- `LineChart(labels: string[], series: Series[], xLabel?: string, yLabel?: string)`: Line chart for trends over categories.
- `AreaChart(labels: string[], series: Series[], xLabel?: string, yLabel?: string)`: Area chart for showing volume over categories.
- `RadarChart(labels: string[], series: Series[])`: Radar/spider chart for multi-dimensional comparison.
- `Series(category: string, values: number[])`: One named data series with values matching labels.

### Charts (1D)

- `PieChart(slices: Slice[], donut?: boolean)`: Pie or donut chart. slices: Slice[], donut: boolean for ring chart.
- `RadialChart(slices: Slice[])`: Radial bar chart for displaying categorized values in rings.
- `Slice(category: string, value: number)`: A single slice in a PieChart or RadialChart.

### Charts (Scatter)

- `ScatterChart(series: ScatterSeries[], xLabel?: string, yLabel?: string)`: Scatter plot with named series of Point references.
- `ScatterSeries(category: string, points: Point[])`: Named scatter series with Point references.
- `Point(x: number, y: number, label?: string)`: A single data point in a ScatterChart series.

### Forms

- `Form(name: string, buttons: Buttons, fields?: FormControl[])`: Form container with fields and explicit action buttons. fields: FormControl[], buttons: Buttons.
- `FormControl(label: string, field: any)`: Wraps a form field with a label and error display.
- `Label(text: string, htmlFor?: string)`: Form label. Optionally links to an input via htmlFor.
- `Input(name: string, placeholder?: string, type?: "text" | "email" | "password" | "number" | "url", rules?: {required?: boolean, email?: boolean, url?: boolean, numeric?: boolean, min?: number, max?: number, minLength?: number, maxLength?: number, pattern?: string})`: Text input field. type: "text" | "email" | "password" | "number" | "url". rules for validation.
- `TextArea(name: string, placeholder?: string, rows?: number, rules?: {required?: boolean, email?: boolean, url?: boolean, numeric?: boolean, min?: number, max?: number, minLength?: number, maxLength?: number, pattern?: string})`: Multi-line text input. rows sets visible height. rules for validation.
- `Select(name: string, items: SelectItem[], placeholder?: string, rules?: {required?: boolean, email?: boolean, url?: boolean, numeric?: boolean, min?: number, max?: number, minLength?: number, maxLength?: number, pattern?: string})`: Dropdown select. items: SelectItem[], placeholder, rules for validation.
- `SelectItem(value: string, label: string)`: Option for Select dropdown.
- `DatePicker(name: string, placeholder?: string)`: Date selection input with calendar popover.
- `Slider(name: string, min?: number, max?: number, step?: number, defaultValue?: number)`: Range slider input. min, max, step, defaultValue.
- `CheckBoxGroup(name: string, items: CheckBoxItem[])`: Multiple checkbox options. items: CheckBoxItem[].
- `CheckBoxItem(value: string, label: string)`: Option in a CheckBoxGroup.
- `RadioGroup(name: string, items: RadioItem[])`: Radio selection group. items: RadioItem[].
- `RadioItem(value: string, label: string)`: Option in a RadioGroup.
- `SwitchGroup(name: string, items: SwitchItem[])`: Group of toggle switches. items: SwitchItem[].
- `SwitchItem(value: string, label: string)`: Toggle option in a SwitchGroup.

- Define EACH FormControl as its own reference — do NOT inline all controls in one array.
- NEVER nest Form inside Form.
- Form requires explicit buttons. Always pass a Buttons(...) reference as the third Form argument.
- rules is an optional object: { required: true, email: true, min: 8, maxLength: 100 }
- The renderer shows error messages automatically — do NOT generate error text in the UI

### Buttons

- `Button(label: string, action?: Action, variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link", size?: "default" | "xs" | "sm" | "lg" | "icon")`: Clickable button. variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link". size: "default" | "xs" | "sm" | "lg" | "icon". action: { type: "continue_conversation" | "open_url", url? }.
- `Buttons(buttons: Button[], direction?: "row" | "column")`: Group of Button components. direction: "row" | "column".

### Follow-ups

- `FollowUpBlock(items: FollowUpItem[])`: List of follow-up suggestion chips at the end of a response.
- `FollowUpItem(text: string)`: Clickable follow-up suggestion — sends text as user message when clicked.

- Use FollowUpBlock with FollowUpItem references at the end of a response to suggest next actions.
- Clicking a FollowUpItem sends its text to the LLM as a user message.

### Layout

- `Tabs(items: TabItem[], defaultValue?: string)`: Tabbed content. items: TabItem[]. defaultValue: initially active tab.
- `TabItem(value: string, trigger: string, content: (TextContent | MarkDownRenderer | CardHeader | Alert | Badge | Avatar | CodeBlock | Image | ImageBlock | Progress | Separator | BarChart | LineChart | AreaChart | PieChart | RadarChart | RadialChart | ScatterChart | Table | TagBlock | Form | Buttons | Heading | Blockquote | InlineCode | PaginationBlock | DialogBlock | AlertDialogBlock | DrawerBlock | CalendarBlock)[])`: Tab panel. value: unique id, trigger: tab label, content: children.
- `Accordion(items: AccordionItem[], type?: "single" | "multiple")`: Collapsible sections. type: "single" | "multiple". items: AccordionItem[].
- `AccordionItem(value: string, trigger: string, content: (TextContent | MarkDownRenderer | CardHeader | Alert | Badge | Avatar | CodeBlock | Image | ImageBlock | Progress | Separator | BarChart | LineChart | AreaChart | PieChart | RadarChart | RadialChart | ScatterChart | Table | TagBlock | Form | Buttons | Heading | Blockquote | InlineCode | PaginationBlock | DialogBlock | AlertDialogBlock | DrawerBlock | CalendarBlock)[])`: Collapsible item inside Accordion. value: unique id, trigger: header text.
- `Carousel(slides: any[][], variant?: "default" | "card")`: Horizontal sliding content. slides: array of slide arrays. variant: "default" | "card".

- Use Tabs to present alternative views — each TabItem has a value id, trigger label, and content array.
- Carousel takes an array of slides, where each slide is an array of content.
- IMPORTANT: Every slide in a Carousel must have the same structure.

### Data Display

- `TagBlock(tags: (string | Tag)[])`: Group of tags. Accepts string array or Tag references.
- `Tag(text: string, variant?: "default" | "secondary" | "destructive" | "outline" | "ghost", hint?: string, action?: Action)`: Styled tag/badge. Used inside TagBlock. Optional hint shows a tooltip; optional action makes it clickable.

### Typography

- `Heading(text: string, level?: "h1" | "h2" | "h3" | "h4")`: Heading text. level: "h1" | "h2" | "h3" | "h4". Defaults to "h2".
- `Blockquote(text: string, cite?: string)`: Styled blockquote. Optional cite for attribution.
- `InlineCode(code: string)`: Inline code snippet rendered with monospace font.

- Heading levels: "h1" | "h2" | "h3" | "h4". Each renders with appropriate shadcn/ui typography styles.
- Blockquote for styled quotes with optional cite attribution.
- InlineCode for monospace code snippets within text.

### Calendar

- `CalendarBlock(mode?: "single" | "multiple" | "range", defaultMonth?: string, numberOfMonths?: number, captionLayout?: "label" | "dropdown")`: Standalone calendar display. mode: "single" | "multiple" | "range". captionLayout: "label" | "dropdown" (default "dropdown"). numberOfMonths defaults to 1.

- CalendarBlock renders a standalone interactive calendar. mode: "single" | "multiple" | "range".
- Use numberOfMonths to show multiple months side by side.
- Use defaultMonth (ISO date string) to set the initial visible month.

### Navigation

- `PaginationBlock(currentPage: number, totalPages: number)`: Page navigation. currentPage and totalPages control which pages are shown.

- PaginationBlock takes currentPage and totalPages.

### Overlays

- `DialogBlock(triggerLabel: string, title: string, description?: string, content?: any[], triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link")`: Modal dialog triggered by a button. triggerLabel: button text, title/description in header, content: children rendered inside.
- `AlertDialogBlock(triggerLabel: string, title: string, description: string, confirmLabel?: string, cancelLabel?: string, triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link")`: Confirmation dialog with cancel and confirm buttons. Clicking confirm sends the confirmLabel as a message.
- `DrawerBlock(triggerLabel: string, title: string, description?: string, content?: any[])`: Bottom drawer panel triggered by a button. triggerLabel: button text, title/description in header, content: children rendered inside.

- DialogBlock renders a button that opens a modal dialog with content inside.
- AlertDialogBlock renders a confirmation dialog with cancel/confirm actions.
- DrawerBlock renders a bottom drawer panel triggered by a button.

### Composition rules (also in the system prompt)

- One `Card` per response; use `CardHeader` for the title, `TextContent` for
  body, `MarkDownRenderer` for rich text.
- Tables: `rowActions` make rows open things (selected state is automatic);
  `rowButtons` add one trailing `xs ghost` action per row (e.g. Remove);
  `sections` group rows under labelled headings with a right-aligned detail
  ("2 / 3 · covered"); `wrap: true` in narrow panels so tables never scroll
  sideways.
- Alerts: pick the variant by tone (info, success, warning, destructive);
  `items` list linked names with a reason ("Name: why").
- Tags: `hint` adds a tooltip; `action` makes a tag clickable (e.g. edit that field).
- Forms: one `FormControl` reference per field, explicit `Buttons` as the second
  argument, never nested; the renderer shows validation errors.
- Exactly one `default` Button per `Buttons` group: the main move.
- End with `FollowUpBlock` only in open chat answers, not in workflow step cards.

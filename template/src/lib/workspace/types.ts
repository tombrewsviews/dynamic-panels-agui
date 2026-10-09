/** Status vocabulary shared by list dots, badges and step headers. Rename freely; keep the tones. */
export type ItemStatus = "attention" | "failed" | "running" | "ready" | "waiting" | "done";

/** Lifecycle of one agent step in a thread. */
export type StepState = "pending" | "running" | "paused" | "completed" | "failed";

export type Confidence = "High" | "Medium" | "Low";

/** Ordered agent steps for an item. Replace with your own workflow. */
export type StepKind = "summary" | "analysis" | "results";

export interface Item {
  id: string;
  title: string;
  /** Secondary line: owner, source, account… */
  subtitle: string;
  status: ItemStatus;
  /** One-line "why this needs you" signal shown under the row. */
  signal?: string;
  receivedAt: string;
  urgent?: boolean;
}

export interface ThreadMessage {
  id: string;
  role: "agent" | "user";
  step?: StepKind;
  state?: StepState;
  confidence?: Confidence;
  /** OpenUI Lang for agent messages, plain text for user messages. */
  content: string;
}

export interface Thread {
  messages: ThreadMessage[];
  /** Messages revealed so far (progressive streaming). */
  revealed: number;
  /** Characters of the last revealed message shown so far. */
  pos: number;
}

/** What a contextual panel shows. Add kinds as your app grows. */
export type ContextPayload =
  | { kind: "entity"; itemId: string; id: string }
  | { kind: "source"; itemId: string }
  | { kind: "audit"; itemId: string; step: StepKind };

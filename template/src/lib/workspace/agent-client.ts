"use client";

/**
 * Streams a live agent reply from /api/chat (OpenAI-compatible SSE, see
 * src/app/api/chat/route.ts) and hands the growing OpenUI Lang text to
 * `onText`. The Renderer tolerates partial Lang, so pass every update
 * straight into the thread message.
 *
 * Enabled when NEXT_PUBLIC_AGENT_LIVE=1 and the server has THESYS_API_KEY.
 */
export const AGENT_LIVE = process.env.NEXT_PUBLIC_AGENT_LIVE === "1";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function streamAgent(messages: ChatTurn[], onText: (full: string) => void, signal?: AbortSignal): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Agent request failed (${res.status})`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const ev of events) {
      const data = ev.replace(/^data: /, "").trim();
      if (!data || data === "[DONE]") continue;
      const chunk = JSON.parse(data) as { error?: string; choices?: { delta?: { content?: string } }[] };
      if (chunk.error) throw new Error(chunk.error);
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        text += delta;
        onText(text);
      }
    }
  }
  return text;
}

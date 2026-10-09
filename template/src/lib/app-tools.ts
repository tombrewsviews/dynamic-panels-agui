import type { FunctionToolExecutor } from "@/lib/tool-loop";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

/**
 * Server-side function tools the live agent may call (see tool-loop.ts).
 * Add one declaration + one executor per tool; executors return JSON strings.
 */
export const appToolDeclarations: ChatCompletionTool[] = [];

export const appToolExecutors: Record<string, FunctionToolExecutor> = {};

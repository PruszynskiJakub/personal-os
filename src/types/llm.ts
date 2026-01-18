import type {CoreMessage, Tool} from "ai";

export interface CompletionConfig {
    messages: CoreMessage[],
    temperature: number,
    max_tokens: number,
    tools?: Record<string, Tool>
}
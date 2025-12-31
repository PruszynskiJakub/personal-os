import type {CoreMessage} from "ai";

export interface CompletionConfig {
    messages: CoreMessage[],
    temperature: number,
    maxTokens: number
}
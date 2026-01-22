import type {CoreMessage} from "ai";
import type {LangfuseTraceClient} from "langfuse";

export interface Document {
    uuid: string;
    source_uuid: string | null;
    conversation_uuid: string;
    text: string;
    metadata: DocumentMetadata,
    created_at: string;
    updated_at: string;
}

export type DocumentMetadata = {
    uuid: string;
    conversation_uuid: string;
    source_uuid: string;
    content_type: 'chunk' | 'full';
    chunk_index?: number;
    description?: string;
}

export interface ToolUsePayload {
    action: string;
    payload: Record<string, unknown>;
}

export interface ToolUseResponse {
    result: ToolUsePayload;
}

export interface Thoughts {
    _thinking: string,
    tool: 'answer' | 'logbook',
    description: string,
}

export interface ThoughtsResponse {
    result: Thoughts
}

export interface ToolCall {
    tool: string,
    action?: string,
    payload?: Record<string, any>
}

export interface State {
    conversation_uuid: string;
    messages: CoreMessage[]
    step: number,
    max_steps: number,
    thoughts?: {
        next_action?: string
        next_action_reasoning?: string
    },
    documents: Document[],
    call_stack: ToolCall[],
}

// Streaming event types for real-time agent progress feedback
export type AgentEvent =
    | { type: 'step_start'; step: number; max_steps: number }
    | { type: 'thinking_start' }
    | { type: 'thinking_chunk'; text: string }
    | { type: 'thinking'; message: string }
    | { type: 'tool_selected'; tool: string; description: string }
    | { type: 'tool_use_start'; tool: string }
    | { type: 'tool_use_chunk'; text: string }
    | { type: 'tool_executing'; tool: string; action: string }
    | { type: 'tool_result'; success: boolean; summary: string }
    | { type: 'error'; error: string; recoverable: boolean }
    | { type: 'answer_start' }
    | { type: 'answer_chunk'; text: string }
    | { type: 'done'; trajectory: string[] }
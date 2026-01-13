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
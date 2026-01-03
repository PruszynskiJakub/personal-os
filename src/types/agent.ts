import type {CoreMessage} from "ai";

export interface Document {
    uuid: string;
    conversation_uuid: string;
    text: string;
    created_at: string;
    updated_at: string;
}

export interface ToolUsePayload {
    action: string;
    payload: Record<string, unknown>;
}

export interface ToolUseResponse {
    result: ToolUsePayload;
}

export interface State {
    conversation_uuid: string;
    messages: CoreMessage[]
    tool?: string
    action?: string
    tool_payload?: Record<string, any>
    documents?: Document[],
}
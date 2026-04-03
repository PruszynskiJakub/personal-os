import type {AgentEvent, Document} from "../types/agent.ts";

export function formatSSEEvent(event: AgentEvent): string {
    return JSON.stringify(event);
}

export function extractDocumentSummary(document: Document | undefined): string {
    if (!document) {
        return "No result";
    }

    const text = document.text || "";
    if (text.length > 200) {
        return text.substring(0, 200) + "...";
    }
    return text;
}

export function createStepStartEvent(step: number, max_steps: number): AgentEvent {
    return {type: 'step_start', step, max_steps};
}

export function createThinkingStartEvent(): AgentEvent {
    return {type: 'thinking_start'};
}

export function createThinkingChunkEvent(text: string): AgentEvent {
    return {type: 'thinking_chunk', text};
}

export function createThinkingEvent(message: string): AgentEvent {
    return {type: 'thinking', message};
}

export function createToolSelectedEvent(tool: string, description: string): AgentEvent {
    return {type: 'tool_selected', tool, description};
}

export function createToolUseStartEvent(tool: string): AgentEvent {
    return {type: 'tool_use_start', tool};
}

export function createToolUseChunkEvent(text: string): AgentEvent {
    return {type: 'tool_use_chunk', text};
}

export function createToolExecutingEvent(tool: string, action: string): AgentEvent {
    return {type: 'tool_executing', tool, action};
}

export function createToolResultEvent(success: boolean, summary: string): AgentEvent {
    return {type: 'tool_result', success, summary};
}

export function createErrorEvent(error: string, recoverable: boolean): AgentEvent {
    return {type: 'error', error, recoverable};
}

export function createAnswerStartEvent(): AgentEvent {
    return {type: 'answer_start'};
}

export function createAnswerChunkEvent(text: string): AgentEvent {
    return {type: 'answer_chunk', text};
}

export function createDoneEvent(trajectory: string[]): AgentEvent {
    return {type: 'done', trajectory};
}

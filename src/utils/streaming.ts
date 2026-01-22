import type {AgentEvent, Document} from "../types/agent.ts";

/**
 * Formats an AgentEvent for SSE transmission
 */
export function formatSSEEvent(event: AgentEvent): string {
    return JSON.stringify(event);
}

/**
 * Extracts a summary from a document for tool_result events
 */
export function extractDocumentSummary(document: Document | undefined): string {
    if (!document) {
        return "No result";
    }

    // Truncate to first 200 characters for summary
    const text = document.text || "";
    if (text.length > 200) {
        return text.substring(0, 200) + "...";
    }
    return text;
}

/**
 * Creates a step_start event
 */
export function createStepStartEvent(step: number, max_steps: number): AgentEvent {
    return {type: 'step_start', step, max_steps};
}

/**
 * Creates a thinking event
 */
export function createThinkingEvent(message: string): AgentEvent {
    return {type: 'thinking', message};
}

/**
 * Creates a tool_selected event
 */
export function createToolSelectedEvent(tool: string, description: string): AgentEvent {
    return {type: 'tool_selected', tool, description};
}

/**
 * Creates a tool_executing event
 */
export function createToolExecutingEvent(tool: string, action: string): AgentEvent {
    return {type: 'tool_executing', tool, action};
}

/**
 * Creates a tool_result event
 */
export function createToolResultEvent(success: boolean, summary: string): AgentEvent {
    return {type: 'tool_result', success, summary};
}

/**
 * Creates an error event
 */
export function createErrorEvent(error: string, recoverable: boolean): AgentEvent {
    return {type: 'error', error, recoverable};
}

/**
 * Creates an answer_start event
 */
export function createAnswerStartEvent(): AgentEvent {
    return {type: 'answer_start'};
}

/**
 * Creates an answer_chunk event
 */
export function createAnswerChunkEvent(text: string): AgentEvent {
    return {type: 'answer_chunk', text};
}

/**
 * Creates a done event
 */
export function createDoneEvent(trajectory: string[]): AgentEvent {
    return {type: 'done', trajectory};
}

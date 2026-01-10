import type {State} from "../types/agent.ts";

export const currentCall = (state: State) => state.call_stack.at(-1)

export const lastUserMessage = (state: State) => state.messages.findLast(msg => msg.role == 'user')

export const formatDocuments = (state: State) => {
    return state.documents?.map(document => `
        <document uuid="${document.uuid}">
        ${document.text}
        </document>
    `).join('\n')
}
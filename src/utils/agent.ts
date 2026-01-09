import type {State} from "../types/agent.ts";

export const currentCall = (state: State) => state.call_stack.at(-1)

export const lastUserMessage = (state: State) => state.messages.findLast(msg => msg.role == 'user')
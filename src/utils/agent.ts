import type {State} from "../types/agent.ts";

export const currentCall = (state: State) => state.call_stack.at(-1)

import type {CoreMessage} from "ai";
import {completion} from "./llm.service.ts";
import {prompt as thinkPrompt} from "../prompts/agent.think.ts"
import {prompt as usePrompt} from "../prompts/agent.use.ts"
import type {State, ToolUseResponse} from "../types/agent.ts";
import {toolRegistry} from "../config/tools.config.ts";
import type {LangfuseTraceClient} from "langfuse";

const aiService = {

    think: async (state: State): Promise<State> => {
        const completionConfig = {
            messages: [
                {role: "system", content: thinkPrompt()},
                ...state.messages
            ] as CoreMessage[],
            temperature: 0,
            max_tokens: 4000
        }

        const result = await completion.text(completionConfig)

        return {tool: result, ...state}
    },

    use: async (state: State): Promise<State> => {
        const completionConfig = {
            messages: [
                {role: "system", content: usePrompt(state.tool!!)},
                ...state.messages
            ] as CoreMessage[],
            temperature: 0,
            max_tokens: 4000
        }

        const result = await completion.object<ToolUseResponse>(completionConfig)
        return {tool_payload: result.result.payload, action: result.result.action, ...state}
    },

    act: async (state: State): Promise<State> => {
        const conversation_uuid = state.conversation_uuid
        const tool_call = toolRegistry.find(t => t.name == state.tool)?.executor!!

        const document = await tool_call(state.action!!, {conversation_uuid, ...state.tool_payload})
        console.log(`${state.tool} execution result...\n ${document.text}`)


        const documents = state.documents ?? []
        documents.push(document)

        return {documents, ...state}
    },

    process: async (state: State, trace: LangfuseTraceClient): Promise<State> => {

        let newState: State = state
        newState = await aiService.think(newState)

        console.log("Thinking result is ...: ", newState.tool)


        newState = await aiService.use(newState)

        console.log("Use result: ", newState.tool, newState.tool_payload)

        if (newState.tool_payload) {
            newState = await aiService.act(newState)
        }

        return newState
    }
}

export {
    aiService,
}
import type {CoreMessage} from "ai";
import {completion, modelId} from "./llm.service.ts";
import {prompt as thinkPrompt} from "../prompts/agent.think.ts"
import {prompt as usePrompt} from "../prompts/agent.use.ts"
import type {State, ThoughtsResponse, ToolUseResponse} from "../types/agent.ts";
import {toolRegistry} from "../config/tools.config.ts";
import {langfuseService} from "./langfuse.service.ts";

function createAiService() {

    return {
        think: async (state: State): Promise<State> => {
            const completionConfig = {
                messages: [
                    {role: "system", content: thinkPrompt()},
                    ...state.messages
                ] as CoreMessage[],
                temperature: 0,
                max_tokens: 4000
            }

            const generation = langfuseService.startGeneration(state.trace, {
                name: "think",
                model: modelId,
                input: completionConfig.messages
            })

            const result = await completion.object<ThoughtsResponse>(completionConfig)

            langfuseService.endGeneration(generation, {output: result})

            return {tool: result.result.answer, ...state}
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

            const generation = langfuseService.startGeneration(state.trace, {
                name: "use",
                model: modelId,
                input: completionConfig.messages
            })

            const result = await completion.object<ToolUseResponse>(completionConfig)

            langfuseService.endGeneration(generation, {output: result})

            return {tool_payload: result.result.payload, action: result.result.action, ...state}
        },

        act: async (state: State): Promise<State> => {
            const conversation_uuid = state.conversation_uuid
            const tool_call = toolRegistry.find(t => t.name == state.tool)?.executor!!

            const span = langfuseService.startSpan(state.trace, {name: "act"})

            const document = await tool_call(state.action!!, {conversation_uuid, ...state.tool_payload})
            console.log(`${state.tool} execution result...\n ${document.text}`)
            langfuseService.endSpan(span, {output: document})


            const documents = state.documents ?? []
            documents.push(document)

            return {documents, ...state}
        },

        process: async (state: State): Promise<State> => {

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
}

const aiService = createAiService()

export {
    aiService,
}
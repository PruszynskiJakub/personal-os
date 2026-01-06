import type {CoreMessage} from "ai";
import {toolRegistry} from "../config/tools.config.ts";
import {prompt as thinkPrompt} from "../prompts/agent.think.ts";
import {prompt as usePrompt} from "../prompts/agent.use.ts";
import type {State, ThoughtsResponse, ToolUseResponse} from "../types/agent.ts";
import {langfuseService} from "./langfuse.service.ts";
import {completion, modelId} from "./llm.service.ts";
import type {LangfuseSpanClient, LangfuseTraceClient} from "langfuse";

function createAiService() {

    return {
        think: async (state: State, observation: LangfuseSpanClient | LangfuseTraceClient): Promise<State> => {
            const completionConfig = {
                messages: [
                    {role: "system", content: thinkPrompt(state)},
                    ...state.messages
                ] as CoreMessage[],
                temperature: 0,
                max_tokens: 4000
            }

            const generation = langfuseService.startGeneration(observation, {
                name: "think",
                model: modelId,
                input: completionConfig.messages
            })

            const result = await completion.object<ThoughtsResponse>(completionConfig)

            langfuseService.endGeneration(generation, {output: result})

            console.log("thinking result..", result)

            return {...state, tool: result.result.tool, next: result.result.description}
        },

        use: async (state: State, observation: LangfuseSpanClient | LangfuseTraceClient): Promise<State> => {
            const completionConfig = {
                messages: [
                    {role: "system", content: usePrompt(state)},
                    ...state.messages
                ] as CoreMessage[],
                temperature: 0,
                max_tokens: 4000
            }

            const generation = langfuseService.startGeneration(observation, {
                name: "use",
                model: modelId,
                input: completionConfig.messages
            })

            const result = await completion.object<ToolUseResponse>(completionConfig)

            langfuseService.endGeneration(generation, {output: result})

            console.log("use result..", result)


            return {...state, tool_payload: result.result.payload, action: result.result.action}
        },

        act: async (state: State, observation: LangfuseSpanClient | LangfuseTraceClient): Promise<State> => {
            const conversation_uuid = state.conversation_uuid
            const tool_call = toolRegistry.find(t => t.name == state.tool)?.executor!!

            const span = langfuseService.startSpan(observation, {name: "act"})

            const document = await tool_call(state.action!!, {conversation_uuid, ...state.tool_payload})
            console.log(`${state.tool} execution result...\n ${document.text}`)
            langfuseService.endSpan(span, {output: document})


            const documents = state.documents ?? []
            documents.push(document)

            return {...state, documents}
        },

        process: async (state: State, trace: LangfuseTraceClient): Promise<State> => {

            let step = 1
            let newState: State = state

            while (true) {
                const span = langfuseService.startSpan(trace, {name: `step ${step}`})
                step++

                newState = await aiService.think(newState, span)

                console.log("Thinking result is ...: ", newState.tool)

                if (newState.tool === "answer") {
                    span.end()
                    break
                }

                newState = await aiService.use(newState, span)

                console.log("Use result: ", newState.tool, newState.tool_payload)

                if (newState.tool_payload) {
                    newState = await aiService.act(newState, span)
                }

                span.end()
            }


            return newState
        }
    }
}

const aiService = createAiService()

export {
    aiService
};

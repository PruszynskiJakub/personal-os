import type {CoreMessage} from "ai";
import {produce} from "immer";
import type {LangfuseSpanClient, LangfuseTraceClient} from "langfuse";
import {toolRegistry} from "../config/tools.config.ts";
import {prompt as thinkPrompt} from "../prompts/agent.think.ts";
import {prompt as usePrompt} from "../prompts/agent.use.ts";
import type {State, ThoughtsResponse, ToolUseResponse} from "../types/agent.ts";
import {langfuseService} from "./langfuse.service.ts";
import {completion, modelId} from "./llm.service.ts";
import {currentCall} from "../utils/agent.ts";


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

            return produce(state, draft => {
                draft.call_stack.push({tool: result.result.tool})
                draft.thoughts = {}
                draft.thoughts.next_action = result.result.description
                draft.thoughts.next_action_reasoning = result.result._thinking
            })
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
                name: `use ${currentCall(state)?.tool}`,
                model: modelId,
                input: completionConfig.messages
            })

            const result = await completion.object<ToolUseResponse>(completionConfig)

            langfuseService.endGeneration(generation, {output: result})

            console.log("use result..", result)

            return produce(state, draft => {
                const call = draft.call_stack.at(-1)!
                call.action = result.result.action
                call.payload = result.result.payload
            })
        },

        act: async (state: State, observation: LangfuseSpanClient | LangfuseTraceClient): Promise<State> => {
            const call = currentCall(state)!
            const tool_call = toolRegistry.find(t => t.name === call.tool)?.executor!

            const span = langfuseService.startSpan(observation, {name: currentCall(state)?.action ?? 'act'})

            const document = await tool_call(call.action!, {conversation_uuid: state.conversation_uuid, ...call.payload})
            console.log(`${call.tool} execution result...\n ${document.text}`)
            langfuseService.endSpan(span, {output: document})

            return produce(state, draft => {
                draft.documents.push(document)
            })
        },

        process: async (state: State, trace: LangfuseTraceClient): Promise<State> => {

            let step = 1
            let newState: State = state

            while (true) {
                const span = langfuseService.startSpan(trace, {name: `step ${step}`})
                step++

                newState = await aiService.think(newState, span)

                const call = currentCall(newState)

                if (call?.tool === "answer") {
                    span.end()
                    break
                }

                newState = await aiService.use(newState, span)

                const updatedCall = currentCall(newState)
                console.log("Use result: ", updatedCall?.tool, updatedCall?.payload)

                if (updatedCall?.payload) {
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

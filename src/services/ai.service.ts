import type {CoreMessage} from "ai";
import {produce} from "immer";
import type {LangfuseSpanClient, LangfuseTraceClient} from "langfuse";
import {formatted_tools, tool_registry} from "../config/tools.config.ts";
import {prompt as usePrompt} from "../prompts/agent.use.ts";
import type {AgentEvent, State, ThoughtsResponse, ToolUseResponse} from "../types/agent.ts";
import {langfuseService} from "./langfuse.service.ts";
import {completion, modelId} from "./llm.service.ts";
import {currentCall, formatDocuments, lastUserMessage, shouldContinue} from "../utils/agent.ts";
import {
    createErrorEvent,
    createStepStartEvent,
    createThinkingChunkEvent,
    createThinkingEvent,
    createThinkingStartEvent,
    createToolExecutingEvent,
    createToolResultEvent,
    createToolSelectedEvent,
    createToolUseChunkEvent,
    createToolUseStartEvent,
    extractDocumentSummary
} from "../utils/streaming.ts";

function createAiService() {

    return {
        think: async (state: State, observation: LangfuseSpanClient | LangfuseTraceClient): Promise<State> => {
            const prompt = await langfuseService.getChatPrompt("think-chat")

            const prompt_input = {
                tools: formatted_tools,
                documents: formatDocuments(state),
            }

            const compiled_prompt = prompt.compile(prompt_input)

            const completionConfig = {
                messages: [
                    compiled_prompt[0],
                    lastUserMessage(state)
                ] as CoreMessage[],
                temperature: 0,
                max_tokens: 4000
            }

            const generation = langfuseService.startGeneration(observation, {
                name: `thinking #${state.step}`,
                model: modelId,
                input: {
                    user_message: [lastUserMessage(state)],
                    ...prompt_input
                },
                prompt: prompt,
            })

            const result = await completion.object<ThoughtsResponse>(completionConfig)

            langfuseService.endGeneration(generation, {output: result})

            console.log("🧠 Thinking result ", result)

            return produce(state, draft => {
                draft.call_stack.push({tool: result.result.tool})
                draft.thoughts = {}
                draft.thoughts.next_action = result.result.description
                draft.thoughts.next_action_reasoning = result.result._thinking
            })
        },

        thinkStream: async function* (state: State, observation: LangfuseSpanClient | LangfuseTraceClient): AsyncGenerator<string, State, unknown> {
            const prompt = await langfuseService.getChatPrompt("think-chat")

            const prompt_input = {
                tools: formatted_tools,
                documents: formatDocuments(state),
            }

            const compiled_prompt = prompt.compile(prompt_input)

            const completionConfig = {
                messages: [
                    compiled_prompt[0],
                    lastUserMessage(state)
                ] as CoreMessage[],
                temperature: 0,
                max_tokens: 4000
            }

            const generation = langfuseService.startGeneration(observation, {
                name: `thinking #${state.step}`,
                model: modelId,
                input: {
                    user_message: [lastUserMessage(state)],
                    ...prompt_input
                },
                prompt: prompt,
            })

            const {textStream, object} = completion.streamObject<ThoughtsResponse>(completionConfig)

            // Yield text chunks as they arrive
            for await (const chunk of textStream) {
                yield chunk
            }

            // Wait for final object
            const result = await object

            langfuseService.endGeneration(generation, {output: result})

            console.log("🧠 Thinking result ", result)

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
                    lastUserMessage(state)
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

            console.log("🧰 Use result ", result)

            return produce(state, draft => {
                const call = draft.call_stack.at(-1)!
                call.action = result.result.action
                call.payload = result.result.payload
            })
        },

        useStream: async function* (state: State, observation: LangfuseSpanClient | LangfuseTraceClient): AsyncGenerator<string, State, unknown> {
            const completionConfig = {
                messages: [
                    {role: "system", content: usePrompt(state)},
                    lastUserMessage(state)
                ] as CoreMessage[],
                temperature: 0,
                max_tokens: 4000
            }

            const generation = langfuseService.startGeneration(observation, {
                name: `use ${currentCall(state)?.tool}`,
                model: modelId,
                input: completionConfig.messages
            })

            const {textStream, object} = completion.streamObject<ToolUseResponse>(completionConfig)

            // Yield text chunks as they arrive
            for await (const chunk of textStream) {
                yield chunk
            }

            // Wait for final object
            const result = await object

            langfuseService.endGeneration(generation, {output: result})

            console.log("🧰 Use result ", result)

            return produce(state, draft => {
                const call = draft.call_stack.at(-1)!
                call.action = result.result.action
                call.payload = result.result.payload
            })
        },

        act: async (state: State, observation: LangfuseSpanClient | LangfuseTraceClient): Promise<State> => {
            const call = currentCall(state)!
            const tool_call = tool_registry.find(t => t.name === call.tool)?.executor!

            const span = langfuseService.startSpan(observation, {
                name: currentCall(state)?.action ?? 'act',
                input: call
            })

            const document = await tool_call(call.action!, {conversation_uuid: state.conversation_uuid, ...call.payload})
            console.log(`⚙️${call.tool}, ${call.action} execution result.\n ${document.text}`)
            langfuseService.endSpan(span, {output: document})

            return produce(state, draft => {
                draft.documents.push(document)
            })
        },

        process: async function* (state: State, trace: LangfuseTraceClient): AsyncGenerator<AgentEvent, State, unknown> {

            let newState: State = state

            while (shouldContinue(newState)) {
                console.log(`🔁 Starting step #${newState.step}`)

                // Emit step_start event
                yield createStepStartEvent(newState.step, newState.max_steps)

                const span = langfuseService.startSpan(trace, {
                    name: `step ${newState.step}`, input: {
                        documents: state.documents
                    }
                })

                try {
                    // Stream thinking phase
                    yield createThinkingStartEvent()
                    const thinkGenerator = aiService.thinkStream(newState, span)
                    let thinkResult = await thinkGenerator.next()
                    while (!thinkResult.done) {
                        yield createThinkingChunkEvent(thinkResult.value as string)
                        thinkResult = await thinkGenerator.next()
                    }
                    newState = thinkResult.value as State

                    const call = currentCall(newState)

                    // Emit thinking completion event with reasoning
                    yield createThinkingEvent(newState.thoughts?.next_action_reasoning || "Processing...")

                    // Emit tool_selected event
                    yield createToolSelectedEvent(
                        call?.tool || "unknown",
                        newState.thoughts?.next_action || "Deciding next action"
                    )

                    if (call?.tool === "final_answer") {
                        langfuseService.endSpan(span, {
                            output: {
                                documents: state.documents
                            }
                        })
                        console.log(`🔁Step #${newState.step} completed`)
                        break
                    }

                    // Stream tool use phase
                    yield createToolUseStartEvent(call?.tool || "unknown")
                    const useGenerator = aiService.useStream(newState, span)
                    let useResult = await useGenerator.next()
                    while (!useResult.done) {
                        yield createToolUseChunkEvent(useResult.value as string)
                        useResult = await useGenerator.next()
                    }
                    newState = useResult.value as State

                    const updatedCall = currentCall(newState)

                    if (updatedCall?.payload) {
                        // Emit tool_executing event
                        yield createToolExecutingEvent(
                            updatedCall.tool,
                            updatedCall.action || "execute"
                        )

                        newState = await aiService.act(newState, span)

                        // Emit tool_result event
                        const lastDocument = newState.documents.at(-1)
                        yield createToolResultEvent(
                            true,
                            extractDocumentSummary(lastDocument)
                        )
                    }

                    langfuseService.endSpan(span, {
                        output: {
                            documents: state.documents
                        }
                    })
                    console.log(`🔁Step #${newState.step} completed`)
                    newState = produce(newState, draft => {
                        draft.step = draft.step + 1
                    })
                } catch (error) {
                    // Emit error event
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
                    yield createErrorEvent(errorMessage, false)

                    langfuseService.endSpan(span, {
                        output: {
                            error: errorMessage,
                            documents: state.documents
                        }
                    })
                    throw error
                }
            }

            return newState
        }
    }
}

const aiService = createAiService()

export {
    aiService
};

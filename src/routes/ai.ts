import {type Context, Hono} from "hono";
import type {CoreMessage} from "ai";
import {aiService} from "../services/ai.service.ts";
import {completion, modelId} from "../services/llm.service.ts";
import {streamSSE} from "hono/streaming";
import {prompt as answerPrompt} from "../prompts/agent.answer.ts"
import type {AgentEvent, State} from "../types/agent.ts";
import {v4 as uuidv4} from 'uuid';
import {langfuseService} from "../services/langfuse.service.ts";
import {
    createAnswerChunkEvent,
    createAnswerStartEvent,
    createDoneEvent,
    formatSSEEvent
} from "../utils/streaming.ts";


export const ai = new Hono()

ai.post("/chat", async (c: Context) => {
    const body = c.get("request") as { messages: CoreMessage[], stream?: boolean, conversation_uuid?: string }

    const conversation_uuid = body.conversation_uuid ?? uuidv4();

    const trace = langfuseService.initializeTrace({name: conversation_uuid, session_id: conversation_uuid})

    const state: State = {
        conversation_uuid: conversation_uuid,
        messages: body.messages,
        step: 1,
        max_steps: 5,
        documents: [],
        call_stack: []
    }

    // Streaming mode: return SSE stream with real-time progress events
    if (body.stream) {
        return streamSSE(c, async (stream) => {
            let finalState: State = state

            // Stream agent progress events
            const generator = aiService.process(state, trace)
            let result = await generator.next()

            while (!result.done) {
                const event = result.value as AgentEvent
                await stream.writeSSE({data: formatSSEEvent(event)})
                result = await generator.next()
            }

            // Generator returned the final state
            finalState = result.value as State

            const completionConfig = {
                messages: [
                    {role: 'system', content: answerPrompt(finalState)},
                    ...body.messages
                ] as CoreMessage[],
                temperature: 0.2,
                max_tokens: 2000,
            }

            const generation = langfuseService.startGeneration(trace, {
                name: "answer",
                model: modelId,
                input: completionConfig.messages
            })

            // Emit answer_start event
            await stream.writeSSE({data: formatSSEEvent(createAnswerStartEvent())})

            // Stream the final answer token by token
            let fullAnswer = ""
            const textStream = completion.stream(completionConfig)
            for await (const chunk of textStream) {
                fullAnswer += chunk
                await stream.writeSSE({data: formatSSEEvent(createAnswerChunkEvent(chunk))})
            }

            langfuseService.endGeneration(generation, {
                output: {
                    answer: fullAnswer,
                    trajectory: finalState.call_stack.map(c => `${c.tool}${c.action ? `_${c.action}` : ''}`),
                }
            })

            // Emit done event with trajectory
            const trajectory = finalState.call_stack.map(c => `${c.tool}${c.action ? `_${c.action}` : ''}`)
            await stream.writeSSE({data: formatSSEEvent(createDoneEvent(trajectory))})

            langfuseService.finalizeTrace(trace, {messages: body.messages, completion: fullAnswer})
            await langfuseService.flush()
        })
    }

    // Non-streaming mode: consume generator silently and return JSON (backwards compatibility)
    let finalState: State = state
    const generator = aiService.process(state, trace)
    let result = await generator.next()

    while (!result.done) {
        // Discard events, just continue
        result = await generator.next()
    }

    // Generator returned the final state
    finalState = result.value as State

    const completionConfig = {
        messages: [
            {role: 'system', content: answerPrompt(finalState)},
            ...body.messages
        ] as CoreMessage[],
        temperature: 0.2,
        max_tokens: 2000,
    }

    const generation = langfuseService.startGeneration(trace, {
        name: "answer",
        model: modelId,
        input: completionConfig.messages
    })

    const answer = await completion.text(completionConfig)

    langfuseService.endGeneration(generation, {
        output: {
            answer: answer,
            trajectory: finalState.call_stack.map(c => `${c.tool}${c.action ? `_${c.action}` : ''}`),
        }
    })

    langfuseService.finalizeTrace(trace, {messages: body.messages, completion: answer as string})
    await langfuseService.flush()

    return c.json({response: answer});
});

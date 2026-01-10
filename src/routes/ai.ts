import {type Context, Hono} from "hono";
import type {CoreMessage} from "ai";
import {aiService} from "../services/ai.service.ts";
import {completion, modelId} from "../services/llm.service.ts";
import {streamSSE} from "hono/streaming";
import {prompt as answerPrompt} from "../prompts/agent.answer.ts"
import type {State} from "../types/agent.ts";
import {v4 as uuidv4} from 'uuid';
import {langfuseService} from "../services/langfuse.service.ts";


export const ai = new Hono()

ai.post("/chat", async (c: Context) => {
    const body = c.get("request") as { messages: CoreMessage[], stream: boolean, conversation_uuid?: string }

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

    const newState = await aiService.process(state, trace);

    const completionConfig = {
        messages: [
            {role: 'system', content: answerPrompt(newState)},
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
            trajectory: newState.call_stack.map(c => `${c.tool}_${c.action}`)
        }
    })

    langfuseService.finalizeTrace(trace, {messages: body.messages, completion: answer as string})
    langfuseService.flush()

    return c.json({response: answer});
});


function streamResponse(c: Context, s: AsyncIterable<string>) {
    c.header('Content-Type', 'text/event-stream')
    c.header('Cache-Control', 'no-cache')
    c.header('Connection', 'keep-alive')

    return streamSSE(c, async (stream: {
        writeSSE: (arg0: { data: string; event: string; id: string; }) => any;
        sleep: (arg0: number) => any;
    }) => {

        for await (const event of s) {
            const sseData: any = {
                data: JSON.stringify(event),
            };

            stream.writeSSE(sseData);
        }
    })
}
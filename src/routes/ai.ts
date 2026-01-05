import {type Context, Hono} from "hono";
import type {CoreMessage} from "ai";
import {aiService} from "../services/ai.service.ts";
import {completion} from "../services/llm.service.ts";
import {streamSSE} from "hono/streaming";
import {prompt as answerPrompt} from "../prompts/agent.answer.ts"
import type {State} from "../types/agent.ts";
import {v4 as uuidv4} from 'uuid';
import {langfuseService} from "../services/langfuse.service.ts";


export const ai = new Hono()

ai.post("/chat", async (c) => {
    const body = await c.req.json<{ messages: CoreMessage[], stream: boolean, conversation_uuid?: string }>();

    const conversation_uuid = body.conversation_uuid ?? uuidv4();

    const state: State = {
        trace: langfuseService.initializeTrace({name: 'general', session_id: conversation_uuid}),
        conversation_uuid: conversation_uuid,
        messages: body.messages
    }

    const newState = await aiService.process(state);

    const completionConfig =  {
        messages: [
            { role: 'system', content: answerPrompt(newState.documents?.toString() ?? "Answer") },
            ...body.messages
        ] as CoreMessage[],
        temperature: 0.2,
        max_tokens: 2000,
    }

    const answer = body.stream ? completion.stream(completionConfig) : await completion.text(completionConfig)


    if (body.stream){
        return streamResponse(c, answer as AsyncIterable<string>)
    }else {
        langfuseService.finalizeTrace(newState.trace, {messages: body.messages, completion: answer as string})
        return c.json({response: answer});
    }
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
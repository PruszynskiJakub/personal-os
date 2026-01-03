import {type Context, Hono} from "hono";
import type {CoreMessage} from "ai";
import {aiService} from "../services/ai.service.ts";
import {completion} from "../services/llm.service.ts";
import {streamSSE} from "hono/streaming";
import {prompt as answerPrompt} from "../prompts/agent.answer.ts"


export const ai = new Hono()

ai.post("/chat", async (c) => {
    const body = await c.req.json<{ messages: CoreMessage[], stream: boolean }>();

    const result = await aiService.process(body.messages);

    const completionConfig =  {
        messages: [
            { role: 'system', content: answerPrompt(result) },
            ...body.messages
        ] as CoreMessage[],
        temperature: 0.2,
        max_tokens: 2000,
    }

    const answer = body.stream ? completion.stream(completionConfig) : await completion.text(completionConfig)

    if (body.stream){
        return streamResponse(c, answer as AsyncIterable<string>)
    }else {
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
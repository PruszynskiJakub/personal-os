import {type Context, Hono} from "hono";
import {logger} from "hono/logger";
import {prettyJSON} from 'hono/pretty-json';
import type {CoreMessage} from "ai";
import {completion} from "./src/services/llm.service.ts";
import {prompt as thinkPrompt} from "./src/prompts/agent.think.ts"
import {streamSSE} from 'hono/streaming'


const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());

app.post("/chat", async (c) => {
    const body = await c.req.json<{ messages: CoreMessage[], stream: boolean }>();

    const completionConfig = {
        messages: [
            {role: "system", content: thinkPrompt()},
            ...body.messages
        ] as CoreMessage[],
        temperature: 0,
        maxTokens: 4000
    }

    if (body.stream){
        const stream = completion.stream(completionConfig);
        return streamResponse(c, stream)
    }else {
        const thinkingResult = await completion.text(completionConfig)
        return c.json({response: thinkingResult});
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


export default {
    port: 3000,
    fetch: app.fetch,
};

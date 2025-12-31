import {Hono} from "hono";
import {logger} from "hono/logger";
import {prettyJSON} from 'hono/pretty-json';
import type {CoreMessage} from "ai";
import {completion} from "./src/services/llm.service.ts";
import {prompt as thinkPrompt} from "./src/prompts/agent.think.ts"

const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());

app.post("/chat", async (c) => {
    const body = await c.req.json<{ messages: CoreMessage[] }>();
    const lastUserMessage = body.messages.findLast((m) => m.role === "user");

    const thinkingResult = await completion.text({
        messages: [
            {role: "system", content: thinkPrompt()},
            ...body.messages
        ],
        temperature: 0,
        maxTokens: 4000
    })

    return c.json({response: thinkingResult});
});


export default {
    port: 3000,
    fetch: app.fetch,
};

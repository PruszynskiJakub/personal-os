import {Hono} from "hono";
import {logger} from "hono/logger";
import {prettyJSON} from 'hono/pretty-json';
import {ai} from "./src/routes/ai.ts";
import {langfuseService} from "./src/services/langfuse.service.ts";
import type {CoreMessage} from "ai";
import {completion} from "./src/services/llm.service.ts";
import {filesMiddleware} from "./src/middlewares/files.middleware.ts";
import {files} from "./src/routes/files.ts";

const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());

const cleanup = async () => {
    await langfuseService.shutdown()
    process.exit(0);
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

app.use("/api/ai/chat", filesMiddleware)
app.route("/api/ai", ai)
app.route("/api/files", files)

app.post("/test", async (c) => {
    const body = await c.req.formData()
    const file = body.get('file') as File

    console.log(file)

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64')// Convert to base64

    const completionConfig = {
        messages: [
            {
                role: 'system',
                content: "Describe with great care what you see in the image. Extract key diving record data.Return only the diving data."
            },
            {role: 'user', content: [{type: 'image', image: base64}]}
        ] as CoreMessage[],
        temperature: 0.2,
        max_tokens: 4000,
    }


    const result = await completion.text(completionConfig)

    return c.json({response: result});
})

export default {
    port: 3000,
    fetch: app.fetch,
};

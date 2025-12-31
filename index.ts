import {Hono} from "hono";
import {logger} from "hono/logger";
import {prettyJSON} from 'hono/pretty-json';
import type {Message} from "./src/types/Message";

const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());

app.post("/chat", async (c) => {
    const body = await c.req.json<{ messages: Message[] }>();
    const lastUserMessage = body.messages.findLast((m) => m.role === "user");

    return c.json({response: lastUserMessage});
});


export default {
    port: 3000,
    fetch: app.fetch,
};

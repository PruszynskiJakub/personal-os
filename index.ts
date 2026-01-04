import {Hono} from "hono";
import {logger} from "hono/logger";
import {prettyJSON} from 'hono/pretty-json';
import {ai} from "./src/routes/ai.ts";
import {langfuseService} from "./src/services/langfuse.service.ts";

const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());

const cleanup = async () => {
    await langfuseService.shutdown()
    process.exit(0);
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

app.route("/api/ai", ai)

export default {
    port: 3000,
    fetch: app.fetch,
};

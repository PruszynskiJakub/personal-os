import {Hono} from "hono";
import {logger} from "hono/logger";
import {prettyJSON} from 'hono/pretty-json';
import {ai} from "./src/routes/ai.ts";


const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());

app.route("/", ai)

export default {
    port: 3000,
    fetch: app.fetch,
};

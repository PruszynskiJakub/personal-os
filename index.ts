import { Hono } from "hono";

const app = new Hono();

app.get("/chat", (c) => {
  return c.text("Hello from chat endpoint");
});

export default app;

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { Hono } from "hono";

const app = new Hono();

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

app.post("/chat", async (c) => {
  const body = await c.req.json<{ messages: Message[] }>();
  const lastUserMessage = body.messages.findLast((m) => m.role === "user");

  if (!lastUserMessage) {
    return c.json({ error: "No user message found" }, 400);
  }

  const result = await generateText({
    model: google("gemini-2.0-flash"),
    prompt: lastUserMessage.content,
  });

  return c.json({ response: result.text });
});

export default {
  port: 3000,
  fetch: app.fetch,
};

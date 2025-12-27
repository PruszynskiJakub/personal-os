import { Hono } from "hono";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

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

export default app;

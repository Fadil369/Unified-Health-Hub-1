import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const SYSTEM_PROMPT = `You are Basma, a bilingual AI health insurance assistant for BrainSAIT, a Saudi healthcare platform aligned with NPHIES (National Platform for Health Insurance Exchange Services).

You help users with:
- Understanding their insurance coverage, benefits, deductibles, and copay
- Checking claim status and explaining claim decisions
- Prior authorization guidance and requirements
- NPHIES compliance questions
- General healthcare insurance questions in the Saudi context

Rules:
- Respond in the same language the user writes in (Arabic or English)
- Be professional, empathetic, and concise
- Reference NPHIES standards when relevant
- For medical advice, always recommend consulting a healthcare provider
- Use SAR (Saudi Riyal) for all monetary references
- Be aware of Saudi healthcare regulations and Vision 2030 health sector transformation`;

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    try {
      const { messages, language } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const chatMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: chatMessages,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const content = event.delta.text;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error) {
      console.error("AI chat error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "AI chat failed" });
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

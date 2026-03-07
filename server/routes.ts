import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import {
  searchSBSCodes,
  getSBSCode,
  getSBSCategories,
  getProviders,
  getCoverage,
  getClaims,
  getClaimById,
  createClaim,
  getPriorAuths,
  createPriorAuth,
  checkEligibility,
} from "./storage";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const SYSTEM_PROMPT = `You are Basma, a bilingual AI health insurance assistant for BrainSAIT, a Saudi healthcare platform aligned with NPHIES (National Platform for Health Insurance Exchange Services) and the Saudi Billing System (SBS V3.1).

You have deep knowledge of:
- The SBS V3.1 code catalogue (20,000+ medical procedure codes from CHI - Council of Health Insurance)
- 23 SBS categories covering all medical specialties (Nervous System, Cardiovascular, Dental, Laboratory, Imaging, Pharmacy, etc.)
- NPHIES compliance requirements for claims, prior authorizations, and eligibility
- CHI financial rules including copay calculations, facility tier pricing, and bundle rules
- The claim processing pipeline: Validation → SBS Code Lookup → Financial Rules → NPHIES Submission

You help users with:
- Understanding their insurance coverage, benefits, deductibles, and copay
- Looking up SBS procedure codes and explaining what they cover
- Checking claim status and explaining claim decisions, including pipeline stage details
- Prior authorization guidance — which procedures require pre-auth and approval probability
- NPHIES compliance questions
- General healthcare insurance questions in the Saudi context

Rules:
- Respond in the same language the user writes in (Arabic or English)
- Be professional, empathetic, and concise
- Reference SBS codes and NPHIES standards when relevant
- For medical advice, always recommend consulting a healthcare provider
- Use SAR (Saudi Riyal) for all monetary references
- Be aware of Saudi healthcare regulations and Vision 2030 health sector transformation
- When users ask about procedures, mention the relevant SBS category and whether prior authorization is required`;

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/sbs/search", async (req: Request, res: Response) => {
    try {
      const query = (req.query.q as string) || "";
      const category = req.query.category as string | undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const results = await searchSBSCodes(query, category, limit);
      res.json({ codes: results, results, total: results.length });
    } catch (error) {
      console.error("SBS search error:", error);
      res.status(500).json({ error: "Failed to search SBS codes" });
    }
  });

  app.get("/api/sbs/categories", async (_req: Request, res: Response) => {
    try {
      const categories = await getSBSCategories();
      res.json({ categories });
    } catch (error) {
      console.error("SBS categories error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/sbs/code/:sbsId", async (req: Request, res: Response) => {
    try {
      const code = await getSBSCode(req.params.sbsId);
      if (!code) {
        return res.status(404).json({ error: "SBS code not found" });
      }
      res.json(code);
    } catch (error) {
      console.error("SBS code error:", error);
      res.status(500).json({ error: "Failed to fetch SBS code" });
    }
  });

  app.get("/api/providers", async (_req: Request, res: Response) => {
    try {
      const providers = await getProviders();
      res.json({ providers });
    } catch (error) {
      console.error("Providers error:", error);
      res.status(500).json({ error: "Failed to fetch providers" });
    }
  });

  app.get("/api/coverage/:memberId", async (req: Request, res: Response) => {
    try {
      const coverage = await getCoverage(req.params.memberId);
      if (!coverage) {
        return res.status(404).json({ error: "Coverage not found" });
      }
      res.json(coverage);
    } catch (error) {
      console.error("Coverage error:", error);
      res.status(500).json({ error: "Failed to fetch coverage" });
    }
  });

  app.post("/api/eligibility/check", async (req: Request, res: Response) => {
    try {
      const { memberId } = req.body;
      if (!memberId) {
        return res.status(400).json({ error: "memberId is required" });
      }
      const result = await checkEligibility(memberId);
      res.json(result);
    } catch (error) {
      console.error("Eligibility check error:", error);
      res.status(500).json({ error: "Eligibility check failed" });
    }
  });

  app.get("/api/claims", async (req: Request, res: Response) => {
    try {
      const memberId = (req.query.memberId as string) || "MEM-2024-001";
      const status = req.query.status as string | undefined;
      const claims = await getClaims(memberId, status);
      res.json({ claims });
    } catch (error) {
      console.error("Claims list error:", error);
      res.status(500).json({ error: "Failed to fetch claims" });
    }
  });

  app.get("/api/claims/:id", async (req: Request, res: Response) => {
    try {
      const claim = await getClaimById(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      res.json(claim);
    } catch (error) {
      console.error("Claim detail error:", error);
      res.status(500).json({ error: "Failed to fetch claim" });
    }
  });

  app.post("/api/claims", async (req: Request, res: Response) => {
    try {
      const {
        memberId,
        providerId,
        serviceDate,
        sbsCode,
        diagnosisCode,
        diagnosisDescEn,
        diagnosisDescAr,
        amount,
        clinicalNotes,
        priorAuthRef,
      } = req.body;

      const claimAmount = amount || req.body.amountClaimed;
      if (!memberId || !providerId || !serviceDate || !diagnosisCode || !claimAmount) {
        return res.status(400).json({
          error: "Missing required fields: memberId, providerId, serviceDate, diagnosisCode, amount",
        });
      }

      const claim = await createClaim({
        memberId,
        providerId,
        serviceDate,
        sbsCode: sbsCode || null,
        diagnosisCode,
        diagnosisDescEn: diagnosisDescEn || diagnosisCode,
        diagnosisDescAr,
        amount: parseFloat(claimAmount),
        clinicalNotes,
        priorAuthRef,
      });

      res.status(201).json(claim);
    } catch (error) {
      console.error("Create claim error:", error);
      res.status(500).json({ error: "Failed to create claim" });
    }
  });

  app.get("/api/prior-auth", async (req: Request, res: Response) => {
    try {
      const memberId = (req.query.memberId as string) || "MEM-2024-001";
      const auths = await getPriorAuths(memberId);
      res.json({ priorAuths: auths });
    } catch (error) {
      console.error("Prior auth list error:", error);
      res.status(500).json({ error: "Failed to fetch prior authorizations" });
    }
  });

  app.post("/api/prior-auth", async (req: Request, res: Response) => {
    try {
      const {
        memberId,
        providerId,
        serviceType,
        sbsCode,
        serviceDescEn,
        serviceDescAr,
        diagnosisCode,
        diagnosisDescEn,
        diagnosisDescAr,
        urgency,
        clinicalNotes,
      } = req.body;

      if (!memberId || !diagnosisCode) {
        return res.status(400).json({
          error: "Missing required fields: memberId, diagnosisCode",
        });
      }

      const auth = await createPriorAuth({
        memberId,
        providerId: providerId || 1,
        serviceType: serviceType || "procedure",
        sbsCode: sbsCode || null,
        serviceDescEn: serviceDescEn || "",
        serviceDescAr,
        diagnosisCode,
        diagnosisDescEn: diagnosisDescEn || diagnosisCode,
        diagnosisDescAr,
        urgency: urgency || "routine",
        clinicalNotes,
      });

      res.status(201).json(auth);
    } catch (error) {
      console.error("Create prior auth error:", error);
      res.status(500).json({ error: "Failed to create prior authorization" });
    }
  });

  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    try {
      const { messages, language, memberId } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      let contextInfo = "";
      const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";

      if (lastMessage.includes("sbs") || lastMessage.includes("code") || lastMessage.includes("procedure") || lastMessage.includes("رمز") || lastMessage.includes("إجراء")) {
        const searchTerms = lastMessage.replace(/sbs|code|procedure|what is|tell me about|رمز|إجراء/gi, "").trim();
        if (searchTerms.length > 2) {
          const codes = await searchSBSCodes(searchTerms, undefined, 5);
          if (codes.length > 0) {
            contextInfo += "\n\nRelevant SBS codes found:\n";
            for (const c of codes) {
              contextInfo += `- ${c.sbs_code}: ${c.description_en} (Category: ${c.category_name || "N/A"}, Prior Auth: ${c.requires_prior_auth ? "Required" : "Not required"})\n`;
            }
          }
        }
      }

      if (memberId) {
        const coverage = await getCoverage(memberId);
        if (coverage) {
          contextInfo += `\n\nPatient coverage info: ${coverage.plan_name_en} with ${coverage.insurer_name_en}, Copay: ${coverage.copay_percentage}%, Deductible remaining: ${coverage.deductible_total - coverage.deductible_used} SAR, OOP remaining: ${coverage.oop_max - coverage.oop_used} SAR`;
        }
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const chatMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const systemPrompt = SYSTEM_PROMPT + contextInfo;

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: systemPrompt,
        messages: chatMessages,
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
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

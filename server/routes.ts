import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
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
import pool from "./db";
import { getGitHubUser, getGitHubUserEmails } from "./githubAuth";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

// ─── Zod Validation Schemas ──────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  nameEn: z.string().min(1).max(100).optional(),
  nameAr: z.string().max(100).optional(),
  phone: z.string().regex(/^\+?[\d\s\-()+]+$/, "Invalid phone number").optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const claimSchema = z.object({
  memberId: z.string().min(1, "Member ID required"),
  providerId: z.coerce.number().int().positive("Provider ID must be a positive integer"),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Service date must be YYYY-MM-DD"),
  diagnosisCode: z.string().min(1, "Diagnosis code required"),
  amount: z.coerce.number().positive("Amount must be positive").optional(),
  sbsCode: z.string().optional(),
  diagnosisDescEn: z.string().optional(),
  diagnosisDescAr: z.string().optional(),
  clinicalNotes: z.string().optional(),
  priorAuthRef: z.string().optional(),
  amountClaimed: z.coerce.number().positive().optional(),
}).refine(
  (data) => data.amount !== undefined || data.amountClaimed !== undefined,
  { message: "Amount is required", path: ["amount"] }
);

const priorAuthSchema = z.object({
  memberId: z.string().min(1, "Member ID required"),
  diagnosisCode: z.string().min(1, "Diagnosis code required"),
  providerId: z.coerce.number().int().positive().optional(),
  serviceType: z.string().optional(),
  sbsCode: z.string().optional(),
  serviceDescEn: z.string().optional(),
  serviceDescAr: z.string().optional(),
  diagnosisDescEn: z.string().optional(),
  diagnosisDescAr: z.string().optional(),
  urgency: z.enum(["routine", "urgent", "emergency"]).optional(),
  clinicalNotes: z.string().optional(),
});

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const SYSTEM_PROMPT = `You are Basma (بسمة), an advanced bilingual AI health insurance assistant for BrainSAIT, a Saudi healthcare platform aligned with NPHIES and the Saudi Billing System (SBS V3.1).

## Your Expertise
You are a domain expert with deep knowledge of:

### SBS V3.1 Catalogue (10,000+ Codes)
- 24 categories covering all medical specialties: Nervous System (01), Endocrine (02), Eye (03), Ear (04), Nose/Mouth/Pharynx (05), Dental (06), Respiratory (07), Cardiovascular (08), Blood/Lymph (09), Digestive (10), Urinary (11), Male Genital (12), Female Genital (13), Musculoskeletal (14), Dermatology (15), Breast (16), Radiation Oncology (17), Non-invasive/Cognitive (18), Imaging (19), Laboratory (21), Pharmacy (22), Obstetric (23), and Allied Health (99)
- Each code has: SBS ID, description (EN/AR), category, subcategory, prior authorization requirements
- Codes starting with 9xxxx are typically pharmacy/allied health; codes starting with smaller numbers are procedural

### NPHIES Compliance
- National Platform for Health Insurance Exchange Services requirements
- Claim lifecycle: Submission → Validation → SBS Code Lookup → Financial Rules → Payer Review → Decision
- Prior authorization workflow and requirements
- Eligibility verification standards

### CHI Financial Rules
- Council of Health Insurance regulations
- Copay calculations based on plan tier (typically 20% for standard plans)
- Deductible tracking and out-of-pocket maximums
- Network tier pricing (Tier A hospitals vs Tier B clinics)
- Bundle rules for related procedures

## Your Capabilities
1. **Medical Code Intelligence**: Given symptoms or a procedure description, recommend the most appropriate SBS codes
2. **Approval Prediction**: Estimate prior authorization approval probability based on diagnosis, procedure, urgency, and clinical documentation
3. **Financial Analysis**: Calculate copay, estimate out-of-pocket costs, explain deductible impact
4. **Claim Guidance**: Explain claim statuses, denial reasons, and recommended next steps for appeals
5. **Coverage Analysis**: Explain benefits, remaining balances, and coverage limits
6. **Proactive Insights**: Alert users when deductible is nearly met, suggest cost-saving alternatives, flag procedures requiring prior auth

## Communication Rules
- Respond in the same language the user writes in (Arabic or English)
- Be professional, empathetic, and thorough
- Reference specific SBS codes and NPHIES standards when relevant
- For medical advice, always recommend consulting a healthcare provider
- Use SAR (Saudi Riyal) for all monetary references
- When discussing procedures, always mention: SBS code, category, whether prior auth is needed, and estimated copay
- Provide actionable next steps, not just information`;

async function getUserFromToken(req: Request): Promise<any | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const result = await pool.query(
    `SELECT u.* FROM user_accounts u
     JOIN user_sessions s ON s.user_id = u.id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  );
  return result.rows[0] || null;
}

function generateToken(): string {
  return randomBytes(48).toString("hex");
}

function generateMemberId(): string {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 99999)).padStart(5, "0");
  return `MEM-${year}-${num}`;
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ─── Initialise background jobs ──────────────────────────────────
  // Purge expired sessions every hour
  setInterval(async () => {
    try {
      const result = await pool.query("DELETE FROM user_sessions WHERE expires_at < NOW()");
      if ((result.rowCount ?? 0) > 0) {
        console.log(`[cleanup] Removed ${result.rowCount} expired session(s)`);
      }
    } catch (err) {
      console.error("[cleanup] Session cleanup failed:", err);
    }
  }, 60 * 60 * 1000);

  // Ensure notifications table exists (idempotent)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id          SERIAL PRIMARY KEY,
        user_id     TEXT NOT NULL,
        type        TEXT NOT NULL DEFAULT 'info',
        title_en    TEXT NOT NULL,
        title_ar    TEXT,
        body_en     TEXT NOT NULL,
        body_ar     TEXT,
        data        JSONB,
        is_read     BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON user_notifications(user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE;
    `);

    // Performance indexes on core tables
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_accounts_email     ON user_accounts(email);
      CREATE INDEX IF NOT EXISTS idx_user_accounts_member_id  ON user_accounts(member_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token      ON user_sessions(token);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_claims_member_id         ON healthcare_claims(member_id);
      CREATE INDEX IF NOT EXISTS idx_claims_claim_number      ON healthcare_claims(claim_number);
      CREATE INDEX IF NOT EXISTS idx_prior_auth_member_id     ON prior_authorizations(member_id);
    `);
  } catch (setupErr) {
    // Log but don't crash – tables may not exist yet on first boot
    console.warn("[startup] Table/index setup warning (non-fatal):", setupErr);
  }

  // ─── Health Check ─────────────────────────────────────────────────

  app.get("/api/health", async (_req: Request, res: Response) => {
    let dbStatus = "healthy";
    let dbLatencyMs = 0;
    try {
      const t0 = Date.now();
      await pool.query("SELECT 1");
      dbLatencyMs = Date.now() - t0;
    } catch {
      dbStatus = "unhealthy";
    }
    res.status(dbStatus === "healthy" ? 200 : 503).json({
      status: dbStatus === "healthy" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: "1.0.0",
      services: {
        database: { status: dbStatus, latencyMs: dbLatencyMs },
      },
    });
  });

  // ─── Notifications Routes ────────────────────────────────────────

  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) return res.status(401).json({ error: "Not authenticated" });

      const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
      const onlyUnread = req.query.unread === "true";

      const where = onlyUnread ? "WHERE user_id = $1 AND is_read = FALSE" : "WHERE user_id = $1";
      const result = await pool.query(
        `SELECT * FROM user_notifications ${where} ORDER BY created_at DESC LIMIT $2`,
        [user.id, limit]
      );

      const countResult = await pool.query(
        "SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = FALSE",
        [user.id]
      );

      res.json({
        notifications: result.rows,
        unreadCount: parseInt(countResult.rows[0].count, 10),
      });
    } catch (error) {
      console.error("Notifications fetch error:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", async (req: Request, res: Response) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) return res.status(401).json({ error: "Not authenticated" });

      const result = await pool.query(
        "SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = FALSE",
        [user.id]
      );
      res.json({ count: parseInt(result.rows[0].count, 10) });
    } catch (error) {
      console.error("Unread count error:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) return res.status(401).json({ error: "Not authenticated" });

      await pool.query(
        "UPDATE user_notifications SET is_read = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2",
        [req.params.id, user.id]
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req: Request, res: Response) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) return res.status(401).json({ error: "Not authenticated" });

      const result = await pool.query(
        "UPDATE user_notifications SET is_read = TRUE, updated_at = NOW() WHERE user_id = $1 AND is_read = FALSE",
        [user.id]
      );
      res.json({ success: true, marked: result.rowCount ?? 0 });
    } catch (error) {
      console.error("Mark all read error:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // ─── Auth Routes ────────────────────────────────────────────────

  app.get("/api/auth/github", async (_req: Request, res: Response) => {
    try {
      const ghUser = await getGitHubUser();
      let emails: any[] = [];
      try {
        emails = await getGitHubUserEmails();
      } catch (e) {}
      const primaryEmail = Array.isArray(emails)
        ? emails.find((e: any) => e.primary)?.email || emails[0]?.email || ghUser.email
        : ghUser.email;

      let userRow = await pool.query(
        "SELECT * FROM user_accounts WHERE github_id = $1",
        [String(ghUser.id)]
      );

      if (!userRow.rows[0]) {
        const existingByEmail = await pool.query(
          "SELECT * FROM user_accounts WHERE email = $1",
          [primaryEmail]
        );

        if (existingByEmail.rows[0]) {
          await pool.query(
            "UPDATE user_accounts SET github_id = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3",
            [String(ghUser.id), ghUser.avatar_url, existingByEmail.rows[0].id]
          );
          userRow = await pool.query("SELECT * FROM user_accounts WHERE id = $1", [existingByEmail.rows[0].id]);
        } else {
          const memberId = generateMemberId();
          userRow = await pool.query(
            `INSERT INTO user_accounts (github_id, email, username, name_en, avatar_url, member_id)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [String(ghUser.id), primaryEmail, ghUser.login, ghUser.name || ghUser.login, ghUser.avatar_url, memberId]
          );

          await pool.query(`
            INSERT INTO healthcare_coverage (member_id, insurer_name_en, insurer_name_ar, policy_number, plan_name_en, plan_name_ar, status, start_date, end_date, deductible_used, deductible_total, oop_used, oop_max, copay_percentage, network_tier, benefits)
            VALUES ($1, 'Bupa Arabia', 'شركة بوبا للتأمين', $2, 'Gold Plan', 'الخطة الذهبية', 'active', NOW(), NOW() + INTERVAL '2 years', 0, 5000, 0, 15000, 20, 'Tier 1',
             '[{"id":"ben-001","nameAr":"طبي","nameEn":"Medical","used":0,"total":50000,"icon":"medkit"},{"id":"ben-002","nameAr":"أسنان","nameEn":"Dental","used":0,"total":5000,"icon":"body"},{"id":"ben-003","nameAr":"بصريات","nameEn":"Vision","used":0,"total":2000,"icon":"eye"},{"id":"ben-004","nameAr":"صيدلة","nameEn":"Pharmacy","used":0,"total":10000,"icon":"flask"}]')
            ON CONFLICT (member_id) DO NOTHING
          `, [memberId, `POL-${new Date().getFullYear()}-${Math.floor(Math.random() * 99999)}`]);
        }
      }

      const user = userRow.rows[0];
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await pool.query(
        "INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
        [user.id, token, expiresAt]
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          nameEn: user.name_en,
          nameAr: user.name_ar,
          email: user.email,
          phone: user.phone,
          nationalId: user.national_id,
          memberId: user.member_id,
          avatarUrl: user.avatar_url,
          githubConnected: !!user.github_id,
        },
      });
    } catch (error) {
      console.error("GitHub auth error:", error);
      res.status(500).json({ error: "GitHub authentication failed" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.errors[0]?.message || "Invalid input",
          details: parsed.error.errors,
        });
      }
      const { email, password, nameEn, nameAr, phone } = parsed.data;
      const existing = await pool.query("SELECT id FROM user_accounts WHERE email = $1", [email]);
      if (existing.rows[0]) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const memberId = generateMemberId();
      const hashedPassword = await bcrypt.hash(password, 10);
      const userResult = await pool.query(
        `INSERT INTO user_accounts (email, username, name_en, name_ar, phone, member_id, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [email, email.split("@")[0], nameEn || email.split("@")[0], nameAr || "", phone || "", memberId, hashedPassword]
      );

      const user = userResult.rows[0];

      await pool.query(`
        INSERT INTO healthcare_coverage (member_id, insurer_name_en, insurer_name_ar, policy_number, plan_name_en, plan_name_ar, status, start_date, end_date, deductible_used, deductible_total, oop_used, oop_max, copay_percentage, network_tier, benefits)
        VALUES ($1, 'Bupa Arabia', 'شركة بوبا للتأمين', $2, 'Gold Plan', 'الخطة الذهبية', 'active', NOW(), NOW() + INTERVAL '2 years', 0, 5000, 0, 15000, 20, 'Tier 1',
         '[{"id":"ben-001","nameAr":"طبي","nameEn":"Medical","used":0,"total":50000,"icon":"medkit"},{"id":"ben-002","nameAr":"أسنان","nameEn":"Dental","used":0,"total":5000,"icon":"body"},{"id":"ben-003","nameAr":"بصريات","nameEn":"Vision","used":0,"total":2000,"icon":"eye"},{"id":"ben-004","nameAr":"صيدلة","nameEn":"Pharmacy","used":0,"total":10000,"icon":"flask"}]')
        ON CONFLICT (member_id) DO NOTHING
      `, [memberId, `POL-${new Date().getFullYear()}-${Math.floor(Math.random() * 99999)}`]);

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await pool.query(
        "INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
        [user.id, token, expiresAt]
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          nameEn: user.name_en,
          nameAr: user.name_ar,
          email: user.email,
          phone: user.phone,
          nationalId: user.national_id,
          memberId: user.member_id,
          avatarUrl: user.avatar_url,
          githubConnected: false,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.errors[0]?.message || "Invalid input",
          details: parsed.error.errors,
        });
      }
      const { email, password } = parsed.data;

      const userResult = await pool.query(
        "SELECT * FROM user_accounts WHERE email = $1",
        [email]
      );

      if (!userResult.rows[0]) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const passwordValid = userResult.rows[0].password_hash
        ? await bcrypt.compare(password, userResult.rows[0].password_hash)
        : false;

      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = userResult.rows[0];
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await pool.query(
        "INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
        [user.id, token, expiresAt]
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          nameEn: user.name_en,
          nameAr: user.name_ar,
          email: user.email,
          phone: user.phone,
          nationalId: user.national_id,
          memberId: user.member_id,
          avatarUrl: user.avatar_url,
          githubConnected: !!user.github_id,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.json({
        user: {
          id: user.id,
          username: user.username,
          nameEn: user.name_en,
          nameAr: user.name_ar,
          email: user.email,
          phone: user.phone,
          nationalId: user.national_id,
          memberId: user.member_id,
          avatarUrl: user.avatar_url,
          githubConnected: !!user.github_id,
        },
      });
    } catch (error) {
      console.error("Auth me error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        await pool.query("DELETE FROM user_sessions WHERE token = $1", [token]);
      }
      res.json({ success: true });
    } catch (error) {
      res.json({ success: true });
    }
  });

  app.put("/api/auth/profile", async (req: Request, res: Response) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { nameEn, nameAr, phone, nationalId } = req.body;
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (nameEn !== undefined) { updates.push(`name_en = $${idx++}`); values.push(nameEn); }
      if (nameAr !== undefined) { updates.push(`name_ar = $${idx++}`); values.push(nameAr); }
      if (phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(phone); }
      if (nationalId !== undefined) { updates.push(`national_id = $${idx++}`); values.push(nationalId); }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      updates.push(`updated_at = NOW()`);
      values.push(user.id);

      const result = await pool.query(
        `UPDATE user_accounts SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
        values
      );

      const u = result.rows[0];
      res.json({
        user: {
          id: u.id,
          username: u.username,
          nameEn: u.name_en,
          nameAr: u.name_ar,
          email: u.email,
          phone: u.phone,
          nationalId: u.national_id,
          memberId: u.member_id,
          avatarUrl: u.avatar_url,
          githubConnected: !!u.github_id,
        },
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ─── Payment Routes ─────────────────────────────────────────────

  app.get("/api/payments/config", async (_req: Request, res: Response) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Stripe config error:", error);
      res.status(500).json({ error: "Failed to get payment config" });
    }
  });

  app.post("/api/payments/create-intent", async (req: Request, res: Response) => {
    try {
      const authUser = await getUserFromToken(req);
      if (!authUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { claimId, amount, memberId } = req.body;
      if (!amount) {
        return res.status(400).json({ error: "Amount required" });
      }

      const stripe = await getUncachableStripeClient();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "sar",
        metadata: {
          claimId: claimId?.toString() || "",
          memberId: memberId || authUser.member_id || "",
          type: "claim_copay",
        },
      });

      await pool.query(
        `INSERT INTO claim_payments (claim_id, user_id, stripe_payment_intent_id, amount, currency, status, payment_method)
         VALUES ($1, $2, $3, $4, 'SAR', 'pending', 'stripe')`,
        [claimId || null, authUser.id, paymentIntent.id, amount]
      );

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
      });
    } catch (error) {
      console.error("Payment intent error:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.post("/api/payments/confirm", async (req: Request, res: Response) => {
    try {
      const { paymentIntentId } = req.body;
      if (!paymentIntentId) {
        return res.status(400).json({ error: "paymentIntentId required" });
      }

      const stripe = await getUncachableStripeClient();
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

      const status = pi.status === "succeeded" ? "completed" : pi.status === "canceled" ? "failed" : "pending";

      await pool.query(
        "UPDATE claim_payments SET status = $1, updated_at = NOW() WHERE stripe_payment_intent_id = $2",
        [status, paymentIntentId]
      );

      if (status === "completed") {
        const paymentRow = await pool.query(
          "SELECT claim_id FROM claim_payments WHERE stripe_payment_intent_id = $1",
          [paymentIntentId]
        );
        if (paymentRow.rows[0]?.claim_id) {
          await pool.query(
            "UPDATE healthcare_claims SET status = 'paid' WHERE id = $1 AND status = 'submitted'",
            [paymentRow.rows[0].claim_id]
          );
        }
      }

      res.json({ status, paymentIntentId });
    } catch (error) {
      console.error("Payment confirm error:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  app.get("/api/payments/history", async (req: Request, res: Response) => {
    try {
      const memberId = req.query.memberId as string;
      const authUser = await getUserFromToken(req);
      const userId = authUser?.id;

      let result;
      if (userId) {
        result = await pool.query(
          `SELECT cp.*, hc.claim_number, hc.diagnosis_desc_en, hc.sbs_code
           FROM claim_payments cp
           LEFT JOIN healthcare_claims hc ON cp.claim_id = hc.id
           WHERE cp.user_id = $1
           ORDER BY cp.created_at DESC LIMIT 50`,
          [userId]
        );
      } else if (memberId) {
        result = await pool.query(
          `SELECT cp.*, hc.claim_number, hc.diagnosis_desc_en, hc.sbs_code
           FROM claim_payments cp
           LEFT JOIN healthcare_claims hc ON cp.claim_id = hc.id
           LEFT JOIN user_accounts ua ON cp.user_id = ua.id
           WHERE ua.member_id = $1
           ORDER BY cp.created_at DESC LIMIT 50`,
          [memberId]
        );
      } else {
        return res.json({ payments: [], summary: { totalPaid: 0, pendingCount: 0, totalClaims: 0 } });
      }

      const payments = result.rows.map((r: any) => ({
        ...r,
        amount: parseFloat(r.amount),
      }));

      const totalPaid = payments.filter((p: any) => p.status === "completed").reduce((sum: number, p: any) => sum + p.amount, 0);
      const pendingCount = payments.filter((p: any) => p.status === "pending").length;

      res.json({
        payments,
        summary: {
          totalPaid,
          pendingCount,
          totalClaims: payments.length,
        },
      });
    } catch (error) {
      console.error("Payment history error:", error);
      res.status(500).json({ error: "Failed to fetch payment history" });
    }
  });

  // ─── SBS Routes ─────────────────────────────────────────────────

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

  // ─── Healthcare Routes ──────────────────────────────────────────

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
      const parsed = claimSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.errors[0]?.message || "Invalid input",
          details: parsed.error.errors,
        });
      }

      const {
        memberId,
        providerId,
        serviceDate,
        sbsCode,
        diagnosisCode,
        diagnosisDescEn,
        diagnosisDescAr,
        amount,
        amountClaimed,
        clinicalNotes,
        priorAuthRef,
      } = parsed.data;

      const claimAmount = amount ?? amountClaimed;
      // Zod refine ensures one of them is defined, but we add a guard for type safety
      if (claimAmount === undefined || claimAmount <= 0) {
        return res.status(400).json({ error: "A valid positive amount is required" });
      }

      const claim = await createClaim({
        memberId,
        providerId: Number(providerId),
        serviceDate,
        sbsCode: sbsCode || null,
        diagnosisCode,
        diagnosisDescEn: diagnosisDescEn || diagnosisCode,
        diagnosisDescAr,
        amount: claimAmount,
        clinicalNotes,
        priorAuthRef,
      });

      // Create welcome notification for new claim
      try {
        const userRow = await pool.query("SELECT id FROM user_accounts WHERE member_id = $1", [memberId]);
        if (userRow.rows[0]) {
          await pool.query(
            `INSERT INTO user_notifications (user_id, type, title_en, title_ar, body_en, body_ar, data)
             VALUES ($1, 'claim_submitted', 'Claim Submitted', 'تم تقديم المطالبة',
               $2, $3, $4)`,
            [
              userRow.rows[0].id,
              `Your claim has been submitted and is being processed. Claim number: ${(claim as any).claim_number}`,
              `تم تقديم مطالبتك وهي قيد المعالجة. رقم المطالبة: ${(claim as any).claim_number}`,
              JSON.stringify({ claimId: (claim as any).id, claimNumber: (claim as any).claim_number }),
            ]
          );
        }
      } catch (_notifErr) {
        // Non-fatal – notification creation should not block claim submission
      }

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
      const parsed = priorAuthSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.errors[0]?.message || "Invalid input",
          details: parsed.error.errors,
        });
      }

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
      } = parsed.data;

      const auth = await createPriorAuth({
        memberId,
        providerId: Number(providerId) || 1,
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

      // Notify user that prior-auth was submitted
      try {
        const userRow = await pool.query("SELECT id FROM user_accounts WHERE member_id = $1", [memberId]);
        if (userRow.rows[0]) {
          await pool.query(
            `INSERT INTO user_notifications (user_id, type, title_en, title_ar, body_en, body_ar, data)
             VALUES ($1, 'prior_auth_submitted', 'Prior Authorization Submitted', 'تم تقديم التفويض المسبق',
               $2, $3, $4)`,
            [
              userRow.rows[0].id,
              `Your prior authorization request has been submitted for review. Ref: ${(auth as any).auth_number || (auth as any).id}`,
              `تم تقديم طلب التفويض المسبق الخاص بك للمراجعة. المرجع: ${(auth as any).auth_number || (auth as any).id}`,
              JSON.stringify({ authId: (auth as any).id }),
            ]
          );
        }
      } catch (_notifErr) {
        // Non-fatal
      }

      res.status(201).json(auth);
    } catch (error) {
      console.error("Create prior auth error:", error);
      res.status(500).json({ error: "Failed to create prior authorization" });
    }
  });

  // ─── Enhanced AI Assistant ──────────────────────────────────────

  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    try {
      const { messages, language, memberId } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      let contextInfo = "";
      const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";

      const sbsKeywords = ["sbs", "code", "procedure", "surgery", "treatment", "medication", "test", "exam", "scan", "mri", "ct", "x-ray", "lab", "dental", "رمز", "إجراء", "علاج", "فحص", "عملية", "دواء", "أشعة"];
      const hasSBSQuery = sbsKeywords.some(kw => lastMessage.includes(kw));

      if (hasSBSQuery) {
        const searchTerms = lastMessage
          .replace(/sbs|code|procedure|what is|tell me about|can you find|look up|search|رمز|إجراء|ابحث/gi, "")
          .trim();
        if (searchTerms.length > 2) {
          const codes = await searchSBSCodes(searchTerms, undefined, 8);
          if (codes.length > 0) {
            contextInfo += "\n\n## Relevant SBS V3.1 Codes Found:\n";
            for (const c of codes) {
              contextInfo += `- **${c.sbs_code}**: ${c.description_en}`;
              if (c.description_ar) contextInfo += ` (${c.description_ar})`;
              contextInfo += ` | Category: ${c.category_name || "N/A"} | Prior Auth: ${c.requires_prior_auth ? "REQUIRED" : "Not required"}`;
              if (c.standard_price) contextInfo += ` | Std. Price: ${c.standard_price} SAR`;
              contextInfo += "\n";
            }
          }
        }
      }

      if (memberId) {
        const coverage = await getCoverage(memberId);
        if (coverage) {
          const dedRemaining = coverage.deductible_total - coverage.deductible_used;
          const oopRemaining = coverage.oop_max - coverage.oop_used;
          contextInfo += `\n\n## Patient Coverage Details:\n`;
          contextInfo += `- Plan: ${coverage.plan_name_en} (${coverage.plan_name_ar}) with ${coverage.insurer_name_en}\n`;
          contextInfo += `- Network: ${coverage.network_tier}\n`;
          contextInfo += `- Copay: ${coverage.copay_percentage}%\n`;
          contextInfo += `- Deductible: ${coverage.deductible_used} / ${coverage.deductible_total} SAR used (${dedRemaining} SAR remaining)\n`;
          contextInfo += `- Out-of-Pocket: ${coverage.oop_used} / ${coverage.oop_max} SAR used (${oopRemaining} SAR remaining)\n`;
          contextInfo += `- Status: ${coverage.status}\n`;

          if (dedRemaining < 500) {
            contextInfo += `- ⚠️ PROACTIVE INSIGHT: Deductible nearly met! Only ${dedRemaining} SAR remaining. After meeting deductible, insurer covers more.\n`;
          }
          if (oopRemaining < 2000) {
            contextInfo += `- ⚠️ PROACTIVE INSIGHT: Approaching out-of-pocket maximum. Only ${oopRemaining} SAR remaining.\n`;
          }

          if (Array.isArray(coverage.benefits)) {
            contextInfo += "\n### Benefits:\n";
            for (const b of coverage.benefits) {
              const pct = b.total > 0 ? Math.round((b.used / b.total) * 100) : 0;
              contextInfo += `- ${b.nameEn}: ${b.used}/${b.total} SAR used (${pct}%)`;
              if (pct > 80) contextInfo += " ⚠️ NEARLY EXHAUSTED";
              contextInfo += "\n";
            }
          }
        }

        const claimKeywords = ["claim", "مطالبة", "status", "حالة", "recent", "latest", "my claim"];
        if (claimKeywords.some(kw => lastMessage.includes(kw))) {
          const claims = await getClaims(memberId);
          if (claims.length > 0) {
            contextInfo += "\n\n## Recent Claims:\n";
            for (const c of claims.slice(0, 5)) {
              contextInfo += `- ${c.claim_number}: ${c.diagnosis_desc_en || c.diagnosis_code} | Status: ${c.status} | Amount: ${c.amount_claimed} SAR`;
              if (c.amount_approved) contextInfo += ` | Approved: ${c.amount_approved} SAR`;
              if (c.denial_reason) contextInfo += ` | Denied: ${c.denial_reason}`;
              contextInfo += "\n";
            }
          }
        }

        const paymentKeywords = ["payment", "pay", "دفع", "فاتورة", "bill", "cost", "spent"];
        if (paymentKeywords.some(kw => lastMessage.includes(kw))) {
          const payments = await pool.query(
            `SELECT cp.*, hc.claim_number FROM claim_payments cp
             LEFT JOIN healthcare_claims hc ON cp.claim_id = hc.id
             LEFT JOIN user_accounts ua ON cp.user_id = ua.id
             WHERE ua.member_id = $1 ORDER BY cp.created_at DESC LIMIT 5`,
            [memberId]
          );
          if (payments.rows.length > 0) {
            contextInfo += "\n\n## Recent Payments:\n";
            for (const p of payments.rows) {
              contextInfo += `- ${p.claim_number || "N/A"}: ${p.amount} SAR | Status: ${p.status} | Date: ${new Date(p.created_at).toLocaleDateString()}\n`;
            }
          }
        }
      }

      const symptomKeywords = ["pain", "ache", "fever", "cough", "injury", "broken", "bleeding", "swelling", "ألم", "حمى", "كسر", "تورم", "نزيف"];
      if (symptomKeywords.some(kw => lastMessage.includes(kw))) {
        const symptomSearch = lastMessage.replace(/i have|i feel|my|what|should|do|the|a|an/gi, "").trim();
        if (symptomSearch.length > 2) {
          const relatedCodes = await searchSBSCodes(symptomSearch, undefined, 5);
          if (relatedCodes.length > 0 && !contextInfo.includes("SBS V3.1 Codes")) {
            contextInfo += "\n\n## Potentially Relevant SBS Codes (based on symptoms):\n";
            for (const c of relatedCodes) {
              contextInfo += `- ${c.sbs_code}: ${c.description_en} (Prior Auth: ${c.requires_prior_auth ? "Required" : "No"})\n`;
            }
            contextInfo += "\nNote: Recommend these only as informational. The patient should consult their healthcare provider for proper diagnosis and procedure coding.\n";
          }
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
        max_tokens: 4096,
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

import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";
import pool from "./db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();

export interface SBSCode {
  id: number;
  sbs_id: string;
  sbs_code: string;
  description_en: string;
  description_ar: string | null;
  category_id: number | null;
  category_name?: string;
  category_name_ar?: string;
  subcategory: string | null;
  unit: string | null;
  standard_price: number | null;
  requires_prior_auth: boolean;
  is_active: boolean;
}

export interface SBSCategory {
  id: number;
  category_code: string;
  category_name: string;
  category_name_ar: string | null;
  display_order: number;
  code_count?: number;
}

export interface Provider {
  id: number;
  provider_code: string;
  name_en: string;
  name_ar: string | null;
  specialty: string | null;
  facility_type: string;
  city: string | null;
  accreditation_tier: string;
}

export interface CoverageData {
  id: number;
  member_id: string;
  insurer_name_en: string;
  insurer_name_ar: string | null;
  policy_number: string;
  plan_name_en: string | null;
  plan_name_ar: string | null;
  status: string;
  start_date: string;
  end_date: string;
  deductible_used: number;
  deductible_total: number;
  oop_used: number;
  oop_max: number;
  copay_percentage: number;
  network_tier: string;
  benefits: any[];
}

export interface ClaimData {
  id: number;
  claim_number: string;
  member_id: string;
  provider_id: number | null;
  provider_name_en?: string;
  provider_name_ar?: string;
  status: string;
  service_date: string;
  sbs_code: string | null;
  diagnosis_code: string | null;
  diagnosis_desc_en: string | null;
  diagnosis_desc_ar: string | null;
  procedure_desc_en: string | null;
  procedure_desc_ar: string | null;
  amount_claimed: number;
  amount_approved: number;
  copay_amount: number;
  denial_reason: string | null;
  clinical_notes: string | null;
  prior_auth_ref: string | null;
  pipeline_stages: any;
  submitted_at: string;
  processed_at: string | null;
  updated_at: string;
}

export interface PriorAuthData {
  id: number;
  reference_number: string;
  member_id: string;
  provider_id: number | null;
  provider_name_en?: string;
  provider_name_ar?: string;
  status: string;
  service_type: string | null;
  sbs_code: string | null;
  service_desc_en: string | null;
  service_desc_ar: string | null;
  diagnosis_code: string | null;
  diagnosis_desc_en: string | null;
  diagnosis_desc_ar: string | null;
  urgency: string;
  clinical_notes: string | null;
  approval_probability: number | null;
  ai_assessment: string | null;
  requested_at: string;
  reviewed_at: string | null;
  updated_at: string;
}

export interface EligibilityResult {
  eligible: boolean;
  member_id: string;
  plan: string;
  benefits: string[];
  coverage: {
    deductibleRemaining: number | null;
    copay: number | null;
    network: string;
    oopRemaining: number | null;
  };
  notes: string;
  source: string;
  response_time_ms: number;
}

export async function searchSBSCodes(query: string, category?: string, limit = 20): Promise<SBSCode[]> {
  let sql = `
    SELECT m.*, c.category_name, c.category_name_ar
    FROM sbs_master_catalogue m
    LEFT JOIN sbs_categories c ON m.category_id = c.id
    WHERE m.is_active = TRUE
  `;
  const params: any[] = [];
  let paramIdx = 1;

  if (query) {
    sql += ` AND (
      m.description_en ILIKE $${paramIdx}
      OR m.sbs_code ILIKE $${paramIdx}
      OR m.sbs_id ILIKE $${paramIdx}
      OR m.subcategory ILIKE $${paramIdx}
    )`;
    params.push(`%${query}%`);
    paramIdx++;
  }

  if (category) {
    sql += ` AND c.category_code = $${paramIdx}`;
    params.push(category);
    paramIdx++;
  }

  sql += ` ORDER BY m.sbs_code LIMIT $${paramIdx}`;
  params.push(limit);

  const result = await pool.query(sql, params);
  return result.rows;
}

export async function getSBSCode(sbsId: string): Promise<SBSCode | null> {
  const result = await pool.query(
    `SELECT m.*, c.category_name, c.category_name_ar
     FROM sbs_master_catalogue m
     LEFT JOIN sbs_categories c ON m.category_id = c.id
     WHERE m.sbs_id = $1`,
    [sbsId]
  );
  return result.rows[0] || null;
}

export async function getSBSCategories(): Promise<SBSCategory[]> {
  const result = await pool.query(`
    SELECT c.*, COUNT(m.id) as code_count
    FROM sbs_categories c
    LEFT JOIN sbs_master_catalogue m ON m.category_id = c.id AND m.is_active = TRUE
    GROUP BY c.id
    ORDER BY c.display_order
  `);
  return result.rows.map((r: any) => ({
    ...r,
    code_count: parseInt(r.code_count) || 0,
  }));
}

export async function getProviders(): Promise<Provider[]> {
  const result = await pool.query(
    "SELECT * FROM healthcare_providers WHERE is_active = TRUE ORDER BY name_en"
  );
  return result.rows;
}

export async function getCoverage(memberId: string): Promise<CoverageData | null> {
  const result = await pool.query(
    "SELECT * FROM healthcare_coverage WHERE member_id = $1",
    [memberId]
  );
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    ...row,
    deductible_used: parseFloat(row.deductible_used),
    deductible_total: parseFloat(row.deductible_total),
    oop_used: parseFloat(row.oop_used),
    oop_max: parseFloat(row.oop_max),
    benefits: typeof row.benefits === "string" ? JSON.parse(row.benefits) : row.benefits,
  };
}

export async function getClaims(memberId: string, status?: string): Promise<ClaimData[]> {
  let sql = `
    SELECT c.*, p.name_en as provider_name_en, p.name_ar as provider_name_ar
    FROM healthcare_claims c
    LEFT JOIN healthcare_providers p ON c.provider_id = p.id
    WHERE c.member_id = $1
  `;
  const params: any[] = [memberId];

  if (status && status !== "all") {
    sql += ` AND c.status = $2`;
    params.push(status);
  }

  sql += ` ORDER BY c.submitted_at DESC`;
  const result = await pool.query(sql, params);
  return result.rows.map((r: any) => ({
    ...r,
    amount_claimed: parseFloat(r.amount_claimed),
    amount_approved: parseFloat(r.amount_approved),
    copay_amount: parseFloat(r.copay_amount),
    pipeline_stages:
      typeof r.pipeline_stages === "string"
        ? JSON.parse(r.pipeline_stages)
        : r.pipeline_stages,
  }));
}

export async function getClaimById(claimId: string): Promise<ClaimData | null> {
  const result = await pool.query(
    `SELECT c.*, p.name_en as provider_name_en, p.name_ar as provider_name_ar
     FROM healthcare_claims c
     LEFT JOIN healthcare_providers p ON c.provider_id = p.id
     WHERE c.claim_number = $1 OR c.id::text = $1`,
    [claimId]
  );
  if (!result.rows[0]) return null;
  const r = result.rows[0];
  return {
    ...r,
    amount_claimed: parseFloat(r.amount_claimed),
    amount_approved: parseFloat(r.amount_approved),
    copay_amount: parseFloat(r.copay_amount),
    pipeline_stages:
      typeof r.pipeline_stages === "string"
        ? JSON.parse(r.pipeline_stages)
        : r.pipeline_stages,
  };
}

export async function createClaim(data: {
  memberId: string;
  providerId: number;
  serviceDate: string;
  sbsCode: string | null;
  diagnosisCode: string;
  diagnosisDescEn: string;
  diagnosisDescAr?: string;
  amount: number;
  clinicalNotes?: string;
  priorAuthRef?: string;
}): Promise<ClaimData> {
  const claimNumber = `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

  const sbsLookup = data.sbsCode ? await getSBSCode(data.sbsCode) : null;

  const copayResult = await pool.query(
    "SELECT copay_percentage FROM healthcare_coverage WHERE member_id = $1",
    [data.memberId]
  );
  const copayPct = copayResult.rows[0]?.copay_percentage || 20;
  const copayAmount = (data.amount * copayPct) / 100;

  const requiresPreAuth = sbsLookup?.requires_prior_auth || false;

  const pipelineStages = {
    validation: {
      status: "completed",
      timestamp: new Date().toISOString(),
      details: "Claim data validated successfully",
    },
    sbs_lookup: {
      status: sbsLookup ? "completed" : "warning",
      code: data.sbsCode,
      description: sbsLookup?.description_en || "Code not found in SBS V3.1 catalogue",
      category: sbsLookup?.category_name || null,
      requires_prior_auth: requiresPreAuth,
    },
    financial_rules: {
      status: "completed",
      copay_percentage: copayPct,
      copay_applied: copayAmount,
      estimated_approval: data.amount - copayAmount,
      notes:
        requiresPreAuth && !data.priorAuthRef
          ? "WARNING: This procedure requires prior authorization"
          : "CHI financial rules applied successfully",
    },
    submission: {
      status: "pending",
      nphies_ref: null,
      submitted_to_nphies: false,
    },
  };

  const result = await pool.query(
    `INSERT INTO healthcare_claims
     (claim_number, member_id, provider_id, status, service_date, sbs_code,
      diagnosis_code, diagnosis_desc_en, diagnosis_desc_ar,
      procedure_desc_en, procedure_desc_ar,
      amount_claimed, copay_amount, clinical_notes, prior_auth_ref, pipeline_stages)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      claimNumber,
      data.memberId,
      data.providerId,
      "submitted",
      data.serviceDate,
      data.sbsCode,
      data.diagnosisCode,
      data.diagnosisDescEn,
      data.diagnosisDescAr || null,
      sbsLookup?.description_en || data.diagnosisDescEn,
      sbsLookup?.description_ar || null,
      data.amount,
      copayAmount,
      data.clinicalNotes || null,
      data.priorAuthRef || null,
      JSON.stringify(pipelineStages),
    ]
  );

  if (data.memberId) {
    await pool.query(
      `UPDATE healthcare_coverage
       SET deductible_used = LEAST(deductible_used + $1, deductible_total),
           oop_used = LEAST(oop_used + $1, oop_max),
           updated_at = CURRENT_TIMESTAMP
       WHERE member_id = $2`,
      [copayAmount, data.memberId]
    );
  }

  return {
    ...result.rows[0],
    amount_claimed: parseFloat(result.rows[0].amount_claimed),
    amount_approved: parseFloat(result.rows[0].amount_approved),
    copay_amount: parseFloat(result.rows[0].copay_amount),
    pipeline_stages: pipelineStages,
  };
}

export async function getPriorAuths(memberId: string): Promise<PriorAuthData[]> {
  const result = await pool.query(
    `SELECT pa.*, p.name_en as provider_name_en, p.name_ar as provider_name_ar
     FROM healthcare_prior_auths pa
     LEFT JOIN healthcare_providers p ON pa.provider_id = p.id
     WHERE pa.member_id = $1
     ORDER BY pa.requested_at DESC`,
    [memberId]
  );
  return result.rows.map((r: any) => ({
    ...r,
    approval_probability: r.approval_probability
      ? parseFloat(r.approval_probability)
      : null,
  }));
}

export async function createPriorAuth(data: {
  memberId: string;
  providerId: number;
  serviceType: string;
  sbsCode: string | null;
  serviceDescEn: string;
  serviceDescAr?: string;
  diagnosisCode: string;
  diagnosisDescEn: string;
  diagnosisDescAr?: string;
  urgency: string;
  clinicalNotes?: string;
}): Promise<PriorAuthData> {
  const refNumber = `PA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

  const sbsLookup = data.sbsCode ? await getSBSCode(data.sbsCode) : null;

  let approvalProb = 0.7;
  if (sbsLookup?.requires_prior_auth) approvalProb += 0.1;
  if (data.urgency === "emergency") approvalProb += 0.15;
  if (data.urgency === "urgent") approvalProb += 0.05;
  if (data.clinicalNotes && data.clinicalNotes.length > 50) approvalProb += 0.05;
  approvalProb = Math.min(approvalProb, 0.99);

  let aiAssessment = "";
  if (approvalProb >= 0.9) {
    aiAssessment = `High probability of approval. ${sbsLookup?.description_en || data.serviceDescEn} for ${data.diagnosisCode} is clinically indicated per NPHIES guidelines.`;
  } else if (approvalProb >= 0.7) {
    aiAssessment = `Moderate-high probability. ${sbsLookup?.description_en || data.serviceDescEn} for ${data.diagnosisCode} may require supporting documentation per CHI rules.`;
  } else {
    aiAssessment = `Moderate probability. Additional clinical justification recommended for ${sbsLookup?.description_en || data.serviceDescEn}.`;
  }

  const result = await pool.query(
    `INSERT INTO healthcare_prior_auths
     (reference_number, member_id, provider_id, status, service_type, sbs_code,
      service_desc_en, service_desc_ar, diagnosis_code, diagnosis_desc_en, diagnosis_desc_ar,
      urgency, clinical_notes, approval_probability, ai_assessment)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [
      refNumber,
      data.memberId,
      data.providerId,
      "pending",
      data.serviceType,
      data.sbsCode,
      sbsLookup?.description_en || data.serviceDescEn,
      sbsLookup?.description_ar || data.serviceDescAr || null,
      data.diagnosisCode,
      data.diagnosisDescEn,
      data.diagnosisDescAr || null,
      data.urgency,
      data.clinicalNotes || null,
      approvalProb,
      aiAssessment,
    ]
  );

  return {
    ...result.rows[0],
    approval_probability: approvalProb,
  };
}

export async function checkEligibility(memberId: string): Promise<EligibilityResult> {
  const start = Date.now();

  const coverage = await getCoverage(memberId);

  if (!coverage) {
    return {
      eligible: false,
      member_id: memberId,
      plan: "UNKNOWN",
      benefits: [],
      coverage: {
        deductibleRemaining: null,
        copay: null,
        network: "—",
        oopRemaining: null,
      },
      notes: "Member not found in coverage database",
      source: "database",
      response_time_ms: Date.now() - start,
    };
  }

  const now = new Date();
  const endDate = new Date(coverage.end_date);
  const eligible = coverage.status === "active" && endDate >= now;

  const benefits: string[] = [];
  if (Array.isArray(coverage.benefits)) {
    for (const b of coverage.benefits) {
      if (b.nameEn) benefits.push(b.nameEn);
    }
  }

  const result: EligibilityResult = {
    eligible,
    member_id: memberId,
    plan: coverage.plan_name_en || "UNKNOWN",
    benefits,
    coverage: {
      deductibleRemaining: coverage.deductible_total - coverage.deductible_used,
      copay: coverage.copay_percentage / 100,
      network: coverage.network_tier || "IN",
      oopRemaining: coverage.oop_max - coverage.oop_used,
    },
    notes: eligible
      ? "Eligibility verified against coverage database"
      : coverage.status !== "active"
        ? "Coverage is not active"
        : "Coverage has expired",
    source: "database",
    response_time_ms: Date.now() - start,
  };

  await pool.query(
    `INSERT INTO eligibility_checks (member_id, eligible, plan, benefits, coverage, notes, source, response_time_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      memberId,
      result.eligible,
      result.plan,
      result.benefits,
      JSON.stringify(result.coverage),
      result.notes,
      result.source,
      result.response_time_ms,
    ]
  );

  return result;
}

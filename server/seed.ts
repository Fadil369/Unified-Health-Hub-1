import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedSBSCatalogue() {
  const client = await pool.connect();
  try {
    const dataPath = path.resolve(__dirname, "sbs_catalogue.json");
    const raw = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(raw);
    const catalogue: any[] = data.catalogue;

    const validCodes = catalogue.filter((item: any) => {
      const id = item.sbs_id || "";
      return id.length <= 30 && /^\d/.test(id);
    });
    console.log(`Seeding ${validCodes.length} valid SBS codes (filtered from ${catalogue.length})...`);

    const catRows = await client.query("SELECT id, category_code FROM sbs_categories");
    const catMap = new Map<string, number>();
    for (const row of catRows.rows) {
      catMap.set(row.category_code, row.id);
    }

    const subcatToCat: Record<string, string> = {
      "Examination of skull": "01",
      "Cranial tap": "01",
      "Insertion of intracranial": "01",
      "brain": "01",
      "cranial": "01",
      "spinal": "01",
      "nerve": "01",
      "Endocrine": "02",
      "thyroid": "02",
      "pituitary": "02",
      "adrenal": "02",
      "Eye": "03",
      "orbit": "03",
      "retina": "03",
      "lens": "03",
      "cornea": "03",
      "Ear": "04",
      "mastoid": "04",
      "tympan": "04",
      "Nose": "05",
      "mouth": "05",
      "pharynx": "05",
      "sinus": "05",
      "palate": "05",
      "tongue": "05",
      "Dental": "06",
      "tooth": "06",
      "teeth": "06",
      "gingiv": "06",
      "pulp": "06",
      "Respiratory": "07",
      "lung": "07",
      "bronch": "07",
      "trache": "07",
      "laryn": "07",
      "Cardiovascular": "08",
      "heart": "08",
      "cardiac": "08",
      "coronary": "08",
      "vascular": "08",
      "artery": "08",
      "vein": "08",
      "Blood": "09",
      "spleen": "09",
      "lymph": "09",
      "Digestive": "10",
      "stomach": "10",
      "intestin": "10",
      "colon": "10",
      "liver": "10",
      "pancrea": "10",
      "oesophag": "10",
      "appendix": "10",
      "rectum": "10",
      "anus": "10",
      "gallbladder": "10",
      "Urinary": "11",
      "kidney": "11",
      "bladder": "11",
      "ureter": "11",
      "urethr": "11",
      "Male genital": "12",
      "prostat": "12",
      "testis": "12",
      "penis": "12",
      "scrotum": "12",
      "Female genital": "13",
      "uterus": "13",
      "ovary": "13",
      "vagina": "13",
      "cervix": "13",
      "fallopian": "13",
      "Musculoskeletal": "14",
      "bone": "14",
      "joint": "14",
      "fracture": "14",
      "tendon": "14",
      "muscle": "14",
      "spine": "14",
      "vertebr": "14",
      "hip": "14",
      "knee": "14",
      "shoulder": "14",
      "Dermat": "15",
      "skin": "15",
      "wound": "15",
      "burn": "15",
      "graft": "15",
      "Breast": "16",
      "mammary": "16",
      "Radiation": "17",
      "radiotherapy": "17",
      "brachytherapy": "17",
      "Non-invasive": "18",
      "cognitive": "18",
      "counselling": "18",
      "Imaging": "19",
      "X-ray": "19",
      "CT": "19",
      "MRI": "19",
      "ultrasound": "19",
      "fluoroscopy": "19",
      "scan": "19",
      "Laboratory": "21",
      "pathology": "21",
      "haematology": "21",
      "biochem": "21",
      "microbiol": "21",
      "Pharmacy": "22",
      "drug": "22",
      "medication": "22",
      "Obstetric": "23",
      "delivery": "23",
      "caesarean": "23",
      "prenatal": "23",
    };

    function guessCategory(subcat: string | null, desc: string): number | null {
      if (!subcat && !desc) return null;
      const text = ((subcat || "") + " " + (desc || "")).toLowerCase();
      for (const [keyword, catCode] of Object.entries(subcatToCat)) {
        if (text.includes(keyword.toLowerCase())) {
          return catMap.get(catCode) || null;
        }
      }
      return catMap.get("99") || null;
    }

    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < validCodes.length; i += batchSize) {
      const batch = validCodes.slice(i, i + batchSize);
      const values: any[] = [];
      const placeholders: string[] = [];

      batch.forEach((item, idx) => {
        const offset = idx * 8;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
        );
        const catId = guessCategory(item.subcategory, item.description_en);
        const needsPreAuth =
          item.description_en?.toLowerCase().includes("surgery") ||
          item.description_en?.toLowerCase().includes("implant") ||
          item.description_en?.toLowerCase().includes("transplant") ||
          item.description_en?.toLowerCase().includes("reconstruction") ||
          false;

        values.push(
          item.sbs_id,
          item.sbs_code,
          item.description_en || "Unknown",
          item.description_ar || null,
          catId,
          item.subcategory || null,
          item.unit || null,
          needsPreAuth
        );
      });

      await client.query(
        `INSERT INTO sbs_master_catalogue (sbs_id, sbs_code, description_en, description_ar, category_id, subcategory, unit, requires_prior_auth)
         VALUES ${placeholders.join(", ")}
         ON CONFLICT (sbs_id) DO NOTHING`,
        values
      );
      inserted += batch.length;
      if (inserted % 5000 === 0) console.log(`  Inserted ${inserted}...`);
    }
    console.log(`Seeded ${inserted} SBS codes.`);
  } finally {
    client.release();
  }
}

async function seedProviders() {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO healthcare_providers (provider_code, name_en, name_ar, specialty, facility_type, city, accreditation_tier) VALUES
      ('KFSH-RYD', 'King Faisal Specialist Hospital', 'مستشفى الملك فيصل التخصصي', 'Multi-specialty', 'hospital', 'Riyadh', 'A'),
      ('HABIB-RYD', 'Dr. Sulaiman Al Habib Hospital', 'مستشفى الدكتور سليمان الحبيب', 'Multi-specialty', 'hospital', 'Riyadh', 'A'),
      ('MOOSA-DHR', 'Al Moosa Specialist Hospital', 'مستشفى الموسى التخصصي', 'Multi-specialty', 'hospital', 'Al Ahsa', 'A'),
      ('HAMRA-JED', 'Al Hamra Clinics', 'عيادات الحمراء', 'Ophthalmology', 'clinic', 'Jeddah', 'B'),
      ('DAWAA-RYD', 'Al Dawaa Pharmacy', 'صيدلية الدواء', 'Pharmacy', 'pharmacy', 'Riyadh', 'B'),
      ('KFMC-RYD', 'King Fahad Medical City', 'مدينة الملك فهد الطبية', 'Multi-specialty', 'hospital', 'Riyadh', 'A'),
      ('NGH-JED', 'National Guard Hospital', 'مستشفى الحرس الوطني', 'Multi-specialty', 'hospital', 'Jeddah', 'A'),
      ('SAUDIA-RYD', 'Saudi German Hospital', 'المستشفى السعودي الألماني', 'Multi-specialty', 'hospital', 'Riyadh', 'A'),
      ('SOLIMAN-RYD', 'Soliman Fakeeh Hospital', 'مستشفى سليمان فقيه', 'Multi-specialty', 'hospital', 'Jeddah', 'A'),
      ('IMC-RYD', 'International Medical Center', 'المركز الطبي الدولي', 'Multi-specialty', 'hospital', 'Jeddah', 'A')
      ON CONFLICT (provider_code) DO NOTHING
    `);
    console.log("Seeded providers.");
  } finally {
    client.release();
  }
}

async function seedCoverage() {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO healthcare_coverage (member_id, insurer_name_en, insurer_name_ar, policy_number, plan_name_en, plan_name_ar, status, start_date, end_date, deductible_used, deductible_total, oop_used, oop_max, copay_percentage, network_tier, benefits) VALUES
      ('MEM-2024-001', 'Bupa Arabia', 'شركة بوبا للتأمين', 'POL-2024-78542', 'Gold Plan', 'الخطة الذهبية', 'active', '2024-01-01', '2025-12-31', 1200, 5000, 3500, 15000, 20, 'Tier 1',
       '[{"id":"ben-001","nameAr":"طبي","nameEn":"Medical","used":8500,"total":50000,"icon":"medkit"},{"id":"ben-002","nameAr":"أسنان","nameEn":"Dental","used":1200,"total":5000,"icon":"body"},{"id":"ben-003","nameAr":"بصريات","nameEn":"Vision","used":300,"total":2000,"icon":"eye"},{"id":"ben-004","nameAr":"صيدلة","nameEn":"Pharmacy","used":2100,"total":10000,"icon":"flask"}]')
      ON CONFLICT (member_id) DO NOTHING
    `);
    console.log("Seeded coverage.");
  } finally {
    client.release();
  }
}

async function seedSampleClaims() {
  const client = await pool.connect();
  try {
    const providers = await client.query("SELECT id, provider_code FROM healthcare_providers");
    const provMap = new Map<string, number>();
    for (const r of providers.rows) provMap.set(r.provider_code, r.id);

    const kfsh = provMap.get("KFSH-RYD") || 1;
    const hamra = provMap.get("HAMRA-JED") || 4;
    const dawaa = provMap.get("DAWAA-RYD") || 5;
    const habib = provMap.get("HABIB-RYD") || 2;
    const moosa = provMap.get("MOOSA-DHR") || 3;

    await client.query(`
      INSERT INTO healthcare_claims (claim_number, member_id, provider_id, status, service_date, sbs_code, diagnosis_code, diagnosis_desc_en, diagnosis_desc_ar, procedure_desc_en, procedure_desc_ar, amount_claimed, amount_approved, copay_amount, pipeline_stages) VALUES
      ('CLM-2024-0891', 'MEM-2024-001', $1, 'approved', '2024-10-15', '90761-00-00', 'Z00.0', 'Comprehensive Medical Exam', 'فحص طبي شامل', 'General health examination', 'فحص صحة عام', 2500, 2000, 500, '{"validation":{"status":"completed","timestamp":"2024-10-16T08:00:00Z"},"sbs_lookup":{"status":"completed","code":"90761-00-00","description":"Comprehensive examination"},"financial_rules":{"status":"completed","copay_applied":500},"submission":{"status":"completed","nphies_ref":"NPH-2024-89012"}}'),
      ('CLM-2024-0923', 'MEM-2024-001', $2, 'processing', '2024-11-02', '42503-00-00', 'H52.1', 'Ophthalmology Consultation', 'استشارة طب عيون', 'Eye examination', 'فحص عيون', 800, 0, 0, '{"validation":{"status":"completed","timestamp":"2024-11-03T09:00:00Z"},"sbs_lookup":{"status":"completed","code":"42503-00-00","description":"Eye examination"},"financial_rules":{"status":"processing"},"submission":{"status":"pending"}}'),
      ('CLM-2024-0845', 'MEM-2024-001', $3, 'rejected', '2024-09-20', '96199-00-00', 'J06.9', 'Prescription Medications', 'أدوية موصوفة', 'Dispensing of medications', 'صرف أدوية', 450, 0, 0, '{"validation":{"status":"completed","timestamp":"2024-09-21T10:00:00Z"},"sbs_lookup":{"status":"completed","code":"96199-00-00","description":"Dispensing"},"financial_rules":{"status":"completed","denial_flag":true},"submission":{"status":"denied","reason":"Medication not on formulary"}}'),
      ('CLM-2024-0967', 'MEM-2024-001', $4, 'submitted', '2024-11-10', '73050-00-00', 'R79.9', 'Laboratory Tests', 'فحص مخبري', 'Pathology investigation', 'فحص مرضي', 350, 0, 0, '{"validation":{"status":"completed","timestamp":"2024-11-11T07:30:00Z"},"sbs_lookup":{"status":"completed","code":"73050-00-00","description":"Pathology investigation"},"financial_rules":{"status":"pending"},"submission":{"status":"pending"}}'),
      ('CLM-2024-0780', 'MEM-2024-001', $5, 'approved', '2024-08-05', '97213-00-00', 'K02.1', 'Dental Consultation', 'استشارة أسنان', 'Dental restoration', 'ترميم أسنان', 1200, 960, 240, '{"validation":{"status":"completed","timestamp":"2024-08-06T11:00:00Z"},"sbs_lookup":{"status":"completed","code":"97213-00-00","description":"Dental restoration"},"financial_rules":{"status":"completed","copay_applied":240},"submission":{"status":"completed","nphies_ref":"NPH-2024-78901"}}')
      ON CONFLICT (claim_number) DO NOTHING
    `, [kfsh, hamra, dawaa, habib, moosa]);
    console.log("Seeded sample claims.");
  } finally {
    client.release();
  }
}

async function seedSamplePriorAuths() {
  const client = await pool.connect();
  try {
    const providers = await client.query("SELECT id, provider_code FROM healthcare_providers");
    const provMap = new Map<string, number>();
    for (const r of providers.rows) provMap.set(r.provider_code, r.id);

    const kfsh = provMap.get("KFSH-RYD") || 1;
    const habib = provMap.get("HABIB-RYD") || 2;

    await client.query(`
      INSERT INTO healthcare_prior_auths (reference_number, member_id, provider_id, status, service_type, sbs_code, service_desc_en, service_desc_ar, diagnosis_code, diagnosis_desc_en, diagnosis_desc_ar, urgency, approval_probability, ai_assessment) VALUES
      ('PA-2024-0341', 'MEM-2024-001', $1, 'approved', 'procedure', '56001-00-00', 'MRI Scan', 'تصوير بالرنين المغناطيسي', 'M54.5', 'Low Back Pain', 'ألم أسفل الظهر', 'routine', 0.97, 'High probability of approval. MRI for M54.5 is clinically indicated per NPHIES guidelines.'),
      ('PA-2024-0389', 'MEM-2024-001', $2, 'in_review', 'procedure', '49518-00-00', 'Knee Surgery', 'جراحة الركبة', 'M17.1', 'Knee Osteoarthritis', 'تآكل مفصل الركبة', 'urgent', 0.82, 'Moderate-high probability. Knee replacement for M17.1 requires supporting imaging and conservative treatment documentation.')
      ON CONFLICT (reference_number) DO NOTHING
    `, [kfsh, habib]);
    console.log("Seeded sample prior auths.");
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await seedSBSCatalogue();
    await seedProviders();
    await seedCoverage();
    await seedSampleClaims();
    await seedSamplePriorAuths();
    console.log("All seeding complete!");
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

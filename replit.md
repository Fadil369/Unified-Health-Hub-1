# BrainSAIT Healthcare Insurance App

## Overview
A Saudi healthcare insurance mobile app built with Expo/React Native and Express backend, integrated with the SBS (Saudi Billing System) V3.1 catalogue containing 10,000+ real medical procedure codes.

## Architecture
- **Frontend**: Expo + React Native (file-based routing via expo-router)
- **Backend**: Express + TypeScript on port 5000
- **Database**: PostgreSQL (Replit-provisioned)
- **AI**: Anthropic Claude for the Basma AI Assistant
- **State Management**: React Query (@tanstack/react-query) + React Context

## Key Features
- Real SBS V3.1 catalogue with 10,441 CHI medical procedure codes across 24 categories
- Real eligibility verification against database coverage records
- Claim submission with SBS code lookup, financial rules (copay calculation), and pipeline stages
- Prior authorization with AI-powered approval probability assessment
- Bilingual support (Arabic/English)
- Basma AI assistant with SBS domain knowledge

## Database Schema
- `sbs_categories` — 24 SBS procedure categories
- `sbs_master_catalogue` — 10,441 SBS V3.1 codes with descriptions, pricing, prior-auth flags
- `healthcare_providers` — 10 Saudi hospital/clinic providers
- `healthcare_coverage` — Patient coverage records (member_id: MEM-2024-001)
- `healthcare_claims` — Claims with pipeline_stages JSONB
- `healthcare_prior_auths` — Prior authorization records
- `eligibility_checks` — Eligibility check audit log

## API Endpoints
- `GET /api/sbs/search?q=...&category=...&limit=...` — Search SBS codes
- `GET /api/sbs/categories` — List SBS categories
- `GET /api/sbs/code/:sbsId` — Get SBS code details
- `GET /api/providers` — List healthcare providers
- `GET /api/coverage/:memberId` — Get coverage & benefits
- `POST /api/eligibility/check` — Real eligibility verification
- `GET /api/claims?memberId=...&status=...` — List claims
- `POST /api/claims` — Submit new claim with SBS validation
- `GET /api/claims/:id` — Claim details with pipeline stages
- `GET /api/prior-auth?memberId=...` — List prior authorizations
- `POST /api/prior-auth` — Submit prior auth request
- `POST /api/ai/chat` — Basma AI assistant with SBS context

## Key Files
- `server/db.ts` — PostgreSQL connection pool
- `server/storage.ts` — All database query functions
- `server/routes.ts` — Express API routes
- `server/seed.ts` — Database seeder with SBS catalogue data
- `server/sbs_catalogue.json` — Raw SBS V3.1 catalogue (20,403 codes)
- `lib/query-client.ts` — React Query client with API helper
- `lib/mock-data.ts` — Type definitions only (no longer used for data)
- `contexts/AuthContext.tsx` — Auth with memberId (MEM-2024-001)

## Important Notes
- Default member ID: `MEM-2024-001`
- Coverage end date set to 2027-12-31 for demo purposes
- Frontend uses `apiRequest` helper for POST calls, default queryFn for GET
- Query keys use path format: `['/api/coverage', memberId]`
- SBS codes are VARCHAR(50), data filtered for valid codes starting with digits

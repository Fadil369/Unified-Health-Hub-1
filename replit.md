# BrainSAIT Healthcare Insurance App

## Overview
A Saudi healthcare insurance mobile app built with Expo/React Native and Express backend, integrated with the SBS (Saudi Billing System) V3.1 catalogue containing 10,000+ real medical procedure codes. Features GitHub OAuth authentication, Stripe payment processing, and an advanced bilingual AI assistant (Basma).

## Architecture
- **Frontend**: Expo + React Native (file-based routing via expo-router)
- **Backend**: Express + TypeScript on port 5000
- **Database**: PostgreSQL (Replit-provisioned)
- **AI**: Anthropic Claude for the Basma AI Assistant
- **Auth**: GitHub OAuth via Replit Connectors + email/password fallback
- **Payments**: Stripe via Replit Connectors (SAR currency, per-claim copay)
- **State Management**: React Query (@tanstack/react-query) + React Context

## Key Features
- Real SBS V3.1 catalogue with 10,441 CHI medical procedure codes across 24 categories
- GitHub OAuth authentication with auto-provisioned member accounts
- Email/password registration with profile editing
- Stripe payment integration for claim copay billing (20% copay)
- Real eligibility verification against database coverage records
- Claim submission with SBS code lookup, financial rules, and pipeline stages
- Prior authorization with AI-powered approval probability assessment
- Bilingual support (Arabic/English)
- Basma AI assistant with deep SBS domain knowledge, proactive insights, and multi-context awareness
- Payment history tracking in wallet and profile screens

## Database Schema
- `sbs_categories` — 24 SBS procedure categories
- `sbs_master_catalogue` — 10,441 SBS V3.1 codes with descriptions, pricing, prior-auth flags
- `healthcare_providers` — 10 Saudi hospital/clinic providers
- `healthcare_coverage` — Patient coverage records
- `healthcare_claims` — Claims with pipeline_stages JSONB
- `healthcare_prior_auths` — Prior authorization records
- `eligibility_checks` — Eligibility check audit log
- `user_accounts` — User accounts (GitHub OAuth, email/password, profile data, member_id)
- `user_sessions` — Session tokens with expiry
- `claim_payments` — Stripe payment records linked to claims

## API Endpoints

### Authentication
- `GET /api/auth/github` — GitHub OAuth login (via Replit Connectors)
- `POST /api/auth/register` — Email/password registration
- `POST /api/auth/login` — Email/password login
- `GET /api/auth/me` — Get current authenticated user
- `POST /api/auth/logout` — Invalidate session
- `PUT /api/auth/profile` — Update profile fields

### Payments
- `GET /api/payments/config` — Get Stripe publishable key
- `POST /api/payments/create-intent` — Create Stripe PaymentIntent for claim copay
- `POST /api/payments/confirm` — Confirm payment status
- `GET /api/payments/history` — Payment history with summary
- `POST /api/stripe/webhook` — Stripe webhook handler

### SBS & Healthcare
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
- `server/routes.ts` — Express API routes (auth, payments, SBS, healthcare, AI)
- `server/index.ts` — Express server setup with Stripe webhook, CORS, middleware
- `server/stripeClient.ts` — Stripe client via Replit Connectors
- `server/webhookHandlers.ts` — Stripe webhook processing
- `server/githubAuth.ts` — GitHub OAuth via Replit Connectors
- `server/seed.ts` — Database seeder with SBS catalogue data
- `lib/query-client.ts` — React Query client with API helper
- `contexts/AuthContext.tsx` — Auth context with GitHub OAuth, login, register, profile update

## Important Notes
- Auth tokens stored in AsyncStorage as `brainsait_auth_token`
- All auth API calls use `Authorization: Bearer <token>` header
- GitHub OAuth uses Replit Connectors proxy (no browser redirect needed)
- Stripe uses `getUncachableStripeClient()` pattern (never cache client)
- Stripe currency is SAR, amounts in halalas (× 100)
- Stripe webhook registered BEFORE express.json() middleware
- Coverage end date set to 2027-12-31 for demo
- New GitHub users auto-get `MEM-{year}-{random5}` member ID
- AI system prompt includes 24 SBS categories, NPHIES compliance, proactive insights
- AI max_tokens set to 4096
- Frontend uses `apiRequest` helper for POST calls, default queryFn for GET
- Query keys use path format: `['/api/coverage', memberId]`

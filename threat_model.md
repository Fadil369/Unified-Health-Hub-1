# Threat Model

## System overview
BrainSAIT is a healthcare insurance application with an Expo/React Native client and an Express + PostgreSQL backend. The production attack surface is the Express API under `/api`, the Stripe webhook, and the static web build served by the same process. The application handles regulated healthcare and payment data, so confidentiality and integrity of member records, claims, prior authorizations, eligibility results, sessions, and payment state are primary security goals.

## Deployment and scope assumptions
- The current repl is not deployed, but this scan evaluates code paths that would execute in production.
- In production, `NODE_ENV=production`.
- Replit provides TLS termination for deployed traffic.
- No deployment visibility is currently set, so public-internet reachability must be assumed for production-facing API routes.
- Mock, seed, and build-only paths are out of scope unless they are reachable from production request handling.

## Architecture and trust boundaries
- Client boundary: Expo mobile/web app sends JSON requests to the Express API and stores bearer session tokens locally.
- API boundary: `server/index.ts` applies CORS, in-memory rate limiting, JSON parsing, Stripe webhook raw-body handling, and error handling.
- Authentication boundary: `server/routes.ts` uses bearer tokens backed by `user_sessions` rows via `getUserFromToken()`.
- Data boundary: `server/storage.ts` and direct `pool.query()` calls access PostgreSQL tables containing claims, coverage, payments, sessions, and user accounts.
- Third-party boundary: Stripe and Anthropic integrations receive data from the backend; Stripe webhook input is attacker-controlled until signature validation succeeds. Replit Connector-backed GitHub calls are server-held integration credentials and must never be treated as proof of an end user's identity without a real user-specific OAuth round trip.

## Protected assets
- User account PII: email, phone, national ID, member ID, avatar, session tokens.
- Healthcare data: coverage, benefits, claims, prior authorizations, eligibility audit logs.
- Payment data: Stripe payment intent identifiers, claim payment history, claim payment state.
- Availability-sensitive endpoints: auth, AI chat, payments, healthcare search.

## In-scope vulnerability classes
- Broken authentication and session handling on production endpoints.
- Broken object-level authorization / insecure direct object reference across member-scoped data.
- Unauthorized state changes affecting claims, prior authorizations, or payments.
- Sensitive-data disclosure from API responses or AI context assembly.
- Injection issues on production-request paths.
- Payment workflow abuse where server trust in client input can change charge amount, ownership, or state.

## Out-of-scope areas for this scan
- `scripts/build.js`, Expo build output generation, and other local build tooling unless a production request can influence them.
- Mock/demo-only data helpers that are not reachable from the production server.
- Generic local-device compromise assumptions for mobile storage without a server-reachable exploit chain.

## Production-scope map
- Production: `server/index.ts`, `server/routes.ts`, `server/storage.ts`, `server/db.ts`, `server/stripeClient.ts`, `server/webhookHandlers.ts`, `server/githubAuth.ts`, client files that determine auth token handling and production API usage.
- Shared/context: `lib/query-client.ts`, `contexts/AuthContext.tsx`, `shared/schema.ts`.
- Dev-only: `scripts/`, seed/import helpers, non-request build artifacts.

## Scan anchors
1. Member-scoped healthcare routes must bind reads and writes to the authenticated user, not a caller-supplied `memberId`.
2. Claim and prior-authorization detail routes must require authentication and ownership checks.
3. Payment creation, confirmation, and history routes must authenticate the caller and validate claim ownership and server-side amounts.
4. AI endpoints must not accept arbitrary identifiers that expand private medical/payment context for other members.
5. Build-script findings from automated scanners should be ignored unless production reachability is shown.
6. Connector-backed third-party identities must not be repurposed as end-user authentication unless the code performs a true per-user OAuth flow with callback/state validation.

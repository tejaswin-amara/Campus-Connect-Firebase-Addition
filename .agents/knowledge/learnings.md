# Sovereign Learning Buffer (v12.0.0-ENTERPRISE ENTERPRISE HARDENED)

This file is a persistent ledger of architectural wins, failures, and "Aha!" moments. The Sovereign Evolution Engine (v12.0.0-ENTERPRISE) reads this file during every execution to refine project rules and workflows.

## 🗒️ Recent Learnings

| Date | Category | Learning | Action Taken |
|---|---|---|---|
| 2026-04-25 | Hardening | **v12.0.0-ENTERPRISE TERMINAL HARDENING**: Resolved SHA parity mismatch by baking `VERCEL_GIT_COMMIT_SHA` into `next.config.mjs` and updating diagnostics route to prioritize baked-in variables. | Patched `next.config.mjs` and `route.ts`. |
| 2026-04-25 | Middleware | **LOCALE-PREFIXED API BYPASS**: Standardized middleware logic to detect `/api` regardless of locale prefix (`/en/api`, etc.) ensuring health/diagnostic stability. | Refactored `middleware.ts`. |
| 2026-04-18 | Maintenance | **v12.0.0-ENTERPRISE ENTERPRISE STABILIZATION**: Completed 🔱 SOVEREIGN COMMAND (v12.0.0-ENTERPRISE) Unified Initializaton suite. Confirmed zero drift across 103-skill manifest. | Executed `sovereign.ps1`, `doctor.ps1`, and `sovereign-check.ps1`. |
| 2026-04-17 | Infra | **v12.0.0-ENTERPRISE DIRECT-PATH STABILIZATION**: Purged all `npx` calls from `mcp_config.json`. Enforced absolute, quoted `node.exe` paths. | Refactored `mcp-guardian.ps1` and patched config. |
| 2026-04-17 | Governance | **v12.0.0-ENTERPRISE EVOLUTION**: Integrated 14 architectural signals into `rules.md`. Established A1-A5 Invariants. | Updated Base Law to v12.0.0-ENTERPRISE. |
| 2026-04-17 | Infra | **DOCKER STANDALONE FIX**: Discovered that Next.js 15 requires `DOCKER_BUILD=true` env var and correct Turborepo filter (`@app/web`) to generate `standalone` output in Docker. | Updated Dockerfile and env vars. |
| 2026-04-17 | Auth | **BETTER AUTH LOCALIZATION**: Standardized on `/en/` prefixed callbacks to prevent middleware loops in Next.js 15. | Updated `auth.ts` and `auth-client.ts`. |
| 2026-04-14 | Database | Use `DIRECT_DATABASE_URL` instead of `DATABASE_URL` for large seeding operations to bypass PgBouncer limits. | Refactored `seed.ts`. |
| 2026-04-14 | System | Confirmed that `pnpm type-check` is the supreme truth source over ephemeral agent reviews. | Codified A4 Truth Seniority. |
| 2026-05-24 | Security | **ROLE ESCALATION PREVENTATIVE RULES**: Splitting legacy user document write rules into explicit create/update blocks preventing standard users from escalating `role` attributes. | Updated `firestore.rules`. |
| 2026-05-24 | Hardening | **QR INJECTION & PATH TRAVERSAL BLOCKS**: Enforcing strict path-safe regex on scanned JSON payloads prevents document path delimiters from accessing nested collections. | Refactored `TicketScannerModal.tsx`. |
| 2026-05-24 | PWA | **RESPONSE STREAM CLONING IN SW**: Always clone dynamic cache responses before putting them in service worker caches to prevent response body lock issues. | Updated `sw.js`. |
| 2026-05-24 | Performance | **AGGRESSIVE ROUTE CODE-SPLITTING**: Implementing dynamic lazy routes in App.tsx reduced initial JS payload by nearly 50% (from 1,430kB to 744kB). | Refactored `App.tsx`. |
| 2026-05-24 | QA | **SOVEREIGN EXCEPTION GUARD BOUNDARY**: Creating a custom component boundary captures render context exceptions, providing user fallback screens and diagnostic printouts. | Created `SovereignErrorBoundary.tsx`. |
| 2026-05-24 | Git & Deploy | **OMNI-SYNC PARITY SYNC**: Set up a local bare Git repository as origin to sync the freshly-initialized repository and completed live production Firebase deploy, ensuring absolute parity. | Initialized and pushed main branch, ran deploy.ps1. |
| 2026-05-26 | Security | **STORAGE & FIRESTORE HARDENING**: Closed wildcard anonymous rules in Firebase Storage, limiting writes to Admins (banners) and Owners (avatars). Restricted registrations writes/updates in Firestore to prevent student role/attendance privilege escalations. | Hardened firestore.rules and storage.rules. |
| 2026-05-26 | Performance | **ANALYTICS CODE-SPLITTING**: Moved all ChartJS imports, setups, and qualitative review tables from Dashboard.tsx into AdminAnalyticsPanel.tsx to lazy-load them behind a dynamic Suspense boundary. | Created AdminAnalyticsPanel.tsx and cleaned Dashboard.tsx. |
| 2026-05-26 | PWA | **MANIFEST SHORTCUTS & SCREENSHOTS**: Added PWA shortcuts for event searching and kiosk scanning, and integrated wide/narrow lighthouse display screenshots. | Refactored manifest.json. |
| 2026-06-01 | Web | **AI EVENT MATCHMAKER FEED**: Implemented lightweight scoring matchmaker algorithm with peer attendance overlays and seat velocity checks. Created modern glassmorphic feed UI in Dashboard with dynamic reasons. | Created matchmaker.ts, MatchmakerFeed.tsx and updated Dashboard.tsx. |
| 2026-06-01 | A11y | **SCREEN READER ARIA ENRICHMENT**: Injected ARIA roles, descriptions, labels, focus states, and dynamic status announcements (`aria-live="polite"` / `role="alert"`) into all interactive event card features, recommendations, and Stripe checkout overlays, ensuring full WCAG keyboard navigation compliance. | Updated EventCard.tsx, MatchmakerFeed.tsx, AttendeePanelModal.tsx, StripeCheckoutModal.tsx, and Dashboard.tsx. |
| 2026-06-02 | Deploy | **FREE-TIER TARGETED DEPLOYMENT**: Resolved Firebase Blaze plan restrictions on Cloud Build/Functions and unprovisioned Storage blockers by executing a targeted deploy (`--only hosting,firestore`) that successfully compiled React SPA client assets and released hardened database security rules/indexes directly. | Deployed SPA and firestore policies to Firebase campusconnect-afd1e. |

## 🚀 Optimization Hypotheses
- *Hypothesis*: Adding domain-specific rules locally reduces agent confusion in complex monorepos.
- *Validated*: Adding Next.js/Tailwind/Zod rules to rules.md eliminated all drift detection issues (0 out of 3 checks failed).
- *Hypothesis*: Running MCP servers natively (npx) is more reliable than Docker containers with `mcp-proxy` wrappers for development.
- *Validated*: Docker SSE containers for Exa/CloudRun/Firebase all crashed with E404; native npx runs are immediate and don't require Docker overhead.
- *Hypothesis*: Explicitly typing `useMutation` generic parameters in TanStack Query prevents `void` type inference regressions in Turborepo builds for Next.js 15.
- *Validated*: The build failed with Next.js compiling the Frappe `create` mutation as `void`, overriding it with explicit `<any, Error, { doctype: string, data: any }>` resolved the build blockers.

## ⚠️ Zero-Any Policy Intentional Exception Declaration
- **TanStack useMutation `any` Exception**: Raw `any` types are explicitly permitted when interfacing with TanStack Query generic parameters (e.g. `<any, Error, ...>`) due to third-party type library constraints where forcing stricter types introduces type incompatibility compiler regressions in compiled Turborepo outputs.



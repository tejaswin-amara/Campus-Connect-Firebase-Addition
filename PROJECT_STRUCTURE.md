# 📂 Project Structure

This document provides a detailed breakdown of the **CampusConnect** serverless codebase, organized by responsibility and layer.

## Project Root

| File / Directory | Purpose |
| :--- | :--- |
| `Dockerfile` | Hardened Nginx multi-stage build configuration |
| `docker-compose.yml` | Convenience local composition running the built React client |
| `firebase.json` | Global Firebase config specifying Hosting, Firestore, and Cloud Functions |
| `firestore.rules` | Hardened Firestore database transaction policies |
| `storage.rules` | Hardened Cloud Storage size & MIME filter policies |
| `run_app.ps1` / `stop_app.ps1` | Lifecycle convenience scripts to spin up Vite and Local Emulators |
| `deploy.ps1` | Production release orchestrator |
| `README.md` | Core overview, architecture, and developer onboarding guides |
| `PROJECT_STRUCTURE.md` | This directory map |
| `TECHNICAL_GUIDE.md` | Structural and algorithmic guide for developers |
| `.agents/` | Hardened system governance rules, workflows, and learning manifests |

---

## ⚛️ Frontend React SPA (`/frontend`)

The frontend contains the single-page application built via React 19, Vite 8, and Tailwind CSS v4.

*   `src/components/` — UI components and interactive overlays (e.g., ticket scanners, modal overlays).
*   `src/contexts/` — Global auth providers wrapping the client.
*   `src/hooks/` — Custom native UI and accessibility traps (modals, keyboard handling).
*   `src/layouts/` — Unified dashboard and admin grid layouts.
*   `src/lib/` — Firebase Client SDK connection wrapper.
*   `src/pages/` — Page modules (Student Dashboard, Admin Analytics, Ticket scanner Kiosks).
*   `src/types/` — Shared interfaces.
*   `vitest.config.ts` & `Happy DOM` — Automated UI testing infrastructure.

---

## ⚡ Cloud Functions (`/functions`)

The backend is composed of serverless trigger functions in the `functions/src/` folder.

*   `src/index.ts` — Houses production triggers:
    *   `onRegistrationCancelled` — Priority O(1) waitlist promotion transaction.
    *   `onEventPublished` — Automated rich announcements broadcasted to Discord.
    *   `onRegistrationCreated` — Real-time peer-to-peer assembly squad FCM notifications.
    *   `onRegistrationUpdated` — Post-event rating prompts 30 minutes after scan.
    *   `createStripeCheckoutSession` & `onStripePaymentSuccess` — Secure checkout and webhook processing.

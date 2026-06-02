# 📘 CampusConnect — Technical Guide

Welcome to the technical documentation for the CampusConnect application. This guide provides an in-depth look at the architecture, key algorithms, and implementation details of the serverless ecosystem.

## 1. Architecture Overview 🏗️

The application maps the classic Model-View-Controller (MVC) paradigm directly onto a serverless cloud infrastructure:

*   **View (Presentation Layer):** A high-performance single-page application built using React 19, Vite 8, TypeScript 6, and styled with Tailwind CSS v4.
*   **Controller (Routing & Triggers):** Handled client-side via `react-router-dom` and on the backend via Firebase Cloud Functions v2 (Node.js 20 microservices).
*   **Model & Service Layer (Business Logic):** Cloud Firestore NoSQL collections, guarded by atomic document-write security boundaries (`firestore.rules`) and processed asynchronously by Firestore Cloud triggers.
*   **Media & Assets Storage:** Google Cloud Storage bucket enforcing strict size limits and MIME validation.

---

## 2. Key Algorithms & Implementation Details 🔍

### 2.1 Asynchronous Waitlist Promotion Transaction
When a student cancels a registration, the O(1) waitlist promotion transaction handles seat allocation atomically to prevent race conditions:

1.  **Trigger:** An `onDocumentDeleted` hook fires on `registrations/{registrationId}`.
2.  **Validation:** If the cancelled registration had a status of `WAITLISTED`, execution terminates (no seats were freed). If `REGISTERED` or `ATTENDED`, the transactional loop starts.
3.  **Atomic Promotion:**
    *   Query the oldest waitlisted registration for the event using:
        ```typescript
        db.collection('registrations')
          .where('eventId', '==', eventId)
          .where('status', '==', 'WAITLISTED')
          .orderBy('registeredAt', 'asc')
          .limit(1)
        ```
    *   Promote the matching student by setting status to `REGISTERED`.
    *   Decrement the parent event's `waitlistCount` atomically.
    *   If no waitlist exists, decrement the active `registeredCount` instead.
4.  **FCM Dispatch:** Dispatches a push notification informing the student of their promotion.

### 2.2 Secure Payment Webhook Processing
To prevent client-side price tampering during event registration:

1.  **Intent Generation:** When a paid event is requested, `createStripeCheckoutSession` is called via HTTPS. It returns a secure Stripe hosted Checkout URL.
2.  **Verification webhook:** Stripe triggers `onStripePaymentSuccess` upon transaction completion.
3.  **Atomic Record Creation:** The Cloud Function verifies the webhook payload, registers the student as `PAID`, increments the event capacity, and creates the registration document. Standard user database writes are blocked from modifying `paymentStatus` directly by Firestore Security Rules.

### 2.3 PWA Caching and SW Stream Cloning
To ensure robust offline access on mobile devices and prevent memory lock regressions during dynamic caching:
*   The Service Worker intercepts network requests and stores them in cache caches.
*   **Response stream cloning is strictly enforced:** Cache entries are cloned (`response.clone()`) before putting them into service worker storage. This prevents body consumption exceptions in the browser.
*   **Recovery hooks:** When dynamic chunk import failures occur (typical after a new production deploy), the client catches the exception in `SovereignErrorBoundary` and triggers a single hard page reload to fetch the new production manifest.

---

## 3. Security Architecture 🛡️

### 3.1 Role Escalation Prevention
No client can escalate their privileges. Firestore Rules explicitly enforce role constraints:
```javascript
allow create: if isOwner(userId) && (
  !request.resource.data.keys().hasAll(['role']) || 
  request.resource.data.role == 'STUDENT' || 
  isAdmin()
);
```
Standard students can only set their role to `STUDENT` on creation. Only existing verified administrators (stored in `/admins/{adminId}`) or users with `role == 'ADMIN'` verified by active claims can update fields.

### 3.2 Path Traversal & Injection Safeguards
Path traversal vulnerabilities on scanned QR codes are blocked via strict string matching. Scanned registration paths must match absolute alpha-numeric patterns and avoid delimiter traversals before querying:
```javascript
allow write: if isAuthenticated() && 
              (resource.data.userId == request.auth.uid || isAdmin()) &&
              (request.resource.data.status != 'ATTENDED' || isAdmin() || resource.data.status == 'ATTENDED');
```
Students are physically blocked from altering their status to `ATTENDED` manually. Only authorized administrative scanning kiosks can scan QR credentials and update state.

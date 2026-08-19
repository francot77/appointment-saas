# FezTime Commercialization Roadmap

This roadmap moves the current MVP toward a paid, trustworthy appointment SaaS. Each phase is a bounded work unit with explicit exit evidence; unfinished work remains visible instead of being hidden behind visual polish.

## Current Baseline

FezTime has public booking, authenticated business management, MongoDB persistence, NextAuth, and Mercado Pago integration. It is not launch-ready: booking is not atomic, automated tests are absent, webhook/idempotency hardening is incomplete, and operations/observability are minimal.

## Billing Price Configuration

`MP_BASIC_PRICE_ARS` is the server-authoritative price for new basic-plan checkout preferences and Mercado Pago validation/reconciliation.

- Temporary production test: `MP_BASIC_PRICE_ARS=100`.
- Commercial launch: restore `MP_BASIC_PRICE_ARS=10000`.
- Production also requires `NEXT_PUBLIC_APP_URL` or `APP_URL` as a valid public URL; localhost is rejected.
- Missing or invalid production price configuration fails checkout closed rather than selecting an implicit commercial price.
- Price changes require coordinated provider validation/reconciliation handling. Existing payment records and old price periods must not be rewritten.

## Visual Work Unit: Editorial clara

**Outcome:** Replace the landing page's generic dark treatment with a light editorial commercial surface that explains the product, shows the actual booking model, and converts without invented social proof.

**Scope:** `app/page.tsx`, landing-specific rules in `app/globals.css`, and this roadmap entry only. Dashboard, settings, public booking, routes, and existing PWA/logo assets remain unchanged.

**Acceptance criteria:**

- [x] Landing hierarchy is intentional at 390px and wide desktop: header, promise, product preview, trust strip, outcomes, setup steps, evidence-based proof, pricing/trial, CTA, and legal footer.
- [x] Product preview visibly represents both public booking and the business agenda without external image dependencies.
- [x] Spanish copy avoids fabricated metrics, named customers, testimonials, or unsupported claims; the effective configured basic-plan price is shown in ARS and the existing 14-day trial remains linked to `/register`.
- [x] Header actions preserve `/demo`, `/login`, and `/register`; legal links preserve `/terms` and `/privacy`.
- [x] Focus states, contrast, keyboard-accessible links/buttons, and no horizontal overflow are verified at mobile and desktop sizes.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass.

**Rollback boundary:** Remove only the landing implementation in `app/page.tsx`, landing rules appended to `app/globals.css`, and this work-unit entry. Do not revert unrelated dirty-worktree changes.

## Visual Work Unit: Demo, Editorial clara

**Outcome:** Make `/demo` feel like the same FezTime product as the public booking and dashboard surfaces while showing the value of a clear booking journey.

**Scope:** `app/demo/page.tsx` and this roadmap entry only. Real booking, dashboard, billing, authentication, APIs, and shared landing styles remain unchanged.

**Acceptance criteria:**

- [x] Demo uses the Editorial-light canvas, readable typography, restrained indigo/coral accents, existing FezTime logo, responsive cards, and no dark SaaS/glow/emoji treatment.
- [x] Demo framing explains the booking journey, identifies example data, clarifies that no real appointments are created, and exposes `/register` and `/login` paths.
- [x] The five-step walkthrough remains available; slot and reschedule selections let visitors explore the customer journey, while the business view keeps attention on appointment status and details.
- [x] Focus states, keyboard semantics, contrast, touch targets, and no horizontal overflow are verified at desktop and 390px mobile widths.
- [x] No customer metrics, testimonials, automation claims, or new dependencies are introduced.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass; browser smoke is recorded when an available local port permits it.

**Execution log:** Implemented after `03c72f7` without modifying unrelated dirty-worktree files. Verification and browser results are recorded in the delivery response.

**Rollback boundary:** Remove only `app/demo/page.tsx` and this work-unit entry. Preserve all real booking, dashboard, billing, auth, API behavior, and unrelated dirty-worktree changes.

## Priority Model

| Priority | Meaning | Launch rule |
| --- | --- | --- |
| P0 | Blocks safety, correctness, revenue, or recovery | Must exit before commercial launch |
| P1 | Material conversion, trust, or support risk | Complete before broad launch; can follow a private pilot |
| P2 | Scale, polish, or expansion | Post-launch unless evidence promotes it |

## Copy Cleanup Work Unit

**Outcome:** Replace developer-oriented and internal status wording in visible owner/customer surfaces with clear Spanish copy, without changing identifiers, API contracts, logs, or technical documentation.

**Scope:** Visible copy in dashboard, public customer links, demo, billing, landing, terms, privacy, and this roadmap entry only.

**Launch blocker:** Terms and privacy remain explicitly pending legal completion and must not be presented as final policy before launch.

**Acceptance criteria:**

- [x] Visible implementation notes, raw provider/API errors, internal statuses, and developer jargon are removed or mapped to owner/customer language.
- [x] Demo keeps one concise note that example data does not create real appointments or save changes.
- [x] URL changes continue to warn that previously shared links may stop working.
- [x] No API response shape, internal name, error code, log, or technical documentation was changed.

**Rollback boundary:** Remove only the copy changes in the scoped UI files and this roadmap entry. Preserve all unrelated dirty-worktree changes and runtime behavior.

## Visual QA Fixes After `002878f`

**Outcome:** Remove the verified final visual-QA blockers without changing tenant booking routes or inventing deployment configuration.

- [x] Direct `/turnos` navigation redirects only when `NEXT_PUBLIC_DEFAULT_SLUG` or `DEFAULT_SLUG` is explicitly configured; otherwise it renders a helpful chooser instead of using a fake business slug or failing during server rendering.
- [x] Removed the unconfigured Vercel Analytics component from `app/layout.tsx`, eliminating the persistent `/_vercel/insights/script.js` 404 without adding deployment configuration.
- [x] Verified the landing header CTA uses `/register` and preserves `/demo` and `/login`; lower conversion CTAs continue to use `/register`.
- [x] Invalid magic links retain their user-visible expired/invalid recovery state. Their expected appointment lookup can still appear as a 404 network entry; it was not hidden or relabeled because that would risk masking real API failures.
- [x] `/:slug/turnos` booking routes remain unchanged.

**Remaining known limitations:** A generic `/turnos` URL cannot select a business without an explicit deployment default or a tenant slug in the shared link. Invalid magic-link requests still return a semantically correct 404 in the API and may be visible in browser network diagnostics.

**Rollback boundary:** Remove only `app/turnos/page.tsx`, the analytics import/render removal in `app/layout.tsx`, and this QA entry. Preserve all unrelated dirty-worktree changes.

## Visual Work Unit: Public business page

**Outcome:** Turn a shared business link into a credible branded booking page instead of a link-in-bio list, while keeping tenant content and capabilities honest.

**Scope:** `app/[slug]/page.tsx`, `app/[slug]/BusinessLandingClient.tsx`, and this roadmap entry only. Booking form, dashboard, schema, and slug resolution behavior remain unchanged.

**Acceptance criteria:**

- [x] Editorial-light mobile-first hierarchy gives the business identity, value proposition, dominant booking CTA, available contact/trust details, and a secondary share/install action distinct roles.
- [x] Only existing settings and business fields are rendered; empty content is hidden and no reviews, metrics, addresses, or unsupported automation promises are invented.
- [x] Tenant logo, colors, backgrounds, title, CTA, about text, WhatsApp, Instagram, address, and phone are preserved where configured, with WCAG-appropriate contrast checks and safe color fallbacks.
- [x] Primary links, buttons, focus states, keyboard semantics, responsive layout, share cancellation/failure feedback, and install rejection/loading states are usable on mobile and desktop.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass; browser smoke is recorded when an available local port permits it.

**Rollback boundary:** Remove only the public business page implementation in `app/[slug]/page.tsx` and `app/[slug]/BusinessLandingClient.tsx`, plus this work-unit entry. Preserve unrelated dirty-worktree changes.

## Visual Work Unit: Public booking flow

**Outcome:** Help mobile customers understand and complete a booking request confidently in under a minute, without changing public API behavior or inventing confirmation/reminder promises.

**Scope:** `app/[slug]/TurnosClient.tsx`, `app/[slug]/turno-recibido/page.tsx`, and this roadmap entry only. Dashboard, billing, and appointment API routes remain unchanged.

**Acceptance criteria:**

- [x] Editorial-light booking surface follows the public business page while safely using tenant colors as guarded accents.
- [x] Four steps have readable 15–16px controls, current/completed states, touch targets, labels, focus states, and non-color status cues.
- [x] Service, date, availability, time, customer details, and a final pre-submit summary are scannable on mobile.
- [x] Availability loading, empty, error, and retry states are distinct and use live status feedback.
- [x] Confirmation explains received/requested versus confirmed semantics, shows the API reference when available, and honestly describes WhatsApp/manual confirmation.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass; browser smoke is recorded when an available local port permits it.

**Rollback boundary:** Remove only the booking-flow implementation in `app/[slug]/TurnosClient.tsx`, `app/[slug]/turno-recibido/page.tsx`, and this work-unit entry. Preserve unrelated dirty-worktree changes.

## Visual Work Unit: Settings UX

**Outcome:** Make business settings understandable and actionable for owners, without changing the existing settings or slug API contracts.

**Scope:** `app/dashboard/SettingsTab.tsx` and this roadmap entry only. No uploads, schema changes, new dependencies, or backend contract changes.

**Acceptance criteria:**

- [ ] Settings are grouped into Public page, Appearance, About & contact, Sharing/public URL, and Advanced only where necessary, using owner-oriented Spanish copy.
- [ ] The top summary communicates setup status and provides preview, open, and copy actions using the existing safe public slug.
- [ ] The public URL is isolated in a warning card that explains shared links may stop working after a change; existing URL validation and save behavior remain intact.
- [ ] The settings save action visibly communicates unsaved, saving, saved, and error states without duplicating persistence logic.
- [ ] Theme presets appear before advanced color/background URL controls, which remain available behind a disclosure and preserve all existing API fields.
- [ ] Form labels, helper text, focus states, ARIA semantics, and responsive layout are usable at mobile and desktop widths without introducing a broad dashboard redesign.
- [ ] A modest public-page preview affordance exists; a full visual editor and uploads remain out of scope.
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass.

**Rollback boundary:** Remove only the Settings UX implementation in `app/dashboard/SettingsTab.tsx` and this roadmap entry. Preserve all unrelated dirty-worktree changes and existing API behavior.

## Visual Work Unit: Billing and authentication

**Outcome:** Make payment recovery, account access, and registration feel like one trustworthy FezTime product without changing payment or authentication contracts.

**Scope:** `app/billing/page.tsx`, `app/billing/BillingClient.tsx`, `app/login/page.tsx`, `app/login/LoginForm.tsx`, `app/register/page.tsx`, and this roadmap entry only. Billing APIs, auth routes, dashboard, and public pages remain unchanged.

**Acceptance criteria:**

- [x] Billing clearly presents the real Básico plan at the effective configured ARS price, account status, paid-through date, manual-payment model, payment history, reconciliation action, and recovery guidance without inventing invoices, refunds, or automatic renewals.
- [x] Pending, failed, expired, and retry states use actionable owner language, non-color status cues, safe support guidance, and no provider payloads or secrets.
- [x] Login and registration share the Editorial clara header/footer, responsive hierarchy, precise `Email` labels, visible login/registration paths, accessible password visibility controls, and inline loading/error/success feedback.
- [x] Registration explains the collected information and next onboarding step while preserving the existing `/api/register` payload and `/login?registered=1` transition.
- [x] No browser alerts or new dependencies are introduced; focus states and mobile/desktop layouts are verified.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass; browser smoke is recorded when an available local port permits it.

**Execution log:** Implemented after `07b2284` without modifying unrelated dirty-worktree files. Verification and browser results are recorded in the delivery response.

**Rollback boundary:** Remove only the five scoped billing/auth page and client implementations plus this work-unit entry. Preserve all billing APIs, auth behavior/contracts, and unrelated dirty-worktree changes.

## Visual Work Unit: Dashboard shell and navigation

**Outcome:** Make the authenticated workspace feel like a trustworthy operational product, with a clear next action and usable hierarchy across desktop and mobile.

**Scope:** `app/dashboard/DashboardClient.tsx` and this roadmap entry only. Appointments, calendar, schedule, services, settings content, API contracts, and activation data fetching remain unchanged.

**Acceptance criteria:**

- [x] Editorial-light neutral shell preserves tenant branding as accents and keeps the five existing destinations.
- [x] Navigation uses accessible local SVG icons, selected/current semantics, keyboard focus states, a desktop sidebar, and mobile bottom navigation.
- [x] Header hierarchy names the business, identifies the current page, exposes the existing billing route, and keeps activation progress as the primary next action without duplicate fetching or invented metrics.
- [x] Responsive spacing, readable hierarchy, and no excessive max-width compression are implemented without redesigning tab content.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass; browser smoke is recorded when an available local port permits it.

**Rollback boundary:** Remove only the dashboard shell/navigation implementation in `app/dashboard/DashboardClient.tsx` and this work-unit entry. Preserve unrelated dirty-worktree changes.

## Visual Work Unit: Appointments and calendar operations

**Outcome:** Help business owners see what needs attention today, understand the upcoming agenda, and update appointments confidently from desktop or mobile.

**Scope:** `app/dashboard/AppointmentsTab.tsx`, `app/dashboard/CalendarTab.tsx`, `app/dashboard/appointments/[id]/AppointmentDetailClient.tsx`, `app/dashboard/appointments/[id]/page.tsx` (route wiring only), and this roadmap entry only. Existing appointment APIs, WhatsApp/manual communication behavior, and unrelated dashboard tabs remain unchanged.

**Acceptance criteria:**

- [x] Editorial-light appointment and calendar surfaces match the dashboard shell, use tenant accents, and keep readable text and touch targets.
- [x] Pending requests are the first operational signal; today/tomorrow counts are derived from real appointment responses and do not claim analytics.
- [x] Date, day/week, and status controls are grouped with plain labels while preserving existing query parameters and endpoint contracts.
- [x] Browser `alert`/`confirm` usage is removed from the scoped surfaces; sensitive actions use accessible inline confirmation and feedback states.
- [x] Cards and details show client, service, date/time, duration when available, explicit status text, clear actions, and loading/error/empty/retry states.
- [x] Calendar appointments are keyboard-operable real buttons with accessible labels, a useful empty state, and responsive layout; the calendar remains the existing lightweight weekly view.
- [x] Communication copy accurately describes manual WhatsApp flows and does not claim automated reminders.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass; browser smoke is recorded when an available local port permits it.

**Execution log:** Implemented as the next visual work unit after `dac9ac3`, without modifying unrelated dirty-worktree files. Verification and browser results are recorded in the delivery response.

**Rollback boundary:** Remove only the appointments/calendar implementation in the four scoped dashboard files and this work-unit entry. Preserve unrelated dirty-worktree changes, API contracts, and existing WhatsApp/manual behavior.

## Visual Work Unit: Schedule and working hours

**Outcome:** Let a non-technical owner configure weekly working periods, pauses, and closed days quickly, with a clear preview of how availability will be generated.

**Scope:** `app/dashboard/ScheduleTab.tsx`, `app/api/admin/schedule/route.ts` for schedule-boundary validation, and this roadmap entry only. Holidays, date-specific exceptions, public booking behavior, and unrelated dashboard tabs remain unchanged.

**Acceptance criteria:**

- [x] Editorial-light responsive schedule cards use readable 15–16px controls, clear open/closed states, touch targets, keyboard focus, and accessible labelled removal controls.
- [x] Owner language explains working periods, breaks/lunch as separate periods, closed days, and how service duration generates availability; loading, empty, error, saved, and retry states are visible.
- [x] UI and API reject invalid times, incomplete blocks, reversed periods, and active overlaps; disabled blocks remain persisted but do not generate availability.
- [x] Copying a day to selected weekdays is explicit, confirms replacement when destinations already have periods, and clearly leaves copied days needing their own save action.
- [x] No holidays or date-specific exceptions are claimed as implemented; they remain documented as future capability.
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass; browser smoke is recorded when an available local port permits it.

**Execution log:** Implemented after `ea92850` without modifying the existing dirty deletion of `app/api/admin/schedule/[weekday]/route.ts` or unrelated worktree changes. Verification and browser results are recorded in the delivery response.

**Rollback boundary:** Remove only the schedule implementation in `app/dashboard/ScheduleTab.tsx`, the directly related validation changes in `app/api/admin/schedule/route.ts`, and this work-unit entry. Preserve all unrelated dirty-worktree changes and existing availability contracts.

## Execution Path

### Baseline and Stabilization

**Outcome:** A reproducible MVP baseline and a safe delivery loop.

- P0: record environment setup, routes, data ownership boundaries, and known dirty-worktree changes.
- P0: define smoke scenarios for registration, login, public booking, dashboard, billing, and payment return paths.
- P1: establish lint, typecheck, build, and a focused test harness when the first testable domain is selected.

**Entry:** Current MVP runs with required environment variables.
**Exit:** Baseline checklist is reproducible, verification commands are documented, and no known P0 regression is unowned.

### Phase 1: Security and Correctness

**Outcome:** Invalid requests fail safely and authenticated page boundaries behave predictably.

- P0: redirect unauthenticated `/dashboard` and `/billing` requests to `/login`.
- P0: centralize bounded input validation for strings, email, date, time, duration, price, Mongo IDs, and slugs.
- P0: apply validation to public appointment creation and admin service create/update only.
- P0: make booking atomic or enforce a database-backed uniqueness/idempotency strategy.
- P1: add rate limiting and abuse protection to public booking and auth entry points.
- P1: remove sensitive request-body logging and standardize API error codes.

**Entry:** Baseline is known and current route contracts are preserved.
**Exit:** Focused invalid-input checks pass, protected pages redirect, booking race behavior is addressed, and rollback is limited to this phase's files.

### Phase 2: Billing

**Outcome:** Plans can be sold and reconciled without trusting browser state.

- P0: define plan entitlements and enforce them server-side.
- P0: verify Mercado Pago webhook authenticity, idempotency, and state transitions.
- P0: persist payment/provider references and reconcile retries.
- P1: provide clear trial, active, past-due, cancelled, and recovery states.

**Entry:** Phase 1 request and auth boundaries are stable.
**Exit:** Test and sandbox payment flows prove success, failure, pending, duplicate, and replay behavior.

### Phase 3: Activation UX

**Outcome:** A new business reaches its first published booking quickly.

- P0: guided onboarding creates a usable business, active service, usable schedule, and public slug.
- P1: improve first-run empty states, booking confirmation, and shareable public URL flow.
- P1: add product analytics for activation, booking completion, and abandonment.

**Entry:** Billing and tenant ownership are enforceable.
**Exit:** A fresh account completes the activation smoke scenario without support intervention.

### Phase 4: Visual Polish

**Outcome:** The product looks deliberate and trustworthy across core journeys.

- P1: align marketing promise, pricing, onboarding, dashboard, booking, and billing language.
- P1: fix responsive, accessibility, loading, empty, error, and confirmation states on prioritized journeys.
- P1: ensure primary trial CTAs reach registration, invalid customer links provide recovery guidance, and dashboard destructive actions use accessible feedback instead of browser dialogs.
- P1: public booking communicates the four-step flow, localized date/availability states, and received-versus-confirmed appointment status.
- P1: legal and trust copy remains evidence-based; placeholder claims are launch requirements unless an approved source exists.
- P2: refine visual tokens, motion, illustrations, and tenant branding controls.

**Entry:** Core behavior and conversion events are stable.
**Exit:** Desktop/mobile visual QA passes on the prioritized journeys with no P1 usability defects.

### Phase 5: Operations and Quality

**Outcome:** The team can detect, diagnose, recover, and safely change production.

- P0: structured logs, error tracking, health checks, backups, restore drills, and alert ownership.
- P0: automated coverage for auth, tenant isolation, booking, billing state, and critical API validation.
- P1: CI gates lint, typecheck, build, tests, migrations, and security checks.
- P1: document incident response, support runbooks, data retention, and privacy obligations.

**Entry:** The product has real pilot traffic and known failure modes.
**Exit:** Recovery and deploy drills have evidence, and critical paths have repeatable automated tests.

### Phase 6: Expansion

**Outcome:** Validated demand becomes sustainable product breadth.

- P1: multi-staff/resources, reminders, calendar integrations, and stronger reporting where demand proves value.
- P2: teams/roles, localization, richer branding, marketplace/discovery, and advanced automation.
- P2: scale architecture only against measured bottlenecks.

**Entry:** Retention, support load, and revenue data identify the next constraint.
**Exit:** Each expansion has a measurable outcome, owner, rollback plan, and support impact assessment.

## Work-Unit Boundaries

1. Baseline: environment, smoke scenarios, and verification contract.
2. Phase 1A: auth redirects and shared validation foundations. This work unit.
3. Phase 1B: atomic booking, rate limiting, and abuse controls.
4. Phase 1C: sensitive logging review and bounded API error taxonomy. This work unit.
5. Phase 2A: billing state model and verified webhook transitions.
6. Phase 2B: billing reconciliation, subscription UX, and operational recovery.
7. Phases 3-6: each independently reviewable by outcome, tests, acceptance evidence, and rollback.

Keep tests with the behavior they verify. Do not combine billing, booking concurrency, or broad UI redesign with Phase 1A.

## Acceptance Checklist

- [ ] Unauthenticated dashboard and billing requests redirect to `/login`, not a visible 500.
- [ ] Public appointment creation rejects malformed, oversized, or unbounded fields with the existing 400 helper.
- [ ] Admin service create/update rejects invalid names, durations, prices, colors, IDs, and empty updates consistently.
- [ ] Existing authenticated success paths remain functional.
- [ ] No new dependency is installed for validation.
- [ ] Existing lint, typecheck, and build commands pass.
- [ ] If no test setup exists, the roadmap records that limitation and the verification commands are run.
- [x] Public booking serializes overlap validation and creation with a MongoDB transaction-scoped per-business/day lock; cancelled and rejected appointments remain available. Requires MongoDB transactions (replica set or sharded cluster); standalone deployments fail with `503` rather than claiming atomicity.
- [x] Public booking has a bounded per-instance baseline limiter: 5 requests per minute, with stale cleanup and `Retry-After` on `429`. Forwarding headers are ignored unless `TRUSTED_PROXY_HEADERS=true` is configured for a deployment that guarantees a trusted proxy overwrites them; otherwise all requests use a conservative shared fallback key. This must be replaced or complemented by a shared limiter before multi-instance abuse protection is treated as launch-ready.
- [x] Phase 1C public booking and billing webhook responses expose stable `code` values for validation, unauthorized, forbidden, not found, conflict, rate limited, and internal errors while preserving the existing `error` field; the shared helper remains opt-in so unrelated routes keep their response shape.
- [x] Phase 1C critical payment logs omit request bodies, provider payloads, payment URLs, tokens, phone numbers, and raw exception details; logs retain only safe operational identifiers and error names.
- [x] Phase 1C `/api/mp-test` is denied in production and requires an authenticated session in development/test, so its test `initPoint` is never exposed by a production request.
- [ ] Phase 1C has a focused test harness. No runner was added because the project has no test framework and adding one would not be lightweight or dependency-free; lint, typecheck, build, and diff checks remain the verification boundary.
- [x] Phase 2A validates Mercado Pago `x-signature` with `MP_WEBHOOK_SECRET`, the official `id/request-id/ts` HMAC manifest, and a five-minute replay window; missing configuration fails closed.
- [x] Phase 2A uses a unique database boundary on `Payment.mpPaymentId`, handles duplicate-key races, and stores only provider status, status detail, product, amount, currency, and billing period; raw provider payloads are not persisted.
- [x] Phase 2A accepts only the `basic-monthly` product at the configured `MP_BASIC_PRICE_ARS` price, validates `external_reference` as an existing business, and never trusts browser return URLs for activation.
- [x] Phase 2A applies the entitlement gate to dashboard and `/api/admin/*` operations, while billing recovery routes and public booking remain reachable after expiration.
- [x] Phase 2A transitions `pending` to `approved` or `rejected`, activates a 30-day period only for approved payments, exposes an effective `expired` state when `paidUntil` elapses, and ignores terminal duplicate/replayed notifications. Existing duplicate `mpPaymentId` data must be deduplicated before creating the unique index in production.
- [x] Phase 2A wraps payment transitions and entitlement mutation in one MongoDB transaction; concurrent approved payments serialize on the business document, and approved duplicate notifications repair entitlement without extending it twice. Standalone MongoDB deployments receive `503` and require a replica set or sharded cluster.
- [x] Phase 2A has focused configuration tests for price parsing/defaults and production public-URL failures; provider integration tests remain outside the local test boundary.
- [x] Phase 2B exposes authenticated, business-scoped payment history with bounded pagination and reduced DTOs; billing remains reachable when entitlement is inactive.
- [x] Phase 2B allows authenticated support recovery only for a locally known payment reference, re-fetches Mercado Pago server-side, revalidates product/amount/currency/business ownership, and applies the same idempotent transition rules as the webhook.
- [ ] Phase 2B has no focused automated tests because the repository still has no test runner; lint, typecheck, build, and diff checks remain the verification boundary.
- [x] Phase 3 activation MVP derives a four-state onboarding checklist from server data: active service, saved working hours, minimally configured public profile, and valid public slug. Dashboard actions navigate to the existing Services, Horarios, and Ajustes tabs; the public URL is previewable, openable, and copyable without exposing secrets.
- [ ] Phase 3 has no focused automated tests because the repository still has no test runner; lint, typecheck, build, and manual desktop/mobile activation smoke checks remain the verification boundary.
- [x] Phase 4 bounded UX slice: homepage trial CTAs link to `/register`; invalid/expired customer links exit loading with actionable recovery; Services uses inline accessible delete/error feedback; public booking shows four steps, localized date guidance, and explicit received/pending/confirmed status.
- [ ] Phase 4 legal/trust copy remains a launch requirement where no approved source exists; no claims were invented in this slice.
- [x] Phase 5A adds a lightweight Vitest harness for validation, slug, time/overlap, billing entitlement, and logger behavior; `npm test` is the focused command.
- [x] Phase 5A adds `/api/health`, which returns only app/database readiness and uses `503` when the database cannot connect or is not ready.
- [x] Phase 5A adds an allowlisted structured logger with `level`, `event`, `context`, and timestamp fields; payment and public booking failure logs exclude payloads, secrets, phone numbers, and raw exception details.
- [ ] Phase 5A does not complete backups, restore drills, CI gates, alert ownership, incident runbooks, or production error tracking; those remain subsequent work units.
- [x] Phase 5B adds CI gates for install, tests, lint, typecheck, and build without production secrets.
- [x] Phase 5B adds focused route tests for public booking validation, billing entitlement enforcement, and billing history tenant scoping using mocked boundaries.
- [x] Phase 5B documents environment/secrets, MongoDB transaction topology, health checks, backup/restore responsibilities, payment duplicate cleanup, incident triage, rollback, and alert ownership placeholders.
- [ ] Phase 5B does not provision cloud backups, alerting/error tracking, deployment changes, or CI secrets; owners must configure and evidence those controls before launch.

## Dependencies and Rollback

Dependencies flow in order: tenant/auth boundaries -> safe request contracts -> atomic booking and abuse controls -> billing enforcement -> activation -> polish -> operations -> expansion. Roll back one work unit at a time by reverting only its listed files and migrations; preserve data migrations until a forward-compatible recovery is confirmed. Never roll back payment state or booking data by deleting production records.

## Execution Log

| Date | Work unit | Result | Evidence |
| --- | --- | --- | --- |
| 2026-08-13 | Commercial-readiness audit | MVP baseline documented; P0 blockers identified | Prior audit: auth page 500s, non-atomic booking, weak validation, no automated tests |
| 2026-08-13 | Phase 1A | Validation correction verified | Numeric validators reject booleans and other non-number/non-string coercions; shared `#RGB`/`#RRGGBB` color validation applies to admin service POST/PATCH; `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass (lint retains 3 pre-existing warnings) |
| 2026-08-13 | Phase 1B correction | Removed stale lease race and lock cleanup gap | Transaction-scoped unique per-business/day lock covers overlap read, insert, and token-matched release, including rejected booking returns; transient/duplicate contention is safe, unsupported standalone Mongo returns `503`; the bounded limiter ignores untrusted forwarding headers by default and documents its conservative fallback; no test setup exists, so lint/typecheck/build/diff-check are the focused verification boundary |
| 2026-08-13 | Phase 1C | Hardened sensitive logging, bounded error taxonomy, and MP test endpoint access | Webhook, checkout, MP test, and public booking logs no longer emit bodies, provider payloads, payment URLs, tokens, phone numbers, or raw exception details; `/api/mp-test` is production-denied and session-protected outside production; public booking and webhook responses retain `error` and add stable `code`; no test runner added because the dependency-free project setup has no lightweight compatible harness |
| 2026-08-13 | Phase 2A | Added verified, idempotent payment transitions and server-side entitlements | Webhook signature verification, unique payment provider boundary, transaction-scoped payment plus entitlement updates, serialized 30-day extensions, duplicate activation repair, safe payment audit fields, configured ARS unit semantics, admin/dashboard entitlement gate, billing recovery access, and explicit public booking policy implemented |
| 2026-08-13 | Phase 2B | Added payment history, bounded reconciliation, and recovery UX | Authenticated business-scoped history DTOs, safe known-payment Mercado Pago refresh, shared validation/idempotency, pending/failed retry messaging, paid-through dates, and support references; no test runner exists |
| 2026-08-13 | Phase 3 activation MVP | Added first-run activation checklist and public link sharing | `/api/admin/activation` derives state from tenant-owned services, schedules, settings, and slug; dashboard provides next actions and safe URL copy/preview; registration now transitions with a clear login confirmation; no test runner exists |
| 2026-08-13 | Phase 4 bounded visual polish | Improved conversion, invalid-link recovery, accessible dashboard feedback, and public booking clarity | Primary landing CTAs now reach `/register`; magic-link loading has timeout and actionable invalid/expired states; Services replaces browser dialogs with an inline dialog and live feedback; booking communicates four steps and localized availability guidance; no legal claims added |
| 2026-08-13 | Phase 5B CI, route tests, and operations runbook | Added repeatable quality gates, focused high-risk route coverage, and production operations guidance | `.github/workflows/ci.yml`; `tests/route-risk.test.ts`; `docs/OPERATIONS.md`; verification commands and `git diff --check` |
| 2026-08-18 | Visual work unit: Editorial clara | Rebuilt the landing surface around product evidence, clear trial/pricing, and responsive editorial hierarchy | `app/page.tsx`; landing rules in `app/globals.css`; browser smoke and required verification commands |

## Next Work Units

- Phase 2B: reconcile provider state, add payment history/support tooling, and improve billing recovery UX.
- Before rolling out or relying on the `Payment.mpPaymentId` unique index, run a production duplicate cleanup: identify duplicate provider references, retain the authoritative transition/audit row, repair `Business.paidUntil` from approved periods, and only then create/validate the unique index.
- Manual reconciliation/support procedure: authenticate as the business owner, use Billing > Historial de pagos > Verificar pago only for a listed reference, confirm the returned status and paid-through date, and escalate provider/API failures with the business ID and provider reference only. Never request or paste access tokens or raw Mercado Pago payloads.
- Phase 1C follow-up: introduce focused unit tests only when a lightweight runner is selected and dependency policy permits it.
- Phase 3 follow-up: manually verify a fresh registration through service, usable hours, profile, preview, and public booking on desktop and mobile; add automated coverage only after a compatible runner is selected.
- Phase 5B follow-up: configure backup/restore evidence, alerting/error tracking, deployment probes, and named incident-response ownership before treating operations as launch-ready.

### Phase 5A Verification

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

Readiness smoke check: `GET /api/health` returns `200` with `{"status":"ok","checks":{"database":"ok"}}` when MongoDB is connected, and `503` with the same non-sensitive shape when it is unavailable.

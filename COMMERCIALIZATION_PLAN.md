# FezTime Commercialization Roadmap

This roadmap moves the current MVP toward a paid, trustworthy appointment SaaS. Each phase is a bounded work unit with explicit exit evidence; unfinished work remains visible instead of being hidden behind visual polish.

## Current Baseline

FezTime has public booking, authenticated business management, MongoDB persistence, NextAuth, and Mercado Pago integration. It is not launch-ready: booking is not atomic, automated tests are absent, webhook/idempotency hardening is incomplete, and operations/observability are minimal.

## Priority Model

| Priority | Meaning | Launch rule |
| --- | --- | --- |
| P0 | Blocks safety, correctness, revenue, or recovery | Must exit before commercial launch |
| P1 | Material conversion, trust, or support risk | Complete before broad launch; can follow a private pilot |
| P2 | Scale, polish, or expansion | Post-launch unless evidence promotes it |

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
- [x] Phase 2A accepts only the `basic-monthly` product at `10000` ARS, validates `external_reference` as an existing business, and never trusts browser return URLs for activation.
- [x] Phase 2A applies the entitlement gate to dashboard and `/api/admin/*` operations, while billing recovery routes and public booking remain reachable after expiration.
- [x] Phase 2A transitions `pending` to `approved` or `rejected`, activates a 30-day period only for approved payments, exposes an effective `expired` state when `paidUntil` elapses, and ignores terminal duplicate/replayed notifications. Existing duplicate `mpPaymentId` data must be deduplicated before creating the unique index in production.
- [x] Phase 2A wraps payment transitions and entitlement mutation in one MongoDB transaction; concurrent approved payments serialize on the business document, and approved duplicate notifications repair entitlement without extending it twice. Standalone MongoDB deployments receive `503` and require a replica set or sharded cluster.
- [ ] Phase 2A has no focused automated tests because the repository has no compatible test runner; lint, typecheck, build, and diff checks are the verification boundary.
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
| 2026-08-13 | Phase 2A | Added verified, idempotent payment transitions and server-side entitlements | Webhook signature verification, unique payment provider boundary, transaction-scoped payment plus entitlement updates, serialized 30-day extensions, duplicate activation repair, safe payment audit fields, `10000` ARS unit semantics, admin/dashboard entitlement gate, billing recovery access, and explicit public booking policy implemented; no test runner exists, so lint/typecheck/build/diff-check remain required |
| 2026-08-13 | Phase 2B | Added payment history, bounded reconciliation, and recovery UX | Authenticated business-scoped history DTOs, safe known-payment Mercado Pago refresh, shared validation/idempotency, pending/failed retry messaging, paid-through dates, and support references; no test runner exists |
| 2026-08-13 | Phase 3 activation MVP | Added first-run activation checklist and public link sharing | `/api/admin/activation` derives state from tenant-owned services, schedules, settings, and slug; dashboard provides next actions and safe URL copy/preview; registration now transitions with a clear login confirmation; no test runner exists |
| 2026-08-13 | Phase 4 bounded visual polish | Improved conversion, invalid-link recovery, accessible dashboard feedback, and public booking clarity | Primary landing CTAs now reach `/register`; magic-link loading has timeout and actionable invalid/expired states; Services replaces browser dialogs with an inline dialog and live feedback; booking communicates four steps and localized availability guidance; no legal claims added |
| 2026-08-13 | Phase 5B CI, route tests, and operations runbook | Added repeatable quality gates, focused high-risk route coverage, and production operations guidance | `.github/workflows/ci.yml`; `tests/route-risk.test.ts`; `docs/OPERATIONS.md`; verification commands and `git diff --check` |

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

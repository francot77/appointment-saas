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

- P0: guided onboarding creates a usable business, service, schedule, and public slug.
- P1: improve first-run empty states, booking confirmation, and shareable public URL flow.
- P1: add product analytics for activation, booking completion, and abandonment.

**Entry:** Billing and tenant ownership are enforceable.
**Exit:** A fresh account completes the activation smoke scenario without support intervention.

### Phase 4: Visual Polish

**Outcome:** The product looks deliberate and trustworthy across core journeys.

- P1: align marketing promise, pricing, onboarding, dashboard, booking, and billing language.
- P1: fix responsive, accessibility, loading, empty, error, and confirmation states.
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
6. Phase 2B: entitlements, checkout UX, and reconciliation.
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

## Dependencies and Rollback

Dependencies flow in order: tenant/auth boundaries -> safe request contracts -> atomic booking and abuse controls -> billing enforcement -> activation -> polish -> operations -> expansion. Roll back one work unit at a time by reverting only its listed files and migrations; preserve data migrations until a forward-compatible recovery is confirmed. Never roll back payment state or booking data by deleting production records.

## Execution Log

| Date | Work unit | Result | Evidence |
| --- | --- | --- | --- |
| 2026-08-13 | Commercial-readiness audit | MVP baseline documented; P0 blockers identified | Prior audit: auth page 500s, non-atomic booking, weak validation, no automated tests |
| 2026-08-13 | Phase 1A | Validation correction verified | Numeric validators reject booleans and other non-number/non-string coercions; shared `#RGB`/`#RRGGBB` color validation applies to admin service POST/PATCH; `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass (lint retains 3 pre-existing warnings) |
| 2026-08-13 | Phase 1B correction | Removed stale lease race and lock cleanup gap | Transaction-scoped unique per-business/day lock covers overlap read, insert, and token-matched release, including rejected booking returns; transient/duplicate contention is safe, unsupported standalone Mongo returns `503`; the bounded limiter ignores untrusted forwarding headers by default and documents its conservative fallback; no test setup exists, so lint/typecheck/build/diff-check are the focused verification boundary |
| 2026-08-13 | Phase 1C | Hardened sensitive logging, bounded error taxonomy, and MP test endpoint access | Webhook, checkout, MP test, and public booking logs no longer emit bodies, provider payloads, payment URLs, tokens, phone numbers, or raw exception details; `/api/mp-test` is production-denied and session-protected outside production; public booking and webhook responses retain `error` and add stable `code`; no test runner added because the dependency-free project setup has no lightweight compatible harness |

## Next Work Units

- Phase 2A: verified, idempotent billing webhooks and server-side entitlements.
- Phase 1C follow-up: introduce focused unit tests only when a lightweight runner is selected and dependency policy permits it.

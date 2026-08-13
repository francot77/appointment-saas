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
4. Phase 2A: billing state model and verified webhook transitions.
5. Phase 2B: entitlements, checkout UX, and reconciliation.
6. Phases 3-6: each independently reviewable by outcome, tests, acceptance evidence, and rollback.

Keep tests with the behavior they verify. Do not combine billing, booking concurrency, or broad UI redesign with Phase 1A.

## Acceptance Checklist

- [ ] Unauthenticated dashboard and billing requests redirect to `/login`, not a visible 500.
- [ ] Public appointment creation rejects malformed, oversized, or unbounded fields with the existing 400 helper.
- [ ] Admin service create/update rejects invalid names, durations, prices, colors, IDs, and empty updates consistently.
- [ ] Existing authenticated success paths remain functional.
- [ ] No new dependency is installed for validation.
- [ ] Existing lint, typecheck, and build commands pass.
- [ ] If no test setup exists, the roadmap records that limitation and the verification commands are run.
- [ ] Atomic booking and rate limiting are explicitly deferred to the next Phase 1 work unit.

## Dependencies and Rollback

Dependencies flow in order: tenant/auth boundaries -> safe request contracts -> atomic booking and abuse controls -> billing enforcement -> activation -> polish -> operations -> expansion. Roll back one work unit at a time by reverting only its listed files and migrations; preserve data migrations until a forward-compatible recovery is confirmed. Never roll back payment state or booking data by deleting production records.

## Execution Log

| Date | Work unit | Result | Evidence |
| --- | --- | --- | --- |
| 2026-08-13 | Commercial-readiness audit | MVP baseline documented; P0 blockers identified | Prior audit: auth page 500s, non-atomic booking, weak validation, no automated tests |
| 2026-08-13 | Phase 1A | Validation correction verified | Numeric validators reject booleans and other non-number/non-string coercions; shared `#RGB`/`#RRGGBB` color validation applies to admin service POST/PATCH; `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass (lint retains 3 pre-existing warnings) |

## Next Work Units

- Phase 1B: atomic booking/idempotency and rate limiting.
- Phase 1C: auth/API error taxonomy, sensitive logging review, and focused tests once a test harness is introduced.
- Phase 2A: verified, idempotent billing webhooks and server-side entitlements.

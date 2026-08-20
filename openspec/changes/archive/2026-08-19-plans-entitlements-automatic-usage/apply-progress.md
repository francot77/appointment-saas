# Apply Progress: Plans, Entitlements, and Automatic Usage

## Work Unit

- Delivery: auto-chain
- Chain strategy: stacked-to-main
- Slice: PR 4 / Tenant API, advisory UI, preservation coverage, and rollout verification
- Scope boundary: tasks 3.1–4.1; all planned PR4 work is complete

## Completed Tasks

- [x] 1.1 Added focused catalog, resolver, billing-gate, fallback, timezone, month-boundary, transition, and assignment-validation tests.
- [x] 1.2 Added the code-owned catalog, effective entitlement resolver, IANA timezone/month helper, additive Business fields, and trusted operator assignment boundary.
- [x] 1.3 Added the tenant-period AutomaticUsage schema/indexes and atomic idempotent reserve, commit, uncertain, and release operations.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `tests/entitlements.test.ts` | Unit | N/A (new) | ✅ Import failure confirmed before implementation | ✅ 7/7 passing | ✅ Catalog, billing, transitions, timezone, and validation paths | ✅ Pure helpers and catalog lookup extracted |
| 1.2 | `tests/entitlements.test.ts` | Unit | ✅ `tests/critical-logic.test.ts` run after additive model change | ✅ Covered by 1.1 RED tests | ✅ 7/7 passing | ✅ Legacy, unavailable billing, upgrade/downgrade, invalid timezone, boundary, and operator paths | ✅ Additive schema fields and trusted boundary isolated |
| 1.3 | `tests/messaging-usage.test.ts` | Unit/in-memory concurrency | ✅ Schema index assertions and injected model harness | N/A — OpenSpec has no strict-TDD mode configured | ✅ 5/5 passing | ✅ Last-slot race, off-by-one, duplicate commit, release/uncertain transitions, and index definitions | ✅ Model injection keeps provider calls and transactions outside accounting |

## Previous Work Unit Evidence (PR 1)

| Evidence | Result |
|----------|--------|
| Focused test command and exact result | `npx vitest run tests/entitlements.test.ts` — exit 0; 1 file and 7 tests passed |
| Runtime harness command/scenario and exact result | N/A — this slice contains pure policy helpers and a server-side persistence abstraction; no runtime route or worker boundary is in scope |
| Rollback boundary | Revert `lib/plans/catalog.ts`, `lib/entitlements.ts`, `lib/plans/assignment.ts`, additive fields in `lib/models/Business.ts`, `tests/entitlements.test.ts`, and this task progress without touching unrelated dirty files |

## Work Unit Evidence (PR 2)

| Evidence | Result |
|----------|--------|
| Focused test command and exact result | `npx vitest run tests/messaging-usage.test.ts` — exit 0; 1 file and 5 tests passed |
| Typecheck command and exact result | `npx tsc --noEmit --incremental false` — exit 0 |
| Runtime harness command/scenario and exact result | In-memory concurrent last-slot scenario executed by `tests/messaging-usage.test.ts` — exactly one of two jobs admitted; exit 0 |
| Rollback boundary | Revert `lib/models/AutomaticUsage.ts`, `lib/messaging/usage.ts`, `tests/messaging-usage.test.ts`, this PR2 progress section, and the task checkbox; do not touch PR1 files or unrelated dirty worktree changes |

## Cumulative Task Status

- None — all planned tasks are complete.

## Work Unit Evidence (PR 3)

| Evidence | Result |
|----------|--------|
| Focused test command and exact result | `npx vitest run tests/messaging-worker.test.ts tests/messaging-usage.test.ts tests/messaging-provider-reference.test.ts` — exit 0; 3 files and 21 tests passed |
| Typecheck command and exact result | `npx tsc --noEmit --incremental false` — exit 0 |
| Runtime harness command/scenario and exact result | In-memory worker harness covered Basic entitlement bypass, manual bypass, definite release/retry, and ambiguous delivery quarantine — exit 0 |
| Rollback boundary | Revert `lib/models/MessageJob.ts`, `lib/messaging/worker.ts`, `lib/messaging/providers/types.ts`, `lib/messaging/providers/meta-whatsapp.ts`, `tests/messaging-worker.test.ts`, this PR3 progress section, and task checkboxes; do not touch PR1/PR2 files or unrelated dirty worktree changes |

## PR 3 Implementation Notes

- Automatic jobs are admitted immediately before provider dispatch through a lease-scoped worker hook; jobs explicitly marked `automatic: false` retain the existing manual sender path.
- Admission re-resolves effective plan/timezone, checks the connection and approved event template, persists period/audit fields, and reserves through the existing atomic usage operations.
- Provider message IDs are explicit accepted certainty; definite failures release and follow bounded retry, while timeout/network ambiguity marks `delivery_unknown` and retains uncertainty.

## Work Unit Evidence (PR 4)

| Evidence | Result |
|----------|--------|
| Focused test command and exact result | `npx vitest run tests/entitlements.test.ts tests/entitlements-route.test.ts tests/messaging-usage.test.ts tests/messaging-worker.test.ts tests/appointment-messaging-integration.test.ts` — exit 0; 5 files and 41/41 tests passed |
| Typecheck command and exact result | `npx tsc --noEmit --incremental false` — exit 0 |
| Lint command and exact result | `npm run lint` — exit 1 with 8 errors in pre-existing/unrelated `lib/messaging/webhook.ts`, `tests/messaging-usage.test.ts`, and `tests/messaging-webhook.test.ts`, plus one unrelated warning in dirty `app/dashboard/ServicesTab.tsx`; no PR4-caused lint issue was found |
| Full test command and exact result | `npm test` — exit 0; 19 files and 104/104 tests passed |
| Build command and exact result | `$env:NODE_ENV='production'; $env:MP_BASIC_PRICE_ARS='10000'; npm run build` — exit 0; production compilation, typecheck, static generation, and route optimization completed; the non-secret billing price was supplied transiently and not persisted |
| Runtime harness command/scenario and exact result | Route mocks verified unauthorized tenant isolation, tenant-period read scope, no pricing field, and Basic read access; appointment integration verified scheduling remains available because quota is enforced at worker dispatch — exit 0 |
| Rollback boundary | Revert `app/api/admin/entitlements/route.ts`, `lib/apiError.ts`, `lib/entitlementPresentation.ts`, billing/settings presentation changes, PR4 tests, and this progress section; retain PR1–PR3 usage audit records and counters |

## Rollout / Index Readiness

- `AutomaticUsage` declares the tenant-period unique index and tenant/job allocation lookup index; the existing usage schema test is the readiness gate before enabling enforcement.
- No destructive migration, checkout, pricing, overage billing, or assignment mutation was added.
- Rollback is additive: disable worker enforcement and stop workers while retaining `MessageJob` records and `AutomaticUsage` counters for audit and later reconciliation.
- Live deployment must confirm both indexes are present before enabling the enforcement flag; this work unit does not claim a production MongoDB inspection.

## Corrective Verification

- Focused PR1–PR4 regression set: 41/41 passed.
- Full repository test suite: 104/104 passed.
- TypeScript typecheck: passed.
- Lint classification: no PR4-caused errors; remaining failures are confined to `lib/messaging/webhook.ts`, `tests/messaging-usage.test.ts`, and `tests/messaging-webhook.test.ts`, with an unrelated warning in `app/dashboard/ServicesTab.tsx`.
- Production build: passed with the documented non-secret transient `MP_BASIC_PRICE_ARS=10000` environment value; no secret or repository configuration was changed.

## Critical Blocker Remediation

- [x] Added `reconcileUncertainAsOperator()` as a backend-only trusted boundary. It conditionally matches only the tenant-period uncertain allocation, commits at most once or marks a terminal `released` allocation, and records reconciler identity, reason, evidence reference, and timestamp without exposing a tenant route.
- [x] Added focused commit/release/unauthorized reconciliation tests and an explicit `POST /api/admin/entitlements` rejection test proving tenant assignment inputs remain unchanged.

## Direct Verification Gap Remediation

- [x] Added a focused worker runtime test proving a quota-blocked automatic job projects tenant/job identity, period/timezone, effective plan, allowance, outcome, accepted/uncertain totals, and provider identifier state without invoking the provider.
- [x] Confirmed no implementation adjustment was required; the existing worker projection already carries the required fields and manual/appointment paths remain outside quota admission.

### Remediation Evidence

| Evidence | Result |
|----------|--------|
| Focused tests | `npx vitest run tests/messaging-usage.test.ts tests/entitlements-route.test.ts` — exit 0; 2 files and 13/13 tests passed |
| Typecheck | `npx tsc --noEmit --incremental false` — exit 0 |
| Full tests | `npx vitest run` — exit 0; 19 files and 109/109 tests passed |
| Lint classification | `npm run lint` — exit 1; 8 pre-existing `no-explicit-any` errors in webhook/usage tests and 1 unrelated `ServicesTab.tsx` hook warning; no remediation finding |
| Production build | `$env:NODE_ENV='production'; $env:MP_BASIC_PRICE_ARS='10000'; npm run build` — exit 0; transient non-secret price value, no configuration persisted |
| Rollback boundary | Revert the reconciliation additions in `lib/models/AutomaticUsage.ts`, `lib/messaging/usage.ts`, the entitlement route guard/tests, and these remediation artifact sections; retain all unrelated worktree changes |

### Direct Verification Evidence

| Evidence | Result |
|----------|--------|
| Focused tests | `npx vitest run tests/entitlements.test.ts tests/entitlements-route.test.ts tests/messaging-usage.test.ts tests/messaging-worker.test.ts tests/appointment-messaging-integration.test.ts` — exit 0; 5 files and 47/47 tests passed |
| Full tests | `npx vitest run` — exit 0; 19 files and 110/110 tests passed |
| Typecheck | `npx tsc --noEmit --incremental false` — exit 0 |
| Production build | `$env:NODE_ENV='production'; $env:MP_BASIC_PRICE_ARS='10000'; npm run build` — exit 0; transient non-secret price value |
| Runtime scenario | Quota-blocked automatic job projection asserted all required audit fields and provider non-dispatch; appointment scheduling and manual bypass remained passing |
| Rollback boundary | Revert the added test and these direct-verification artifact sections; retain all existing reconciliation, assignment, worker, usage, appointment, and manual-flow changes |

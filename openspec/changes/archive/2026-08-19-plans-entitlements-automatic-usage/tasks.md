# Tasks: Plans, Entitlements, and Automatic Usage

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650–800 authored lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 catalog → PR 2 accounting → PR 3 worker → PR 4 API/UI/tests |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Catalog, Business fields, resolver, period helper, operator assignment | PR 1 | `npx vitest run tests/entitlements.test.ts` | `npm test -- entitlements` (N/A until test exists) | Revert catalog, resolver, and Business additive fields |
| 2 | Usage schema/indexes and atomic reserve/commit/release | PR 2 | `npx vitest run tests/messaging-usage.test.ts` | In-memory concurrent last-slot scenario | Revert `AutomaticUsage` and `lib/messaging/usage.ts` |
| 3 | Worker admission, provider certainty, recovery, and job audit fields | PR 3 | `npx vitest run tests/messaging-worker.test.ts tests/messaging-usage.test.ts` | `POST /api/internal/messaging/run` with fake sender | Disable enforcement and revert worker/provider/job changes |
| 4 | Stable tenant API, UI gating/indicator, downgrade and preservation coverage | PR 4 | `npm test && npm run lint` | Dashboard/billing read-model smoke scenario | Revert route/UI/API error additions; retain audit data |

## Phase 1: Foundation

- [x] 1.1 RED: add catalog/resolver tests for `basic|premium|enterprise`, billing availability, legacy fallback, invalid IANA timezone, local month boundaries, upgrades/downgrades, and no pricing.
- [x] 1.2 Create `lib/plans/catalog.ts`, `lib/entitlements.ts`; add additive `plan`, `timezone`, and assignment metadata to `lib/models/Business.ts`; expose trusted operator-only assignment, never a tenant route/UI.
- [x] 1.3 RED then GREEN: add `lib/models/AutomaticUsage.ts` and `lib/messaging/usage.ts`; enforce tenant-period unique/job-key indexes and atomic idempotent reserve, commit, uncertain, release operations.

## Phase 2: Enforcement

- [x] 2.1 RED: extend `MessageJob` tests/fixtures for period, timezone, usage outcome, stable failure code, and lease-safe recovery.
- [x] 2.2 Modify `lib/models/MessageJob.ts` and `lib/messaging/worker.ts` so only automatic jobs reserve immediately before Meta; deny missing/disabled connection, entitlement, or quota without provider calls.
- [x] 2.3 RED then GREEN: test concurrent final slot, duplicate execution, accepted-before-crash, definite 429/5xx release/retry, timeout/network ambiguity, non-retryable `delivery_unknown`, and trusted reconciliation.
- [x] 2.4 Modify `lib/messaging/providers/*` to return explicit certainty; preserve Meta message-ID acceptance and retry behavior without calls inside accounting transactions.

## Phase 3: API, UI, and Preservation

- [x] 3.1 Create `app/api/admin/entitlements/route.ts`; add stable error codes in `lib/apiError.ts`; prove tenant isolation and read-model fields without assignment or pricing mutations.
- [x] 3.2 Update `app/billing/*` and `app/dashboard/MessagingSettingsCard.tsx` with advisory available/unavailable/quota/uncertain states and a period usage indicator; gate automatic controls only.
- [x] 3.3 Add focused appointment/manual `waUrl` preservation and downgrade tests in `tests/appointment-messaging-integration.test.ts`, plus route/component coverage; verify focused tests, lint, and typecheck.

## Phase 4: Rollout Verification

- [x] 4.1 Record additive index readiness and rollback boundaries; retain jobs/counters when enforcement is disabled or workers are stopped.
- [x] 4.2 Add backend-only trusted reconciliation for uncertain allocations with commit/release audit evidence and idempotency coverage.
- [x] 4.3 Add an explicit tenant assignment rejection guard and runtime route proof that entitlement inputs remain unchanged.

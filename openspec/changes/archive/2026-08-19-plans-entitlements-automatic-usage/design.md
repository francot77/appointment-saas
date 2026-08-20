# Design: Plans, Entitlements, and Automatic Usage

## Technical Approach

Keep policy in-process and persistence in MongoDB. A code-owned catalog resolves each business assignment and billing state into capabilities; one tenant-period document atomically admits automatic jobs. The existing `MessageJob` worker remains the only enforcement point and Meta remains outside MongoDB transactions. Appointments and manual/semi-automatic `waUrl` actions never call this quota path.

## Architecture Decisions

| Decision | Options / tradeoff | Choice and rationale |
|---|---|---|
| Plans | Database catalog adds administration; code catalog requires deployment | Export immutable `PlanKey -> capabilities/limits/requiresActiveBilling` definitions from `lib/plans/catalog.ts`. Persist `Business.plan` and assignment metadata; missing/unknown values resolve to `basic`. A trusted server function, not an owner route/UI, validates and assigns plans. |
| Effective entitlement | Assignment-only can grant unpaid access; billing-only preserves the boolean gate | `resolveEntitlements(business, now)` combines catalog assignment with `getEffectiveBillingStatus`. Always expose appointment/manual capabilities; catalog capabilities requiring payment are unavailable unless status is `trial`/`active` and `paidUntil > now`. Return the effective plan, reason, and limits. |
| Period | Server-local dates are nondeterministic | Add `Business.timezone`; validate as IANA and fall back to `America/Argentina/Buenos_Aires`. Derive `YYYY-MM` with `Intl.DateTimeFormat(..., {timeZone, year:'numeric', month:'2-digit'})`. Persist period and timezone on first job admission, then reuse them across retries. |
| Accounting | Ledger is larger; counter alone cannot represent ambiguity | Use one bounded monthly document with job-keyed allocations. This is the smallest auditable, concurrency-safe model; no Redis or billing ledger. |

## Data Flow

```text
lease job -> revalidate appointment -> resolve capability -> reserve period slot
   -> mark dispatchStartedAt -> Meta send -> accepted: commit usage + finish job
                                  -> definite failure: release + retry/dead
                                  -> ambiguous/crash: uncertain + delivery_unknown
```

On lease recovery, inspect the allocation first: `accepted` finalizes the job without resending; `uncertain` remains dead; a stale `reserved` allocation after `dispatchStartedAt` becomes `uncertain`. Trusted reconciliation alone may move uncertain to accepted or release it.

## Interfaces / Contracts

`AutomaticUsage` contains `businessId`, `periodKey`, `timezone`, `acceptedCount`, and `allocations[] = {jobKey, jobId, state: reserved|accepted|uncertain, reservedAt, resolvedAt?, providerMessageId?}` with timestamps. Indexes: unique `{businessId, periodKey}` and lookup `{businessId, 'allocations.jobKey'}`. `MessageJob` gains `usagePeriodKey`, `usageTimezone`, `usageOutcome`, and stable `failureCode`.

`reserve()` first upserts the period shell, then uses conditional `findOneAndUpdate`: an existing job allocation is replayed; otherwise append `reserved` only when `acceptedCount + reserved + uncertain < current effective limit`. `commit()` conditionally changes that job from `reserved|uncertain` to `accepted` and increments once. `markUncertain()` changes only `reserved`; `release()` pulls only `reserved`. Provider calls never occur in a transaction. Lease-token predicates protect job transitions; allocation state/job key provide retry idempotency.

Meta message ID is acceptance. Explicit validation/HTTP rejection is definite; retryable definite 429/5xx releases before bounded retry. Timeout or transport outcome without proof is ambiguous, retained as uncertain, and never auto-retried. Provider errors gain explicit certainty instead of inferring it from retryability.

Upgrades affect the next admission immediately and preserve counts. Downgrades use the lower current limit: accepted/uncertain history remains, while new automatic work is denied; already reserved work is rechecked before send. Jobs become auditable `entitlement_denied` or `quota_exceeded`, not deleted.

`GET /api/admin/entitlements` returns `{plan, billingStatus, timezone, automaticMessaging:{available, limit, accepted, uncertain, remaining, period}}`. Stable backend codes are `AUTOMATIC_MESSAGING_NOT_ENTITLED`, `AUTOMATIC_MESSAGING_QUOTA_EXCEEDED`, and `AUTOMATIC_MESSAGING_DELIVERY_UNKNOWN`. Billing/settings render this read model and gate only automatic controls; backend admission remains authoritative.

## File Changes

| File | Action | Description |
|---|---|---|
| `lib/plans/catalog.ts`, `lib/entitlements.ts` | Create | Catalog, assignment boundary, resolver, period helper |
| `lib/models/AutomaticUsage.ts`, `lib/messaging/usage.ts` | Create | Schema and atomic operations |
| `lib/models/Business.ts`, `lib/billingEntitlements.ts` | Modify | Assignment, timezone, effective billing integration |
| `lib/models/MessageJob.ts`, `lib/messaging/worker.ts`, `lib/messaging/providers/*` | Modify | Usage audit fields, enforcement, certainty/recovery |
| `app/api/admin/entitlements/route.ts` | Create | Tenant-scoped read model |
| `app/billing/*`, `app/dashboard/MessagingSettingsCard.tsx`, `lib/apiError.ts` | Modify | Minimal display/gating and stable errors |

## Testing Strategy

Unit-test catalog fallback, billing rules, IANA/default month boundaries, transitions, and error certainty. In-memory worker/usage tests cover concurrent final slot, duplicate job/retry, accepted-before-job crash, ambiguous recovery, definite release, upgrade/downgrade, and tenant isolation. Schema tests assert indexes; route/component tests assert the read model and automatic-only gating. Appointment lifecycle tests prove mutations, scheduling isolation, and `waUrl` remain unchanged. Run `npm test`, `npm run lint`, and `npm run build`.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

Deploy additive schemas/indexes and read fallbacks first; batch-backfill `plan=basic` and the timezone without requiring completion. Enable enforcement after index readiness with a rollback flag. Existing jobs acquire period data only at first admission. Disabling enforcement and stopping workers preserves jobs/usage for audit. Delivery should use auto-chained stacked-to-main slices under the 800-line review budget.

## Open Questions

None; concrete catalog keys and numeric limits remain product constants, not architectural choices.

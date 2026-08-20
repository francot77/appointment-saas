# Rollout Readiness: Plans, Entitlements, and Automatic Usage

## PR 4 readiness

- The tenant read API is read-only and derives its tenant from the authenticated current business.
- `AutomaticUsage` readiness depends on the unique `{ businessId, periodKey }` index and the `{ businessId, allocations.jobKey }` lookup index declared by the schema and covered by the usage tests.
- Before enabling enforcement in a deployment, confirm both indexes exist in MongoDB and then enable the worker flag.
- If rollback is required, disable enforcement and stop workers. Keep `MessageJob` documents, usage allocations, accepted counters, and uncertainty records intact for audit/reconciliation.

## Corrective apply evidence

- Focused regression command passed 41/41 tests across the entitlement, route, usage, worker, and appointment-preservation suites.
- Full `npm test` passed 104/104 tests and `npx tsc --noEmit --incremental false` passed.
- `npm run lint` remains externally blocked by unrelated existing errors in `lib/messaging/webhook.ts`, `tests/messaging-usage.test.ts`, and `tests/messaging-webhook.test.ts`, plus an unrelated warning in `app/dashboard/ServicesTab.tsx`; no PR4-caused lint issue was found.
- Production `npm run build` passed when supplied transiently with the repository-documented non-secret `MP_BASIC_PRICE_ARS=10000`; no secrets or configuration files were persisted.

## Scope guard

This rollout does not add checkout, pricing, overage billing, self-service assignment, or destructive data migration.

# Proposal: Plans, Entitlements, and Automatic Usage

## Intent

Replace the paid/basic gate with tenant-effective capabilities and monthly automatic WhatsApp limits, without restricting appointments or manual actions.

## Scope

### In Scope
- Use a code-owned catalog of stable plan keys, capabilities, and limits. Persist business assignment and IANA timezone; default existing businesses to `basic` and `America/Argentina/Buenos_Aires`.
- Resolve entitlements from assignment, billing state, and catalog; expose availability, limit, accepted usage, uncertainty, and period.
- Enforce automatic usage in the worker at Meta dispatch admission while preserving appointment mutations and manual/semi-automatic `waUrl` flows.
- Show minimal billing/settings status and auditable outcomes. Restrict assignment to a trusted operator-side server abstraction, never tenant-owner APIs or UI.

### Out of Scope
- Checkout, payment providers, pricing, invoicing, proration, refunds, or self-service changes.
- RBAC/operator console, usage-based billing, or full event ledger.

## Capabilities

### New Capabilities
- `plan-entitlements`: Catalog, assignment boundary, effective capabilities, transitions, and read model.
- `automatic-messaging-usage`: Timezone-month accounting, dispatch enforcement, auditability, and quota rules.

### Modified Capabilities
- None; no main OpenSpec capabilities exist.

## Approach

Store usage per `(businessId, YYYY-MM)` with accepted count and job-keyed reservations. Retain the timezone period across retries. Reserve only when `accepted + reserved < limit`; call Meta outside transactions; commit once when Meta returns a message ID. Release definite failures. An ambiguous result becomes non-retryable `delivery_unknown` and retains an uncertain—not accepted—reservation until trusted reconciliation commits or releases it.

Upgrades apply immediately without resetting monthly usage. Downgrades deny new automatic dispatches and block future automatic jobs; accepted history, appointments, and manual actions remain available.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `lib/models/Business.ts`, `lib/billingEntitlements.ts` | Modified | Assignment, timezone, capabilities |
| `lib/models/MessageJob.ts`, `lib/messaging/worker.ts` | Modified | Automatic-only admission and outcome accounting |
| `app/billing/*`, `app/dashboard/MessagingSettingsCard.tsx` | Modified | Minimal status and usage visibility |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Concurrent dispatch exceeds quota | Med | Conditional atomic reservations and unique job identity |
| Ambiguous Meta acceptance misstates usage | Med | Quarantine, visible uncertainty, trusted reconciliation |
| Downgrade disrupts core workflows | Low | Gate automatic jobs only; preservation tests |

## Rollback Plan

Disable automatic enforcement, stop workers, retain records for audit, and restore the paid/basic gate without deleting jobs or counters.

## Dependencies

- Existing MessageJob idempotency/lease model and Meta acceptance ID.
- Delivery: automatic, `auto-chain`, `stacked-to-main`; review budget: 800 changed lines.

## Success Criteria

- [ ] Entitlements and timezone-month usage are deterministic and tenant-scoped.
- [ ] Quota cannot be over-admitted or double-counted under concurrency/retries.
- [ ] Ambiguity, upgrades, and downgrades follow defined audit rules.
- [ ] Appointment and manual WhatsApp flows remain unchanged.

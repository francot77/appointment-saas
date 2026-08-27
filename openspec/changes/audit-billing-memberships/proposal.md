# Proposal: Audit and Deliver Self-Service Billing Memberships

## Intent

Give business owners one trustworthy Billing experience for plan choice, payment, membership changes, usage, and failure recovery. Preserve Basic manual billing while adding optional recurring billing at a 5% discount.

## Scope

### In Scope
- Present authoritative Basic, Premium, and Enterprise capabilities, prices, and WhatsApp allowances; hide unsupported products.
- Provide owner-only selection, confirmation, change, cancellation, and recovery journeys.
- Explicitly choose manual Mercado Pago monthly checkout at standard price or recurring subscription at 5% off.
- Define account (`trial`, `active`, `past_due`, `expired`, `cancelled`) and operation (`pending`, `rejected`) behavior across access, history, reconciliation, confirmations, and errors.
- Align entitlements, usage, and backend gates; Basic never exposes automatic WhatsApp.
- Preserve tenant scoping, provider validation, idempotency, and existing Basic manual customers.

### Out of Scope
- Dashboard redesign, public booking, appointment behavior, arbitrary roles, provider replacement, tax expansion, or invented refund rules.

## Capabilities

### New Capabilities
- `billing-memberships`: Catalog, plan and billing-mode management, lifecycle, history, reconciliation, cancellation, recovery, authorization, and migration.

### Modified Capabilities
- `plan-entitlements`: Permit validated owner commercial transitions while preserving server authority.
- `automatic-messaging-usage`: Align visible usage and dispatch gates with membership lifecycle.

## Approach

Map a server-owned, versioned commercial catalog to existing plan keys and immutable transaction identity. Separate account from provider-operation state. Extend signed webhooks, provider re-fetch, transactions, tenant references, and idempotency to plan-aware paths. Use a force-chained feature-branch chain; every autonomous slice stays below 400 changed lines with verification and rollback.

## Affected Areas

| Area | Impact |
|---|---|
| `app/billing/**`, dashboard navigation | Membership UX |
| `app/api/billing/**`, `lib/billing*`, models | Lifecycle operations |
| `lib/plans/**`, entitlement/messaging modules | Catalog and gates |
| Relevant tests | Contracts and journeys |

## Decisions Needed

- Authoritative pricing/catalog source and Enterprise commercial availability.
- Downgrade/cancellation effective timing and treatment of remaining entitlement/usage.
- Mercado Pago recurring API capability, webhook guarantees, and retry semantics.
- Refund, dispute, chargeback, and support policy.

## Risks

Event ordering, catalog drift, migration, or state divergence could grant incorrect access or charges. Mitigate with immutable identities, idempotent transitions, tenant checks, auditability, compatibility defaults, and staged rollout.

## Rollback Plan

Disable recurring and plan-change entry points, retain authoritative billing/history, and route existing customers through Basic manual billing. Revert slices independently without deleting provider records.

## Success Criteria

- [ ] Owners compare supported plans, choose billing mode, confirm terms, and complete or recover each lifecycle path.
- [ ] Billing, history, entitlements, and WhatsApp gates agree for every state and tenant.
- [ ] Existing Basic manual renewals remain valid and idempotent.
- [ ] Every slice stays below 400 changed lines with explicit chain targets and rollback.

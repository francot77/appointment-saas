# Audit Billing and Memberships — Exploration

## Exploration: audit-billing-memberships

### Current State

#### Executive finding

The system currently implements a **single manual monthly Basic payment flow**, not recurring subscriptions and not customer-facing membership selection. A plan catalog and entitlement model exist in code, but the account UI is effectively a Basic-plan payment/history page. Premium and Enterprise are operator-assigned concepts rather than selectable products.

#### Product surface and navigation

- `/billing` is a standalone, server-rendered account page titled `Facturación`.
- Dashboard navigation exposes billing as a secondary `Estado de cuenta` link in the desktop sidebar and a compact `Cuenta` link in the mobile header. Billing is not a primary dashboard tab and has no dedicated account settings area.
- The billing page presents the current plan, a status badge, `paidUntil`, automatic-messaging usage when available, one payment CTA, and payment history.
- The current page hardcodes `planName: 'Básico'` and the Basic price, even though `Business.plan` supports `basic`, `premium`, and `enterprise`. This makes the UI inaccurate for operator-assigned non-Basic businesses.
- The experience has loading, error, empty-history, payment-return, and disabled-button states. It has useful focus-visible styles and alert/status roles, but the main billing data itself is not represented by a loading state because it is server-provided.
- Copy clearly says there is no automatic debit or scheduled charge. This is consistent with the implementation and should be preserved unless recurring billing is explicitly designed later.

#### Catalog and membership selection

- `lib/plans/catalog.ts` defines `basic`, `premium`, and `enterprise` with appointment/manual-messaging capabilities and automatic WhatsApp allowances of 0, 100, and 1000 messages per local month.
- `lib/plans/assignment.ts` validates and assigns a plan through a trusted operator boundary. It explicitly warns that tenant-owner routes must not call it.
- There is no public plan catalog presentation, comparison, selection, checkout product parameter, upgrade flow, downgrade flow, cancellation flow, or customer self-service plan change.
- Mercado Pago checkout accepts only `BASIC_PRODUCT_ID = 'basic-monthly'`, one configured Basic price, and metadata for `plan: 'basic'`.
- `Business.mpPreapprovalId` exists but is unused by the observed checkout and reconciliation flow. It must not be interpreted as evidence of active recurring subscriptions.

#### Mercado Pago flow

1. An authenticated owner opens `/billing` and clicks `Pagar este mes`.
2. `POST /api/billing/mp/checkout` resolves the current owner business, creates a Mercado Pago preference for one Basic month in ARS, sets the business ID as `external_reference`, and returns `init_point`.
3. Mercado Pago returns to `/billing?status=success|failure|pending`; these query parameters are informational and do not themselves activate access.
4. Mercado Pago calls `POST /api/billing/mp/webhook`. The route validates `x-signature` and `x-request-id`, enforces a five-minute timestamp window, fetches the provider payment, validates product/business/currency/price/item quantity, and delegates persistence to `reconcileProviderPayment`.
5. The owner can reconcile a locally known non-approved payment through `POST /api/billing/reconcile`, which re-fetches the provider payment and enforces the current business ID.
6. Reconciliation stores a payment and, for an approved result, extends `paidUntil` by 30 days from the later of now or the existing paid period, then sets the business active.

The flow has meaningful idempotency protections: a unique `Payment.mpPaymentId`, a transaction, an approved-payment replay path, and retry handling for duplicate-key races. It also has an operational dependency on MongoDB transaction support; webhook and manual reconciliation return 503 when transactions are unavailable.

#### Billing fields and status lifecycle

`Business` stores `plan`, `planAssignedBy`, `planAssignedAt`, `status`, `paidUntil`, `mpPreapprovalId`, and timezone. Supported statuses are `trial`, `active`, `expired`, `past_due`, and `cancelled`.

- `trial` and `active` grant entitlement only when `paidUntil` is in the future.
- `getEffectiveBillingStatus` converts expired `trial`/`active` records to effective `expired` without necessarily persisting that transition.
- `markExpiredBusinesses` is available as a bulk mutation, but no scheduler or invocation was found in the audited surface.
- A rejected payment sets `past_due` only when the paid period is already absent or expired and does not overwrite `cancelled`.
- An approved payment sets `active` and extends the period.
- `expired` and `past_due` remain recoverable through the manual payment CTA; `cancelled` has no product-defined recovery behavior in the UI.
- There is no explicit grace-period policy, trial-duration policy, status transition audit trail, payment-attempt model, invoice/receipt model, refund/dispute handling, or clear distinction between an expired trial and an expired paid period.

#### Entitlements, limits, and automatic WhatsApp messaging

The authoritative path is `Business` → `getEffectiveBillingStatus`/`hasBusinessEntitlement` → `resolveEntitlements` → `/api/admin/entitlements` → presentation.

- Basic has appointments and manual messaging, but no automatic messaging and a zero allowance.
- Premium and Enterprise expose automatic messaging only while paid entitlement is valid; their monthly allowances are 100 and 1000.
- Usage is computed in the business timezone using local-month periods. Accepted and uncertain allocations are persisted separately; remaining capacity subtracts both.
- Message jobs use deterministic identity keys and a unique `(businessId, idempotencyKey)` index. Reservation/commit/release and uncertain reconciliation protect quota accounting against retries and provider ambiguity.
- The worker performs entitlement admission and connection checks before dispatch. Provider outcomes can be accepted, uncertain, released, or denied.
- Basic presentation was recently made fail-closed elsewhere in the dashboard, but billing's `presentAutomaticMessaging` surface still depends on the entitlement response and needs to remain product-consistent: Basic must not see automatic-messaging labels, limits, upgrade prompts, or controls.
- The billing usage card links to `#billing-payment`, but no plan options are rendered at that anchor, so its upgrade CTA is currently non-functional product guidance.

#### Missing lifecycle flows

Missing or undefined customer journeys include:

- selecting a plan during onboarding or from billing;
- comparing plan capabilities and limits;
- upgrading from Basic to Premium/Enterprise;
- downgrading with an effective date and entitlement treatment;
- cancelling a plan or deciding whether cancellation means immediate lockout or end-of-period access;
- renewing a selected plan other than paying the fixed Basic product;
- handling payment pending, rejected, cancelled, refunded, charged-back, duplicated, or mismatched product outcomes in user-facing detail;
- changing plan price/catalog versions without ambiguity for already-created preferences;
- recovering a cancelled account;
- exposing a billing contact, business tax/invoice identity, currency, receipt, or payment support workflow.

#### Authorization and tenant isolation

`getCurrentBusiness` derives the business exclusively from the authenticated session user's `ownerUserId`. Billing history queries, payment reconciliation prechecks, messaging connection routes, settings, activation, and other admin routes scope access through that business. Reconciliation additionally validates provider `external_reference` against the current business. Internal messaging execution uses a timing-safe bearer secret.

The main gaps are not an observed cross-tenant query in the audited billing routes, but the lack of a formal membership/role model: the schema supports one owner lookup rather than multiple account members, delegated billing administrators, or explicit organization membership. Operator plan assignment is intentionally separate but has no visible operator audit/approval surface in this product area.

#### UX, accessibility, responsive behavior, and copy

Strengths:

- clear account/billing hierarchy, payment privacy note, and Spanish copy aligned to manual monthly payment;
- responsive two-column-to-stacked layout and mobile billing access;
- `role="alert"` for failures, `role="status"` for payment loading and return banners, disabled states, and visible keyboard focus styles;
- payment history avoids card data and exposes provider references for support.

Gaps:

- the current-plan display is not authoritative for Premium/Enterprise and advertises fixed Basic capabilities (`Turnos ilimitados · 1 local`);
- no plan comparison means users cannot understand what they can buy or why an upgrade exists;
- payment CTA has no explicit confirmation/amount review step and does not show the chosen product because there is only one hardcoded product;
- error recovery is generic, and the entitlement request can overwrite the payment-history error in the same shared error slot;
- automatic-messaging status lacks an explicit progress-bar accessible name/value relationship;
- color status dots are decorative and the text carries meaning, but status semantics are not consistently announced as a structured status;
- history has an `Actualizar` action but no visible pagination/load-more despite an API `hasMore` contract;
- focus management after returning from Mercado Pago and after reconciliation is unspecified;
- small mobile labels and dense cards need browser validation at narrow widths and zoom, especially once plan cards are introduced;
- the copy mixes Spanish with the Enterprise text `Contact us`, and terminology alternates between plan, account status, access, subscription, and payment without a product glossary.

#### Tests, observability, security, and operations

Existing coverage is strongest around entitlement helpers, route-risk tenant scoping, messaging usage/worker/webhook behavior, critical billing configuration, logging, and presentation contracts. There are no dedicated billing checkout, billing webhook, reconciliation, BillingClient, plan-selection, or lifecycle journey tests found by the audit. The codegraph also reports no covering tests for several billing symbols.

Observability includes structured billing webhook failure logging and checkout/reconciliation server logs, but there is no evident payment-attempt correlation ID, preference ID persisted locally, webhook event record, reconciliation audit trail, metrics for pending duration/activation latency/replay/quota denial, or operator dashboard for failed payments. Webhook signature verification, provider-side re-fetch, product/currency/price validation, tenant reference validation, unique provider ID, and transaction retry are strong controls. Risks remain around replay/event storage, price transitions, refund/dispute handling, request rate limiting, CSRF policy for authenticated mutation routes, and sensitive operational logs such as business/provider identifiers.

### Affected Areas

- `app/billing/page.tsx` — current account page; hardcodes Basic plan name and price while deriving only status and paid period.
- `app/billing/BillingClient.tsx` — payment CTA, history, reconciliation, entitlement card, loading/error/empty states, and billing copy.
- `app/dashboard/DashboardClient.tsx` — desktop/mobile billing navigation and account hierarchy.
- `lib/plans/catalog.ts` — existing plan definitions and feature allowances; source for a future product catalog.
- `lib/plans/assignment.ts` — trusted operator-only plan assignment; no owner self-service equivalent.
- `lib/models/Business.ts` — account billing fields and status enum; currently one owner per business.
- `lib/billingEntitlements.ts` — effective status, entitlement gate, and expired-status mutation helper.
- `lib/entitlements.ts` and `lib/entitlementPresentation.ts` — entitlement computation, local-month quota, and messaging presentation states.
- `lib/billingConfig.ts` — configured Basic price and accepted transition prices.
- `app/api/billing/mp/checkout/route.ts` — fixed Basic Mercado Pago preference creation.
- `app/api/billing/mp/webhook/route.ts` — signed provider notification and provider re-fetch.
- `app/api/billing/reconcile/route.ts` — owner-triggered provider reconciliation.
- `lib/billingReconciliation.ts` and `lib/models/Payments.ts` — validation, period extension, idempotency, and payment persistence.
- `lib/currentBusiness.ts` — session-owner tenant resolution and entitlement gate.
- `lib/messaging/worker.ts`, `lib/messaging/usage.ts`, `lib/messaging/jobs.ts`, `lib/messaging/appointmentLifecycle.ts` — automatic WhatsApp admission, quota accounting, idempotency, and delivery uncertainty.
- `app/api/admin/entitlements/route.ts` and `app/api/admin/messaging/connection/route.ts` — entitlement read model and paid-plan messaging boundary.
- `tests/critical-logic.test.ts`, `tests/entitlements.test.ts`, `tests/entitlements-route.test.ts`, `tests/route-risk.test.ts`, and messaging test files — current safety-net coverage.

### Concrete User Journeys

1. **New owner, free/trial start** — register → business defaults to Basic/trial → dashboard requires valid paid entitlement when `paidUntil` is absent → billing page shows Basic and no payment history → owner can start one Basic-month payment. There is no plan choice.
2. **Basic renewal** — open account → see paid-through date and active status → click `Pagar este mes` → Mercado Pago → return banner → webhook or manual verification updates payment/history and extends 30 days. This is manual renewal, not recurring billing.
3. **Pending payment** — return with pending banner → history may show pending only after provider webhook/reconciliation creates a local record → owner can verify once. There is no explicit pending timeout or support case state.
4. **Expired/past_due recovery** — billing page remains available, shows a recoverable status, and offers the same Basic payment. There is no differentiated grace period or recovery plan choice.
5. **Premium/Enterprise business** — operator assigns plan in backend → entitlements can unlock automatic WhatsApp → billing UI still labels the plan Basic and offers Basic payment, creating a dangerous mismatch between enforcement and customer-facing billing.
6. **Basic owner seeks automatic WhatsApp** — dashboard should hide the automatic feature entirely under the Basic hard-absence rule; billing currently has an upgrade-oriented presentation path but no selectable Premium destination or checkout product.
7. **Two users or delegated billing operator** — no supported membership model exists; the owner-only lookup cannot express member roles, billing permissions, invitation, removal, or transfer.

### Prioritized Gap List

#### P0 — correctness and trust

1. Make billing read from the authoritative assigned plan and price/product rather than hardcoding Basic; prevent a Premium/Enterprise account from being shown a false plan or offered the wrong renewal product.
2. Decide and document the product model: manual monthly payment versus recurring subscription. Current implementation is manual; `mpPreapprovalId` must not silently imply otherwise.
3. Define the state machine for trial, active, past_due, expired, cancelled, pending, rejected, refunded, and disputed payments, including access, messaging, and renewal behavior for each transition.
4. Make plan/product identity durable per payment and preference so catalog price changes cannot reinterpret historical or pending payments.

#### P1 — core product capability

5. Add a real plan catalog/comparison and membership selection flow, with explicit plan, price, allowance, checkout, confirmation, and post-payment state.
6. Implement upgrade, downgrade, cancel, renew, and cancelled-account recovery rules; distinguish immediate versus end-of-period changes.
7. Fix the non-functional automatic-messaging upgrade CTA and keep Basic completely free of automatic-messaging UI.
8. Decide whether “membership” means one business owner or a multi-user organization; if multi-user, introduce explicit memberships/roles and billing permission boundaries.

#### P2 — resilience and operations

9. Add payment-attempt/webhook event observability, correlation IDs, replay records, pending aging, reconciliation metrics, and operator remediation/audit tools.
10. Add explicit handling and tests for duplicate, out-of-order, mismatched, refunded, cancelled, and provider-error events plus catalog-price transitions.
11. Add lifecycle/route/UI journey tests, including all statuses, assigned non-Basic plans, narrow responsive layouts, keyboard/focus return, and failed entitlement/history requests.
12. Clarify invoice/receipt, billing identity, support, tax, refund, and privacy requirements before expanding the catalog.

### Approaches

1. **Define the manual membership product first** — model customer-selectable plans as one-time monthly payment products, then build catalog selection, plan-aware checkout, lifecycle rules, and entitlement/UI consistency.
   - Pros: matches current behavior, avoids accidental recurring-subscription promises, smallest conceptual correction, reuses existing reconciliation and quota foundations.
   - Cons: requires explicit renewal UX and still needs future recurring migration if the business later wants subscriptions.
   - Effort: High

2. **Adopt recurring Mercado Pago subscriptions immediately** — replace the fixed preference flow with preapproval/subscription lifecycle and automated billing states.
   - Pros: less manual renewal friction and clearer recurring revenue model once complete.
   - Cons: conflicts with current copy and implementation, requires cancellation/pause/retry/refund policy, provider lifecycle reconciliation, migration strategy, and significantly higher operational risk.
   - Effort: High

3. **Keep operator-assigned plans and only improve account transparency** — expose the assigned plan and status without owner plan selection.
   - Pros: smallest implementation and preserves operator control.
   - Cons: does not satisfy the missing membership-selection product need and leaves upgrades dependent on support/operator work.
   - Effort: Medium

### Recommendation

Start with Approach 1 unless the product owner explicitly chooses recurring subscriptions. Treat the current system as a manual monthly membership/payment product. First define the plan catalog, authoritative account fields, lifecycle/state matrix, and tenant/membership model; then implement a plan-aware billing surface and checkout. Preserve the existing signed webhook, provider re-fetch, tenant reference validation, transaction/idempotency controls, and entitlement/quota foundations. Do not build UI against `mpPreapprovalId` or describe the system as recurring until the provider lifecycle is actually implemented and tested.

### Risks

- A hardcoded Basic billing UI can cause users with operator-assigned Premium/Enterprise entitlements to buy or believe they have the wrong product.
- The current status model mixes effective access derived from dates with persisted status, creating possible stale operational states without a reliable scheduler.
- Provider events can be duplicated or arrive out of order; current payment idempotency is strong for one payment ID but does not constitute a complete event ledger or refund/dispute model.
- A future plan-selection flow could bypass server-side product/price validation unless the provider item and business plan transition are validated from a server-owned catalog.
- The owner-only tenant lookup does not support shared accounts or delegated billing roles and could make “membership” requirements ambiguous.
- Introducing recurring subscriptions without resolving the current manual-payment contract would create contradictory copy, entitlement timing, and cancellation behavior.
- Automatic WhatsApp quota and delivery uncertainty are operationally sensitive; incorrect plan/status transitions can over-send, block legitimate messaging, or misreport remaining capacity.
- Existing worktree changes are unrelated and must remain untouched; this exploration created no production code changes.

### RDD / Review Contract

- `rdd_mode`: disabled/unmanaged; this is an audit and exploration, not an approved defect implementation.
- `issue_pr`: none; no issue or PR approval was supplied and no implementation is authorized.
- `causal_invariant`: billing product identity, lifecycle state, and entitlement presentation must agree across UI, provider reconciliation, and tenant-scoped data.
- `operator_flows`: billing entry, fixed Basic checkout, Mercado Pago return, signed webhook, manual reconciliation, status recovery, entitlement admission, and automatic WhatsApp quota dispatch.
- `journey_runtime_evidence`: source and test inventory only; no production code or browser journey was changed or claimed as executed.
- `changed_line_budget`: artifact-only exploration; no production diff and no 400-line implementation forecast yet. The requested force-chained feature-branch strategy should be carried into proposal/tasks if implementation is approved.
- `tests`: existing focused unit/source-contract/route-risk/messaging coverage is documented above; dedicated billing lifecycle and plan-selection coverage is missing.
- `rollback`: delete or supersede this exploration artifact; no runtime rollback is required because production files were not modified.
- `unresolved_authority_decisions`: manual versus recurring billing, plan ownership/self-service versus operator assignment, membership/role semantics, lifecycle/grace/refund policy, and invoice/tax/support requirements.

### Ready for Proposal

Yes, conditionally. The next proposal should choose the billing product model and scope the first bounded slice around authoritative plan-aware membership selection and manual monthly checkout, or explicitly defer selection and scope transparency/lifecycle corrections first. It should not assume recurring subscriptions.

## Key Learnings

1. The repository has a plan catalog but currently exposes only a fixed Basic manual monthly payment journey.
2. Mercado Pago webhooks and manual reconciliation validate provider data and tenant identity with useful idempotency controls.
3. Premium and Enterprise entitlements can exist in backend data while billing UI still claims the account is Basic.
4. Automatic WhatsApp quota accounting has stronger backend foundations than the customer-facing upgrade and membership flows.
5. The owner-only business lookup does not yet represent multi-user account memberships or delegated billing roles.

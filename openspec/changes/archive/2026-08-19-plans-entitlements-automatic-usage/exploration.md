# Exploration: plans-entitlements-automatic-usage

## Current State

- **Tenant and identity:** `User` stores email, name, and password hash. NextAuth uses a JWT session and copies the authenticated user id into `session.user.id`. `Business.ownerUserId` is the tenant relationship; `getCurrentBusiness()` resolves the first business owned by that user and optionally applies the existing billing entitlement check. There is no role model or multi-business selector.
- **Billing and plans:** `Business` currently has `plan: 'basic'`, `status`, `paidUntil`, and Mercado Pago preapproval metadata. `lib/billingEntitlements.ts` is a boolean paid-period gate, and `Payments` plus `billingReconciliation.ts` implement one `basic-monthly` product. Payment reconciliation already uses `startSession()`/`withTransaction()`, a unique provider payment id, and idempotent retries. There is no plan catalog, capability map, usage ledger, admin assignment route, or entitlement-specific administrative UI. Manual checkout is the only visible plan operation.
- **Authorization and errors:** Admin routes consistently call `getCurrentBusiness({ requireEntitlement: true })`, scope queries by `business._id`, and translate `UNAUTHORIZED`, `NO_BUSINESS`, and `BILLING_REQUIRED` into `apiError()` responses. `apiError()` returns `{ error, code? }`; the existing billing-block response is HTTP 402 with code `FORBIDDEN`. This convention is reusable, but a quota denial needs a distinct stable code/status contract.
- **Messaging jobs and automation:** `MessageJob` is tenant-scoped and has `scheduled`, `leased`, `retry_wait`, `sent`, `dead`, and `invalidated` states; unique `(businessId, idempotencyKey)` and lease indexes enforce job identity and single claiming. Appointment lifecycle integration bulk-upserts provider-neutral confirmation/reminder jobs and invalidates obsolete versions. `createConfiguredMessageSender()` loads the tenant's enabled Meta WhatsApp connection and approved templates. The worker atomically claims jobs, marks `dispatchStartedAt`, revalidates the appointment, calls Meta, records `providerMessageId` on success, and retries bounded retryable failures; ambiguous/timeouts become `delivery_unknown` dead jobs to avoid duplicate sends.
- **Provider and connection behavior:** Meta success is currently represented by a returned WhatsApp message id (provider acceptance); HTTP client errors are non-retryable, server/rate/network failures are retryable, and timeouts are delivery-unknown. The connection is enabled only when the tenant has a persisted connection with an access token and `enabled: true`; templates are separately checked for approved `es_AR` Utility status. Webhooks correlate by persisted `phoneNumberId` and `providerMessageId`, deduplicate provider events, and advance delivery states monotonically.
- **Transactions and atomicity:** Mongoose transactions are already used for rescheduling and Mercado Pago reconciliation, with explicit handling for deployments without replica-set transaction support. Atomic `findOneAndUpdate` is used for worker claims and conditional job transitions. A quota reservation/commit mechanism can therefore use a conditional atomic update or a short transaction; it must not hold a Mongo transaction open across the Meta HTTP call.
- **UI:** `DashboardClient` provides tabs for appointments, services, schedule, calendar, and settings, plus a billing link. `SettingsTab` renders `MessagingSettingsCard`, making it the smallest location for automatic messaging status. `AppointmentsTab` already distinguishes automatic lifecycle messaging from manual WhatsApp actions (`waUrl`); quota gating must not disable appointment management or manual/semi-automatic actions. `/billing` already displays the current basic plan and payment history, so a compact plan/capability/usage panel belongs there or in a minimal shared account summary.
- **Tests:** Vitest tests are organized around pure helpers, route contracts, Mongoose schema indexes, lifecycle integration, worker leases/retries, provider behavior, and webhook deduplication. Existing tests explicitly protect manual appointment behavior, tenant correlation, idempotent jobs, and transaction-compatible persistence. New quota tests should follow this dependency-injection and in-memory-model style, plus focused route/UI contract tests where practical.
- **Worktree:** The repository has unrelated dirty changes that MUST be preserved: modified appointment/availability/service/register/public-page files, deleted `app/api/admin/schedule/[weekday]/route.ts` and `saas.zip`, untracked `.atl/`, `.codegraph/`, `.playwright-mcp/`, analysis/optimization artifacts, archives/images, and `app/api/admin/slug/` and `app/api/dev/`. No existing OpenSpec directory or config is present. The current changes must not be reset, reformatted, or included in this feature's implementation by assumption.

## Concrete Gaps

- Replace the single hard-coded `basic` plan assumption with persisted plan definitions or a small code-defined catalog plus business assignment fields, while retaining a safe fallback for existing businesses.
- Add capability resolution separate from the current all-or-nothing paid-period gate. Automatic WhatsApp usage must be one capability; appointments and manual/semi-automatic messaging remain available at quota exhaustion.
- Add a business timezone source. `Business` has no timezone field today, and existing date handling is a mixture of local time and UTC strings. Period keys must be generated from an explicit IANA timezone, with a deterministic default and migration behavior.
- Add monthly usage persistence. A counter alone cannot safely represent provider acceptance and ambiguous dispatch; the smallest robust model needs a unique `(businessId, periodKey)` record with limit, committed/accepted count, and reservation/in-flight state or idempotent job linkage.
- Connect enforcement to the worker, not only appointment scheduling or UI. The worker is the only path that actually calls Meta and has the provider result needed for correct accounting.
- Define downgrade behavior for scheduled jobs and already-sent jobs. Existing jobs should remain auditable; future automatic jobs must stop or be invalidated when the capability is absent, without affecting appointments or manual sends.
- Add an entitlement/usage read endpoint or server data contract for the billing/settings UI, and a stable quota-exceeded API/error representation for automatic dispatch.
- Add administrative plan assignment support. No admin role or operator surface exists, so the initial smallest viable option is a protected server-side/business mutation abstraction that later admin tooling can call; do not expose plan assignment to tenant owners.

## Quota Semantics Evaluation

- Count only after Meta returns a provider message id, treating that result as provider acceptance. Do not decrement quota on `MetaProviderClientError`, template rejection, disabled connection, or pre-dispatch validation failure.
- Do not retry quota consumption per attempt. A message job needs a stable usage identity, such as its tenant plus idempotency key/period, and the worker must commit at most once when transitioning to accepted/sent. The unique usage identity and conditional update protect duplicate worker/retry paths.
- Do not reserve quota permanently before the provider call. If a pre-send reservation is required to prevent concurrent over-admission, release it on definite provider failure; for timeout/ambiguous delivery, quarantine the job and resolve conservatively rather than charging a second retry. The implementation must explicitly choose whether ambiguous delivery is charged once or left unresolved, because Meta cannot prove acceptance after a timeout.
- Enforce the limit at dispatch admission with an atomic conditional operation, then commit accepted usage atomically and idempotently. A transaction may coordinate the counter and job state, but the external provider call must remain outside it.
- Use `periodKey = YYYY-MM` derived from the business IANA timezone, not server timezone or a rolling 30-day window. Persist the key used for every accepted usage record so month boundaries and retries are deterministic.
- At the limit, suppress only automatic confirmation/reminder/reschedule jobs (or mark them quota-blocked/auditable). Preserve appointment mutations and manual/semi-automatic WhatsApp actions, including the existing `waUrl` flow.

## Affected Areas

- `lib/models/Business.ts` / `lib/currentBusiness.ts` / `lib/billingEntitlements.ts` — tenant-owned plan, timezone, and capability resolution.
- `lib/models/Payments.ts` / `lib/billingReconciliation.ts` / `app/billing/page.tsx` / `app/billing/BillingClient.tsx` — existing billing lifecycle and plan/usage presentation.
- `lib/models/MessageJob.ts` / `lib/messaging/domain.ts` / `lib/messaging/worker.ts` — automatic-only classification, dispatch admission, provider-acceptance accounting, retry/idempotency behavior.
- `lib/messaging/connection.ts` / `lib/messaging/providers/*` / `lib/messaging/webhook.ts` — connection enablement and acceptance/delivery boundaries.
- `lib/messaging/appointmentLifecycle.ts` and `app/api/admin/appointments/[id]/route.ts` — preserve appointment transaction behavior while allowing automatic work to be suppressed or audited.
- `app/api/admin/messaging/connection/route.ts`, `app/dashboard/SettingsTab.tsx`, `app/dashboard/MessagingSettingsCard.tsx`, `app/dashboard/DashboardClient.tsx` — minimal capability gating and usage visibility.
- `lib/apiError.ts` and affected admin/worker API routes — stable quota/capability errors.
- `tests/messaging-worker.test.ts`, `tests/messaging-operations.test.ts`, `tests/messaging-policy.test.ts`, `tests/appointment-messaging-integration.test.ts`, `tests/critical-logic.test.ts`, and new focused usage/entitlement tests — race, retry, downgrade, period, and preservation contracts.

## Approaches

1. **Atomic monthly counter plus accepted-job idempotency marker** — Add a tenant-period usage document and atomically admit/commit automatic jobs using the existing `MessageJob.idempotencyKey`; commit only on provider acceptance.
   - Pros: smallest data model, fits existing worker and indexes, easy usage display, no external service.
   - Cons: ambiguous provider outcomes need an explicit conservative policy; reservation/release logic must be carefully race-tested.
   - Effort: Medium

2. **Append-only usage ledger with derived monthly totals** — Create one accepted/failure ledger event per job and aggregate monthly usage.
   - Pros: strongest auditability and reconciliation story, flexible future pricing and refunds.
   - Cons: more collections, indexes, aggregation, repair tooling, and more than the requested minimum.
   - Effort: High

3. **Pre-decrement the plan counter before sending** — Atomically decrement available quota, then restore on provider failure.
   - Pros: simple admission check.
   - Cons: loses quota on crashes and ambiguous Meta outcomes, makes retries and recovery unsafe, directly conflicts with the requirement not to lose quota on Meta failure.
   - Effort: Low initially / High operational risk

## Recommendation

Use approach 1 with a dedicated capability resolver and a tenant-period usage document keyed by `(businessId, periodKey)`. Keep plan definitions code-defined initially (with persisted `Business.plan` and an operator-only assignment path), add an explicit business timezone with a deterministic migration default, and classify automatic jobs at the job/domain boundary. The worker should atomically admit an automatic job using its stable idempotency key, call Meta outside any transaction, and atomically commit one accepted usage record only when a provider message id is returned. Definite provider failures release any admission; delivery-unknown jobs are not retried automatically and require a deliberate reconciliation policy. Downgrades should stop/invalidate future automatic work while leaving appointments and manual WhatsApp actions untouched. Expose one small usage/capability read model in billing or messaging settings; UI is advisory, backend enforcement is authoritative.

## Risks

- A successful Meta request followed by a local crash is inherently ambiguous; the current worker already dead-letters this case to prevent duplicate sends, so quota accounting must remain consistent with that policy.
- MongoDB transactions require replica-set-compatible deployment; atomic single-document updates should be preferred for the hot quota path and transaction use kept narrow.
- Existing businesses have no timezone and existing date calculations are inconsistent; a default timezone must be chosen and documented before period keys are persisted.
- A plan downgrade can leave already scheduled jobs above the new limit; invalidation must be scoped to automatic jobs and must not roll back appointment state.
- The current `Business.plan` enum only permits `basic`, and there is no admin identity/role abstraction; adding operator assignment without accidentally exposing tenant mutation is a security boundary.
- The dirty worktree contains changes in overlapping appointment and admin files; implementation must isolate feature edits and preserve those changes exactly.
- The repository lacks `openspec/config.yaml` and main specs, so downstream SDD phases may need OpenSpec initialization/context before proposal/spec generation.

## Ready for Proposal

Yes. The smallest viable architecture and enforcement boundary are identified. The next phase should define the plan/capability vocabulary, provider-acceptance and ambiguous-outcome policy, timezone migration default, downgrade semantics, operator assignment trust boundary, and exact API/UI contracts before implementation.

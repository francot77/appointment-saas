# Exploration: Frontend Reliability Hardening

## Current State

The completed frontend migration is committed at `e8a589e` (`feat(frontend): migrate dashboard feedback and settings UI`). The current worktree contains unrelated changes (`lib/getBusinessBySlug.ts`) and several pre-existing untracked OpenSpec change folders; this exploration does not modify or claim those files. The migrated consumers use source-contract tests and `npm test`; no browser or visual validation is authorized for this change.

The confirmed warnings are implementation-level reliability and semantic issues, not a reason to reopen the visual migration:

1. `EmptyState` assigns the same literal `id` to every rendered instance.
2. `SettingsTab` compares partially normalized slug values and can leave `slugChecking` true after an effect exits early.
3. `ServicesTab` permits overlapping visibility mutations, treats a successful empty mutation response as an error, and clears the list during refresh failures.
4. `MagicLinkClient` starts a new token load without cancelling or invalidating the previous load, allowing stale responses and `finally` handlers to update the current token view.
5. `MessagingSettingsCard` remains hard-coded to slate/English presentation inside the Spanish, semantic-token-owned Settings surface.

## Affected Areas

- `app/components/ui/feedback.tsx` — `EmptyState` owns the duplicate `empty-state-title` identifier; `Dialog` already demonstrates the instance-scoped `useId` pattern.
- `tests/frontend-design-primitives.test.ts` — existing SSR contract test for shared feedback primitives; add an assertion that two `EmptyState` instances receive distinct label references while preserving title/description/action markup.
- `app/dashboard/SettingsTab.tsx` — slug input, debounce effect, availability result, save request, disabled condition, and status announcements are all in one component.
- `tests/settings-tab-public-presentation.test.ts` — existing source contract covers slug endpoints, debounce, cancellation, ownership, disabled behavior, and copy; extend it for canonical comparison and terminal checking-state cleanup.
- `app/dashboard/ServicesTab.tsx` — `toggleActive`, `loadServices`, `handleSubmit`, and `confirmDelete` contain the mutation and refresh lifecycle.
- `tests/services-tab-presentation.test.ts` — existing CRUD source contract; extend it for mutation busy ownership, authoritative refresh behavior, and response parsing that accepts empty successful bodies.
- `app/r/[token]/MagicLinkClient.tsx` — `loadAppointment` is called from the token effect and retry action; its controller currently only times out and is not invalidated on token changes/unmount.
- `tests/client-turn-recovery-presentation.test.ts` — existing recovery source contract; extend it for request identity/abort cleanup without changing appointment persistence, expiry, cancellation, availability, or reschedule contracts.
- `app/dashboard/MessagingSettingsCard.tsx` — independent connection and entitlement state/API owner; migrate only product-owned presentation/copy scope, not its state machine or secret-safe payload behavior.
- `tests/settings-tab-messaging-presentation.test.ts` — existing ownership/copy/API contract; update assertions for the chosen Spanish copy and semantic token classes while keeping the no-props parent boundary.
- `app/dashboard/DashboardClient.tsx` — read-only parent contract; Settings remains rendered as `<SettingsTab />` and Messaging remains internally owned by its card.
- `app/api/admin/slug/route.ts`, `lib/slug.ts`, and service/messaging/appointment routes — read-only server contracts that must continue receiving the same endpoint, method, and semantic payloads.

## Root Causes and Preservation Requirements

### Duplicate EmptyState accessibility IDs

`EmptyState` hard-codes `aria-labelledby="empty-state-title"` and `id="empty-state-title"`. The component is shared by Settings, Services, and MagicLink recovery, so multiple mounted instances can produce duplicate document IDs and an ambiguous accessible-name reference. The safe correction is instance-scoped labeling, following `Dialog`'s existing `useId` approach. Preserve the `section`, `h2`, title text, optional description, and optional action structure.

### SettingsTab slug normalization and stuck state

The availability effect trims the input into `value`, but ownership and button rendering compare `value`/`slug.trim()` with `persistedSlug` without a single canonical representation. Server-normalized values (for example casing or whitespace normalization) can therefore be treated as a different unsaved slug or as an unavailable/stale result. Separately, the effect sets `slugChecking(true)` before the timer, but its empty and owned-slug early returns do not explicitly settle that state; cleanup cancels the timer but does not reset the flag. The implementation must define one canonical client comparison value, use it consistently for ownership, availability display, save gating, and the PATCH body decision, and ensure every effect exit settles checking state. Preserve the 450 ms debounce, cancellation guard, endpoint/method/body contract, conflict/validation/network messages, `OWN` semantics, saved message, and public URL behavior.

### ServicesTab mutation races and refresh resets

`toggleActive` has no per-service or global in-flight guard, so repeated clicks can issue overlapping PATCH requests based on the same stale `service.isActive` value; each success then inverts local state rather than applying an authoritative response. `handleSubmit` and `confirmDelete` refresh through `loadServices`, but `loadServices` clears `services` on any refresh failure, turning a transient refresh error into an empty-looking list and potentially resetting the editing context. All mutation paths unconditionally call `res.json()`, so a valid `204 No Content` or otherwise empty successful response throws before the success branch and is reported as a failure. Preserve CRUD URLs, methods, request bodies, form reset semantics after confirmed success, delete focus restoration, Spanish copy, tenant accent ownership, and the existing loading/error/empty branches. Prefer a small response helper that tolerates empty successful bodies and an explicit busy/refresh policy over broad state extraction.

### MagicLinkClient token/request race

Each `loadAppointment` creates an `AbortController`, but the effect cleanup does not abort the prior request and no request identity is checked before state updates. When `token` changes or retry overlaps a prior load, an older response can replace the current appointment, date, error, saved entry, or `loading` state; an older `finally` can also hide the newer request's loading state. Preserve the 10-second timeout, retry behavior, expired-token cleanup, appointment persistence, all Spanish copy, and cancellation/availability/reschedule APIs. The correction must cancel or invalidate superseded loads and gate all state/storage effects to the current request; it must not broaden into a browser-dialog or visual change.

### MessagingSettingsCard copy and semantic-token scope

The card is rendered inside `SettingsTab` but its root and all descendants use hard-coded `slate-*` utilities, while the surrounding owner surface uses product semantic variables. Its owner-facing labels and feedback are English in an otherwise Spanish dashboard. This is a scope/ownership inconsistency: product canvas/surface/content/border/action/status semantics belong to the shared product tokens, while the card's connection data and tenant-independent messaging state remain card-owned. Preserve the no-props composition, independent connection/entitlement fetches, write-only access-token behavior, normalized view model, entitlement presentation, messaging PUT body, disabled semantics, and template event ordering. The implementation should translate visible owner copy without changing its meaning or API errors unless the project establishes a broader copy policy.

## Dependency-Ordered Slice Plan

Each slice is an autonomous feature-branch-chain review unit with a low projected authored diff and a focused `npm test` verification. No slice includes browser work, screenshots, visual regression tooling, or production behavior unrelated to its warning.

| Order | Slice | Files and boundary | Forecast | Depends on |
|---|---|---|---:|---|
| 1 | Instance-safe EmptyState semantics | `feedback.tsx` plus `frontend-design-primitives.test.ts`; use generated IDs only. | 30–70 lines | None |
| 2 | Canonical Settings slug lifecycle | `SettingsTab.tsx` plus `settings-tab-public-presentation.test.ts`; normalize once, settle checking state on every path, retain request/copy contracts. | 90–170 lines | Slice 1 |
| 3 | Services mutation reliability | `ServicesTab.tsx` plus `services-tab-presentation.test.ts`; guard overlapping toggles, tolerate empty success bodies, and keep stale list data on refresh failure while exposing the error. | 120–220 lines | Slice 1 |
| 4 | Token-scoped MagicLink loading | `MagicLinkClient.tsx` plus `client-turn-recovery-presentation.test.ts`; abort/invalidate superseded appointment loads and gate stale effects. | 70–150 lines | Slice 1 |
| 5 | Messaging owner-surface semantics | `MessagingSettingsCard.tsx` plus `settings-tab-messaging-presentation.test.ts`; replace product-owned slate utilities and translate visible copy, with independent state/API ownership unchanged. | 120–230 lines | Slices 1–2 |

Every forecast is below the 400-line review budget. The slices should remain separate even if implementation is small: Slice 1 is a shared accessibility prerequisite; Slices 2–4 have independent rollback boundaries; Slice 5 depends on the already-migrated Settings composition and must not be coupled to main Settings saving.

## Approaches

1. **Warning-bounded reliability slices (recommended)** — fix one ownership/state boundary at a time, adding only focused source/SSR contracts beside each production change.
   - Pros: smallest rollback units; preserves existing API and copy contracts; makes each race and semantic fix independently reviewable; stays well below 400 authored lines.
   - Cons: the dashboard may temporarily contain mixed copy/token treatment until Slice 5 lands.
   - Effort: Medium.

2. **Cross-cutting hardening rewrite** — extract shared async/request helpers and restyle all warning surfaces together.
   - Pros: potentially fewer local patterns.
   - Cons: couples unrelated state machines, obscures race fixes, risks changing request payloads and ownership, and makes the review budget and rollback boundary harder to prove.
   - Effort: High.

3. **Tests-only warning suppression** — extend source-contract tests without changing production behavior.
   - Pros: minimal diff.
   - Cons: cannot resolve duplicate IDs, stale responses, stuck indicators, empty-body false failures, or semantic scope; would encode known defects instead of hardening them.
   - Effort: Low, but insufficient.

## Recommendation

Proceed with the five dependency-ordered warning slices. Start with instance-safe `EmptyState`, then harden Settings slug state, Services mutations, and MagicLink token loading as separate reliability units; finish with the Messaging card's product-owned semantic presentation and Spanish owner copy. Use strict TDD with `npm test`, preserve all listed endpoints, methods, bodies, labels/meaning, state ownership, focus behavior, tenant accent boundaries, and route/navigation semantics. Explicitly exclude browser validation and any visual claims; source/SSR tests can prove contracts only.

## Risks

- Canonical slug normalization must match the server's accepted representation; do not invent a divergent slug policy or silently alter existing persisted URLs.
- Services response handling must distinguish empty successful bodies from malformed non-empty error bodies and must not hide an existing list during refresh failure.
- Mutation guards must prevent double submission without disabling unrelated service operations or changing delete-dialog focus behavior.
- Request cancellation alone is insufficient if a response resolves concurrently; identity checks are still required before state, storage, and loading updates.
- Messaging copy translation is a product-facing change; preserve meaning and keep API/server error strings untouched unless explicitly authorized by the proposal.
- Existing test style is mostly source/SSR contract testing; it does not prove real browser races, focus, responsive layout, contrast, or visual appearance.
- The repository has no `openspec/config.yaml`; use the cached preflight: Automatic OpenSpec, strict TDD, `npm test`, force-chained delivery, and 400-line review budget.

## Ready for Proposal

Yes. The proposal should authorize exactly these five bounded slices, carry the preservation requirements and low per-slice budget forecasts, state that browser/visual validation is intentionally excluded, and keep the unrelated `lib/getBusinessBySlug.ts` worktree change outside the implementation boundary.

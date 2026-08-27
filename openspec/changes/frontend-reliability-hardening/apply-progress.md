# Apply Progress: Frontend Reliability Hardening

## Slice 1: Shared EmptyState

- [x] 1.1 RED: Added an SSR contract rendering two `EmptyState` instances and asserting distinct, correctly linked title IDs with preserved descriptions and actions.
- [x] 1.2 GREEN: Added instance-scoped `useId` labeling in `app/components/ui/feedback.tsx` without changing `EmptyStateProps` or markup slots.
- [x] 1.3 REFACTOR/VERIFY: Confirmed the public API and section/title structure remain unchanged; all required checks passed and authored changes remain below 400 lines.

## Slice 2: Settings Slug Lifecycle

- [x] 2.1 RED: Added source-contract assertions for shared normalization, canonical ownership/query/PATCH values, disabled save gating, and checking settlement; focused run failed 2 tests before production changes.
- [x] 2.2 GREEN: Reused `normalizeSlugInput` for the candidate, owned comparison, public URL, save gating, response state, and PATCH body; settled checking on empty/owned/cleanup paths while preserving debounce, cancellation, copy, and API contracts.
- [x] 2.3 REFACTOR/VERIFY: Removed raw slug comparisons and retained the existing component/parent boundary; focused and full checks passed with the slice below 400 authored changed lines.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `tests/frontend-design-primitives.test.ts` | SSR unit | 5/5 passed | Written; focused run failed on duplicate IDs | 6/6 passed | Two instances with distinct optional content paths | Clean |
| 1.2 | `tests/frontend-design-primitives.test.ts` | SSR unit | 6/6 passed | Existing RED test | 6/6 passed | Same test exercises both generated IDs and preserved slots | Clean |
| 1.3 | `tests/frontend-design-primitives.test.ts` | SSR unit | 6/6 passed | N/A | 6/6 focused and 142/142 full passed | N/A: verification task | Clean |
| 2.1 | `tests/settings-tab-public-presentation.test.ts` | Source contract | 4/4 passed | Written; focused run failed on missing canonicalization and settlement | 6/6 passed | Canonical ownership and distinct-candidate paths | Clean |
| 2.2 | `tests/settings-tab-public-presentation.test.ts` | Source contract | 6/6 passed | Existing RED tests | 6/6 passed | Empty, owned, and superseded cleanup markers | Clean |
| 2.3 | `tests/settings-tab-public-presentation.test.ts` | Source contract | 6/6 passed | N/A | 6/6 focused and full suite passed | N/A: verification task | Clean |

## Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test | `npm test -- --run tests/frontend-design-primitives.test.ts` — exit 0, 1 file / 6 tests passed |
| Runtime harness | N/A — browser/runtime interaction is explicitly excluded; SSR markup contract is covered |
| Full regression | `npm test` — exit 0, 25 files / 142 tests passed |
| TypeScript | `npx tsc --noEmit` — exit 0 |
| Scoped lint | `npx eslint app/components/ui/feedback.tsx tests/frontend-design-primitives.test.ts` — exit 0 |
| Diff check | `git diff --check` — exit 0 |
| Rollback boundary | Revert `app/components/ui/feedback.tsx`, `tests/frontend-design-primitives.test.ts`, and this Slice 1 task/progress update; unrelated `lib/getBusinessBySlug.ts` remains untouched |

### Slice 2 Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test | `npm test -- --run tests/settings-tab-public-presentation.test.ts` — exit 0, 1 file / 6 tests passed |
| Runtime harness | N/A — browser/runtime interaction is explicitly excluded; source contract covers the boundary |
| Full regression | `npm test` — exit 0, 25 files / 144 tests passed |
| TypeScript | `npx tsc --noEmit` — exit 0 |
| Scoped lint | `npx eslint app/dashboard/SettingsTab.tsx tests/settings-tab-public-presentation.test.ts` — exit 0 |
| Diff check | `git diff --check` — exit 0 |
| Rollback boundary | Revert `app/dashboard/SettingsTab.tsx`, `tests/settings-tab-public-presentation.test.ts`, and Slice 2 task/progress updates; Slice 1 and unrelated `lib/getBusinessBySlug.ts` remain untouched |

## Scope and Status

- Slice 1 changed production file: `app/components/ui/feedback.tsx`; focused test: `tests/frontend-design-primitives.test.ts`.
- Slice 2 changed production file: `app/dashboard/SettingsTab.tsx`; focused test: `tests/settings-tab-public-presentation.test.ts`.
- No browser, visual, consumer, API, or unrelated behavior changes were made in either reliability slice.
- Slice 1 complete; Slices 2–5 and Phase 6 remain pending.
- PR boundary: PR1 / tracker, feature-branch-chain; authored diff is 33 changed lines including the focused test and production change, below the 400-line budget.
- Slice 2 complete; Slices 3–5 and Phase 6 remain pending.
- PR boundary: PR2 / PR1, feature-branch-chain; canonical slug lifecycle only, below the 400-line budget.

## Slice 3: Services Mutation Reliability

- [x] 3.1 RED: Added source-contract coverage for same-service toggle exclusion, independent pending IDs, empty mutation responses, authoritative refreshes, and retained list/edit context; focused run failed 3 tests before production changes.
- [x] 3.2 GREEN: Added a local optional mutation-response parser, per-service pending toggle ref/state, authoritative refreshes after successful mutations, and boolean refresh reporting that retains existing services and form context on refresh failure.
- [x] 3.3 REFACTOR/VERIFY: Kept CRUD endpoints, methods, payloads, copy, validation, native dialog/focus behavior, parent brand contract, and presentation unchanged; focused/full checks and gates passed with the slice below 400 authored changed lines.

### Slice 3 TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 3.1 | `tests/services-tab-presentation.test.ts` | Source contract | 5/5 passed | Written; focused run failed 3 tests | 8/8 passed | Duplicate same-service guard, empty response, and refresh-failure paths | Clean |
| 3.2 | `tests/services-tab-presentation.test.ts` | Source contract | 8/8 passed | Existing RED tests | 8/8 passed | Create/edit/toggle/delete mutation paths share tolerant response handling | Clean |
| 3.3 | `tests/services-tab-presentation.test.ts` | Source contract | 8/8 passed | N/A | 8/8 focused and 147/147 full passed | N/A: verification task | Clean |

### Slice 3 Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test | `npm test -- --run tests/services-tab-presentation.test.ts` — exit 0, 1 file / 8 tests passed |
| Runtime harness | N/A — browser/runtime interaction is explicitly excluded; source contract covers the boundary |
| Full regression | `npm test` — exit 0, 25 files / 147 tests passed |
| TypeScript | `npx tsc --noEmit` — exit 0 |
| Scoped lint | `npx eslint app/dashboard/ServicesTab.tsx tests/services-tab-presentation.test.ts` — exit 0, 1 pre-existing exhaustive-deps warning at `ServicesTab.tsx:72` |
| Diff check | `git diff --check` — exit 0 |
| Rollback boundary | Revert `app/dashboard/ServicesTab.tsx`, `tests/services-tab-presentation.test.ts`, and Slice 3 task/progress updates; Slices 1–2 and unrelated `lib/getBusinessBySlug.ts` remain untouched |

## Scope and Status

- Slice 3 changed production file: `app/dashboard/ServicesTab.tsx`; focused test: `tests/services-tab-presentation.test.ts`.
- No browser, visual, consumer, API, dependency, or unrelated behavior changes were made in this slice.
- Slices 1–3 complete; Slices 4–5 and Phase 6 remain pending.
- PR boundary: PR3 / PR2, feature-branch-chain; authored slice diff is 85 changed lines, below the 400-line budget.

## Slice 4: Magic Link Request Ownership

- [x] 4.1 RED: Added source-contract coverage for aborting superseded token/retry loads, cleanup abort, request identity, guarded state/storage/expiry effects, and guarded `finally`; focused run failed 2 tests before production changes.
- [x] 4.2 GREEN: Added an active request identity/controller ref, abort-on-supersession and token cleanup, and current-request guards while preserving the ten-second timeout and all appointment APIs/copy.
- [x] 4.3 REFACTOR/VERIFY: Centralized the current-request predicate locally; focused/full checks and gates passed with the slice below 400 authored changed lines.

### Slice 4 TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 4.1 | `tests/client-turn-recovery-presentation.test.ts` | Source contract | 8/8 passed | Written; focused run failed 2 tests | 10/10 passed | Superseded request and guarded effect paths | Clean |
| 4.2 | `tests/client-turn-recovery-presentation.test.ts` | Source contract | 10/10 passed | Existing RED tests | 10/10 passed | Token change and retry ownership markers | Clean |
| 4.3 | `tests/client-turn-recovery-presentation.test.ts` | Source contract | 10/10 passed | N/A | 10/10 focused and 149/149 full passed | N/A: verification task | Clean |

### Slice 4 Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test | `npm test -- --run tests/client-turn-recovery-presentation.test.ts` — exit 0, 1 file / 10 tests passed |
| Runtime harness | N/A — browser/runtime interaction is explicitly excluded; source contract covers the ownership boundary |
| Full regression | `npm test` — exit 0, 25 files / 149 tests passed |
| TypeScript | `npx tsc --noEmit` — exit 0 |
| Scoped lint | `npx eslint app/r/[token]/MagicLinkClient.tsx tests/client-turn-recovery-presentation.test.ts` — exit 0 |
| Diff check | `git diff --check` — exit 0 |
| Rollback boundary | Revert `app/r/[token]/MagicLinkClient.tsx`, `tests/client-turn-recovery-presentation.test.ts`, and Slice 4 task/progress updates; Slices 1–3 and unrelated worktree changes remain untouched |

## Scope and Status

- Slice 4 changed production file: `app/r/[token]/MagicLinkClient.tsx`; focused test: `tests/client-turn-recovery-presentation.test.ts`.
- No browser, visual, consumer, API, storage-policy, appointment-management, or unrelated behavior changes were made in this slice.
- Slices 1–4 complete; Slice 5 and Phase 6 remain pending.
- PR boundary: PR4 / PR3, feature-branch-chain; authored slice diff is below the 400-line budget.

## Slice 5: Messaging Presentation

- [x] 5.1 RED: Extended `tests/settings-tab-messaging-presentation.test.ts` with Spanish owner copy, semantic-token, server-error passthrough, and connection-state assertions; focused run failed 2 tests before production changes.
- [x] 5.2 GREEN: Replaced only `MessagingSettingsCard` product presentation classes and visible owner copy with Spanish text and existing semantic tokens; preserved props, independent state, normalized view, entitlement behavior, fields, disabled predicate, endpoints, PUT body, and write-only token behavior.
- [x] 5.3 REFACTOR/VERIFY: Confirmed no product-owned slate/red/emerald/indigo utilities remain in the card; focused/full checks and gates passed with the slice below 400 authored changed lines.

### Slice 5 TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 5.1 | `tests/settings-tab-messaging-presentation.test.ts` | Source contract | 4/4 passed | Written; focused run failed 2 tests | 5/5 passed | Added distinct copy/token and server-error/state cases; 6/6 passed | Clean |
| 5.2 | `tests/settings-tab-messaging-presentation.test.ts` | Source contract | 5/5 passed | Existing RED tests | 6/6 passed | Independent save/API and state/presentation paths | Clean |
| 5.3 | `tests/settings-tab-messaging-presentation.test.ts` | Source contract | 6/6 passed | N/A | 6/6 focused and 151/151 full passed | N/A: verification task | Clean |

### Slice 5 Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test | `npm test -- --run tests/settings-tab-messaging-presentation.test.ts` — exit 0, 1 file / 6 tests passed |
| Runtime harness | N/A — browser/runtime interaction and visual validation are explicitly excluded; source contract covers presentation and API boundaries |
| Full regression | `npm test` — exit 0, 25 files / 151 tests passed |
| TypeScript | `npx tsc --noEmit` — exit 0 |
| Scoped lint | `npx eslint app/dashboard/MessagingSettingsCard.tsx tests/settings-tab-messaging-presentation.test.ts` — exit 0 |
| Diff check | `git diff --check` — exit 0 |
| Authored diff | 56 changed lines in the Slice 5 production/test pair, below the 400-line budget |
| Rollback boundary | Revert `app/dashboard/MessagingSettingsCard.tsx`, `tests/settings-tab-messaging-presentation.test.ts`, and Slice 5 task/progress updates; Slices 1–4 and unrelated worktree changes remain untouched |

## Scope and Status

- Slice 5 changed production file: `app/dashboard/MessagingSettingsCard.tsx`; focused test: `tests/settings-tab-messaging-presentation.test.ts`.
- No browser, visual, API, state-ownership, entitlement, template, dependency, or unrelated behavior changes were made in this slice.
- Slices 1–5 and Phase 6 complete; ready for `sdd-verify`.
- PR boundary: PR5 / PR4, feature-branch-chain; Spanish semantic messaging presentation only, below the 400-line budget.

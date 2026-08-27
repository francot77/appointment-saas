# Tasks: Frontend Reliability Hardening

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated authored lines | 430–840 total; 30–230 per slice |
| 400-line budget risk | High overall; Low per slice |
| Chained PRs recommended | Yes |
| Suggested split | PR1 EmptyState → PR2 Settings → PR3 Services → PR4 Magic Link → PR5 Messaging |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit / base | Goal | Focused test | Runtime harness | Rollback boundary |
|---|---|---|---|---|
| PR1 / tracker | Unique `EmptyState` IDs | `npx vitest run tests/frontend-design-primitives.test.ts` | N/A: browser excluded; SSR only | `feedback.tsx` + its test |
| PR2 / PR1 | Canonical slug lifecycle | `npx vitest run tests/settings-tab-public-presentation.test.ts` | N/A: source contract only | `SettingsTab.tsx` + its test |
| PR3 / PR2 | Reliable service mutations | `npx vitest run tests/services-tab-presentation.test.ts` | N/A: source contract only | `ServicesTab.tsx` + its test |
| PR4 / PR3 | Token-scoped loading | `npx vitest run tests/client-turn-recovery-presentation.test.ts` | N/A: source contract only | `MagicLinkClient.tsx` + its test |
| PR5 / PR4 | Spanish semantic messaging | `npx vitest run tests/settings-tab-messaging-presentation.test.ts` | N/A: source contract only | `MessagingSettingsCard.tsx` + its test |

## Phase 1: Shared EmptyState

- [x] 1.1 RED: extend `tests/frontend-design-primitives.test.ts` to render two instances and require distinct, correctly linked title IDs plus preserved optional slots.
- [x] 1.2 GREEN: update `app/components/ui/feedback.tsx` with `useId`-scoped `EmptyState` labeling; run the focused test.
- [x] 1.3 REFACTOR/VERIFY: keep `EmptyStateProps` unchanged; run `npm test` and confirm PR1 stays below 400 lines.

## Phase 2: Settings Slug Lifecycle

- [x] 2.1 RED: extend `tests/settings-tab-public-presentation.test.ts` for server-compatible canonical ownership/query/PATCH behavior and checking settlement on every exit.
- [x] 2.2 GREEN: update `app/dashboard/SettingsTab.tsx` to reuse `normalizeSlugInput`, invalidate superseded checks, and submit the canonical candidate without changing debounce/copy/contracts.
- [x] 2.3 REFACTOR/VERIFY: remove duplicate raw comparisons; run focused test and `npm test`; keep PR2 below 400 lines.

## Phase 3: Services Mutation Reliability

- [x] 3.1 RED: extend `tests/services-tab-presentation.test.ts` for same-service mutation exclusion, empty successful bodies, authoritative refresh, and retained list/edit context on refresh failure.
- [x] 3.2 GREEN: update `app/dashboard/ServicesTab.tsx` with local optional-response handling, per-service pending IDs, and success-reporting refresh logic while preserving CRUD/focus/copy.
- [x] 3.3 REFACTOR/VERIFY: keep unrelated service actions independent; run focused test and `npm test`; keep PR3 below 400 lines.

## Phase 4: Magic Link Request Ownership

- [x] 4.1 RED: extend `tests/client-turn-recovery-presentation.test.ts` for token/retry supersession, cleanup abort, identity-gated state/storage, and guarded `finally`.
- [x] 4.2 GREEN: update `app/r/[token]/MagicLinkClient.tsx` with active request identity and controller cleanup while retaining the ten-second timeout and all appointment APIs/copy.
- [x] 4.3 REFACTOR/VERIFY: centralize the current-request predicate locally; run focused test and `npm test`; keep PR4 below 400 lines.

## Phase 5: Messaging Presentation

- [x] 5.1 RED: update `tests/settings-tab-messaging-presentation.test.ts` to require Spanish visible copy and semantic tokens while locking props, state, events, endpoints, payload, and disabled behavior.
- [x] 5.2 GREEN: change only copy/classes in `app/dashboard/MessagingSettingsCard.tsx`; preserve server error passthrough and all API/state behavior.
- [x] 5.3 REFACTOR/VERIFY: remove product-owned slate/red/emerald/indigo utilities; run focused test and `npm test`; keep PR5 below 400 lines.

## Phase 6: Final Gates

- [x] 6.1 Run `npx tsc --noEmit` and scoped lint over the ten changed implementation/test files.
- [x] 6.2 Run `git diff --check`, verify exact file scope, and record authored additions plus deletions for every PR.
- [x] 6.3 Record focused/full results and browser N/A in verification evidence; do not claim visual or runtime interaction guarantees.

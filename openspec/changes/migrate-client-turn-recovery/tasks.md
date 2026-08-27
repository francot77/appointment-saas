# Tasks: Migrate Client Turn Recovery

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 220–340 authored additions + deletions |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | PR1 `MagicLinkClient` → PR2 `turno-actualizado` |
| Delivery strategy | force-chained |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Migrate client recovery presentation and establish the source contract | PR1; base = feature/tracker branch | `npx vitest run tests/client-turn-recovery-presentation.test.ts` | N/A: no browser harness is authorized; source/Node evidence only | Revert `MagicLinkClient.tsx` and the new focused test |
| 2 | Migrate result presentation and extend the same contract | PR2; base = PR1 branch | `npx vitest run tests/client-turn-recovery-presentation.test.ts` | N/A: browser/visual evidence is deferred | Revert `turno-actualizado/page.tsx` and its test additions |

## Phase 1: PR1 — Client Presentation (strict TDD)

- [x] 1.1 **RED:** Create `tests/client-turn-recovery-presentation.test.ts` with the existing Vitest/Node `readFileSync` convention; assert primitive imports/mapping, Editorial-light classes, unchanged copy, APIs, storage calls, handlers, state transitions, `window.confirm`, query forwarding, redirect, and forbidden production scope. Run the focused command and record the expected failure.
- [x] 1.2 **GREEN:** In `app/r/[token]/MagicLinkClient.tsx`, change imports and returned JSX/classes only: map loading/error/empty/status/success to `LoadingState`/`Alert`/`EmptyState`/`Status`; preserve every endpoint, body, timeout, persistence/removal, retry, copy, setter, disabled branch, native confirm, tenant identity/accent boundary, and no-slug behavior.
- [x] 1.3 **REFACTOR:** Run `npx vitest run tests/client-turn-recovery-presentation.test.ts`, `npm test`, `npx tsc --noEmit`, and `npm run lint`; inspect `git diff --word-diff=plain` and `git diff --numstat`, confirming `<400` changed lines and only PR1 files.

## Phase 2: PR2 — Updated-Turn Result (strict TDD)

- [x] 2.1 **RED:** Extend the focused test before production edits for light result composition, semantic success `Alert`, unchanged copy/optional summaries, tenant identity/accent ownership, return href, `notFound`, canonical redirect, and all five forwarded query parameters; run the focused command and record failure.
- [x] 2.2 **GREEN:** In `app/[slug]/turno-actualizado/page.tsx`, change only imports and returned JSX/classes; preserve server loading, `notFound`, canonical slug redirect, query forwarding, business identity/accent, summaries, copy, and `/:slug` link. Do not touch `turno-recibido`.
- [x] 2.3 **REFACTOR:** Run focused Vitest, `npm test`, `npx tsc --noEmit`, and `npm run lint`; run `git diff --name-only`/`--numstat` against PR1, verify `<400`, and confirm exactly two production consumers plus one focused test.

## Phase 3: Delivery and Rollback

- [ ] 3.1 Keep the forced Feature Branch Chain: PR1 targets the tracker branch; PR2 targets the PR1 branch; retarget/rebase polluted diffs before review.
- [ ] 3.2 Roll back PR2 first, then PR1 if needed; no API, data, storage, dependency, configuration, or shared-primitive rollback is required.

## Evidence Boundary

Source/Node checks do not prove browser focus, responsive layout, contrast, visual appearance, localStorage interaction, native confirmation, announcements, or navigation. Record these as deferred; production build remains subject to `BILLING_PRICE_NOT_CONFIGURED`.

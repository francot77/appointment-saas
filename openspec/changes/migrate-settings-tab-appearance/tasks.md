# Tasks: Migrate Settings Tab Appearance

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 100–180 authored lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | One bounded feature-branch-chain work unit |
| Delivery strategy | auto-chain (force-chained workflow retained) |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Migrate appearance presentation with static preservation evidence | One feature-chain slice | `npx vitest run tests/settings-tab-appearance-presentation.test.ts` | N/A: Node-only Vitest; no browser harness | Revert exactly `SettingsTab.tsx` and the focused test |

## Phase 1: RED — Contract Evidence

- [x] 1.1 Create `tests/settings-tab-appearance-presentation.test.ts`; extract the appearance section and assert semantic tokens, no product `slate` classes, presets, raw color values, generic `update`, all background branches, always-visible `logoUrl`, PUT payload, save/error/copy markers, no-props parent usage, deferred boundaries, and absence of readability logic.
- [x] 1.2 Run the focused Vitest command and record the expected failure on legacy-dark appearance classes; confirm only the new test is added.

## Phase 2: GREEN — Minimal Presentation Migration

- [x] 2.1 In `app/dashboard/SettingsTab.tsx`, change only product-owned appearance surfaces, borders, content, muted content, fields, and focus classes to the existing semantic variables; preserve labels, copy, inline tenant swatches, presets, identifiers, updates, and conditional `solid`/`gradient`/`image` controls.
- [x] 2.2 Keep `update`, complete `JSON.stringify(settings)` submission, API method/headers, save/error transitions, copy behavior, parent `<SettingsTab />`, public-consumer readability ownership, messaging, and sticky-save boundaries unchanged; modify no other file.
- [x] 2.3 Run the focused test and confirm GREEN.

## Phase 3: REFACTOR — Bounded Verification

- [x] 3.1 Refactor only if needed for readability without changing selectors or behavior; run `npm test`, `npx tsc --noEmit`, `npm run lint`, and `git diff --check`.
- [x] 3.2 Enforce scope and budget: `git diff --name-only <slice-base>...HEAD` lists exactly the two allowed files and `git diff --numstat` remains below 400 additions plus deletions.
- [x] 3.3 Report static-contract proof only; browser appearance, responsiveness, focus rendering, visual contrast, and public runtime readability remain unverified and deferred.

## Rollback and Scope Gates

- [x] 4.1 Roll back by reverting the two-file slice; do not revert APIs, models, shared primitives, public consumers, parent wiring, messaging, or sticky-save behavior.
- [x] 4.2 Defer messaging, sticky save/status, live preview, validation, contrast/readability logic, extraction, browser harnesses, and every other file.

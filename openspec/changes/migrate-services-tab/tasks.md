# Tasks: Migrate Services Tab

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 180–300 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single feature-branch-chain slice |
| Delivery strategy | auto-chain (cached force-chained intent) |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Migrate ServicesTab presentation with source-contract proof | Single PR | `npx vitest run tests/services-tab-presentation.test.ts` | N/A: no browser harness is authorized; source tests cannot prove rendering, native-dialog interaction, or focus | Revert exactly `app/dashboard/ServicesTab.tsx` and `tests/services-tab-presentation.test.ts` |

## Phase 1: RED — Contract Test First

- [x] 1.1 Create `tests/services-tab-presentation.test.ts` using the Node/Vitest `readFileSync` convention; assert primitive imports/usages, loading/empty/error/status mappings, light semantic tokens, and no `Dialog` import.
- [x] 1.2 Add failing preservation/isolation contracts for GET/POST/PATCH/DELETE paths, methods/bodies, normalization, validation attributes, Spanish copy, saving/toggle/reset behavior, `brand`, native `<dialog>`/refs/focus markers, and the exact two-file scope.
- [x] 1.3 Run `npx vitest run tests/services-tab-presentation.test.ts`; record RED failures before editing production code.

## Phase 2: GREEN — Presentation Migration

- [x] 2.1 Modify only `app/dashboard/ServicesTab.tsx`: import and use `Alert`, `Status`, `LoadingState`, and `EmptyState` without changing conditions, state ownership, handlers, effects, API calls, or copy.
- [x] 2.2 Replace non-dialog legacy-dark surfaces with existing light semantic token classes; keep tenant colors only on the existing submit action and service-color decoration, and map active/hidden states to semantic `Status` tones.
- [x] 2.3 Preserve CRUD/API/validation/copy/state transitions, saving labels/disabled behavior, native delete dialog markup, soft-delete flow, cancel/close behavior, and trigger-focus restoration; do not touch `SettingsTab` or any other file.
- [x] 2.4 Run `npx vitest run tests/services-tab-presentation.test.ts` and require GREEN.

## Phase 3: REFACTOR — Bounded Verification

- [x] 3.1 Review the diff for JSX/class-only production changes, unchanged dialog suffix, no forbidden dark classes before `{deleteTarget && (`, and authored changes below 400 lines.
- [x] 3.2 Run `npm test`, `npx tsc --noEmit`, and `npm run lint`; run `git diff --name-only` and `git diff --numstat` to verify exactly the two files and budget.
- [x] 3.3 Report source-contract evidence only; explicitly leave browser rendering, responsive layout, contrast, announcements, native dialog interaction, and focus behavior unverified. Roll back both files together if gates fail.

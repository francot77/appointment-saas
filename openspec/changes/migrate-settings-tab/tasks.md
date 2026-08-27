# Tasks: Migrate Settings Tab Public Presentation

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 220–330 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | One feature-branch-chain slice |
| Delivery strategy | auto-chain (cached force-chained strategy) |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Migrate public/business and slug presentation with static preservation proof | Single PR | `npx vitest run tests/settings-tab-public-presentation.test.ts` | N/A: no browser harness is authorized; source tests cannot prove visual, focus, sticky, or contrast behavior | Revert exactly `app/dashboard/SettingsTab.tsx` and `tests/settings-tab-public-presentation.test.ts` |

## Phase 1: RED — Contract Test First

- [x] 1.1 Create `tests/settings-tab-public-presentation.test.ts` with Node/Vitest `readFileSync` section extraction; assert `Alert`, `EmptyState`, `LoadingState`, and `Status` imports/usages, light semantic tokens, and no legacy-dark classes in migrated sections.
- [x] 1.2 Add failing contracts for loading/unavailable/error/setup/slug feedback conditions, unchanged Spanish copy/live regions, public/business IDs and `aboutEnabled`, and URL preview/copy behavior.
- [x] 1.3 Add failing preservation/isolation contracts for settings GET/PUT and full body, slug GET/availability/PATCH, encoding, `450` debounce, cancellation, `OWN`, mappings, disabled predicates, save transitions, no-props export, raw tenant inputs, and deferred boundaries.
- [x] 1.4 Run `npx vitest run tests/settings-tab-public-presentation.test.ts`; retain the expected RED presentation-contract failure before production edits.

## Phase 2: GREEN — Section-Bounded Presentation

- [x] 2.1 Modify only `app/dashboard/SettingsTab.tsx`: import the four existing feedback primitives and map initial loading, unavailable settings, load failure, setup, slug checking/availability/error/success to their existing contracts without changing conditions or copy.
- [x] 2.2 Replace legacy-dark classes only in the header/preview, public-page, about/contact, and slug-sharing sections with existing `--color-canvas`, `--color-surface`, `--color-surface-muted`, `--color-content`, `--color-content-muted`, `--color-border`, `--color-action`, and `--color-focus` semantic classes.
- [x] 2.3 Preserve all state, effects, handlers, validation, debounce/cancellation, API paths/methods/headers/bodies, slug ownership, labels, tenant inputs, clipboard behavior, save/error/success transitions, and the no-props `<SettingsTab />` contract; do not extract components or edit dependencies.
- [x] 2.4 Run `npx vitest run tests/settings-tab-public-presentation.test.ts` and require GREEN.

## Phase 3: REFACTOR — Bounded Verification

- [x] 3.1 Simplify assertions/classes without broadening scope; confirm appearance/theme, messaging, sticky save bar, tenant readability helpers, shared primitives, APIs, parent, copy, and every other file remain unchanged.
- [x] 3.2 Run `npm test`, `npx tsc --noEmit`, `npm run lint`, `git diff --check`, and scope/budget checks: exactly the two files and authored additions plus deletions below 400.
- [x] 3.3 Report source-contract evidence only; explicitly leave browser appearance, responsive layout, focus/accessibility interaction, sticky positioning, and tenant contrast unverified. If any gate fails, revert the two-file slice together.

## Explicit Deferrals

Appearance/theme, messaging, sticky save/status, tenant readability helpers, copy changes, extraction, API/shared-primitive/token changes, browser harness work, and all other files are deferred.

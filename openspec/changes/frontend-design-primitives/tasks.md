# Tasks: Frontend Design Primitives

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 305–365 authored lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No; this is the authorized PR1 foundation slice |
| Suggested split | Single PR; no consumer migration |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|
| 1 | Three-file contract foundation | `npx vitest run tests/frontend-design-primitives.test.ts` | N/A: SSR-only slice; browser guarantees deferred | Revert exactly the three authorized files |

## Phase 1: RED — Contract Tests

- [x] 1.1 **RED** — Create `tests/frontend-design-primitives.test.ts` with `React.createElement` and `renderToStaticMarkup`; assert product token names/marketing isolation, Alert roles/actions, visible Status, Loading status/polite label, Empty optional content, and Dialog open/closed labeling/modal attributes. Evidence: focused Vitest reached the pre-existing React version mismatch after the test was written. Verify: `npx vitest run tests/frontend-design-primitives.test.ts`.

## Phase 2: GREEN — Foundation

- [x] 2.1 **GREEN** — Modify `app/globals.css` with product-owned `:root` canvas/surface/content/border/action/focus and info/success/warning/danger foreground/background/border variables; leave `.landing-page` byte-for-byte unchanged and never derive status tokens from tenant colors. Verify: token declarations are present; focused execution is blocked before tests collect by the pre-existing React version mismatch.
- [x] 2.2 **GREEN** — Create `app/components/ui/feedback.tsx` with typed presentational `Alert`, `Status`, `LoadingState`, `EmptyState`, and controlled `Dialog`; preserve caller copy/actions, use semantic classes, render no closed Dialog, and provide only explicit close/cancel/confirm slots. Verify: TypeScript passes; focused execution is blocked before tests collect by the pre-existing React version mismatch.

## Phase 3: REFACTOR — Proof and Boundary

- [x] 3.1 **REFACTOR** — Simplify duplicated SSR helpers/assertions without changing contracts; keep `Dialog` focus entry/restoration, Escape, backdrop, contrast, responsive, and visual guarantees explicitly deferred. Verify: `npx tsc --noEmit` passes; `npm run lint` retains only pre-existing unrelated findings; `npm test` reports 111 existing tests passing and the new suite blocked by the React version mismatch.
- [x] 3.2 **REFACTOR** — Confirm the authorized implementation boundary and authored budget: no consumer, route, marketing selector, API, copy, state, or configuration changes. Verify: the implementation edits are limited to the three authorized files and the authored slice remains below 400 lines; unrelated pre-existing worktree changes were not modified.

## Guardrails and Rollback

- Product tokens own product meaning; tenant accent may affect only caller-owned accent/background/action presentation and never status semantics.
- No consumer migration, route change, marketing CSS change, browser harness, focus/Escape guarantee, or behavior/API/copy/state change is authorized.
- Roll back by reverting `app/globals.css`, deleting `app/components/ui/feedback.tsx`, and deleting `tests/frontend-design-primitives.test.ts`; unchanged consumers restore prior runtime behavior.

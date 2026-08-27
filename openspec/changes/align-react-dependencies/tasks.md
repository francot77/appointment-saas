# Tasks: Align React Runtime Dependencies

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2-8 manifest/lock lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Align manifests and prove the clean dependency tree | PR 1 | `npm ls react react-dom next` | `npm ci` from repository root | Restore `package.json` and `package-lock.json` together, then `npm ci` |
| 2 | Prove the unchanged SSR and full suites plus static scope | PR 1 | `npx vitest run tests/frontend-design-primitives.test.ts` | `npm test` and `npx tsc --noEmit` | Revert only the two manifest files; no source/test rollback |

## Phase 1: Baseline and RED Evidence

- [x] 1.1 Confirm `package.json` and `package-lock.json` are clean; record `git status --short`, then run `npx vitest run tests/frontend-design-primitives.test.ts` and preserve the known React-mismatch collection failure as RED evidence.
- [x] 1.2 Confirm the authorized boundary is exactly `package.json` and `package-lock.json`; do not edit source, tests, config, audit artifacts, or unrelated dirty files.

## Phase 2: Dependency Configuration (GREEN Enablement)

- [x] 2.1 Run `npm install --save-exact react-dom@19.2.1` from the repository root; retain `react@19.2.1` and `next@16.0.7`, and reject unrelated lockfile churn.
- [x] 2.2 Run `npm ci`, then `npm ls react react-dom next`; require one valid `react@19.2.1`/`react-dom@19.2.1` pair and `next@16.0.7`.

## Phase 3: Strict-TDD Verification

- [x] 3.1 Run `npx vitest run tests/frontend-design-primitives.test.ts`; all five unchanged SSR contract tests must collect and pass.
- [x] 3.2 Run `npm test`; require the complete unchanged Vitest suite to collect and pass.
- [x] 3.3 Run `npx tsc --noEmit` and `npm run lint -- app/components/ui/feedback.tsx tests/frontend-design-primitives.test.ts`; require no new errors.
- [x] 3.4 Run `git diff --name-only` and `git diff -- package.json package-lock.json`; require only the two authorized files and only React DOM metadata changes.

## Phase 4: Rollback and Scope Gate

- [ ] 4.1 If any gate fails or scope expands, stop and run `git restore -- package.json package-lock.json`, then `npm ci` and `npm ls react react-dom next`; never revert only one manifest.
- [x] 4.2 Report `BILLING_PRICE_NOT_CONFIGURED` as unrelated and pre-existing; do not fix billing, build configuration, application source, or any other file in this change.

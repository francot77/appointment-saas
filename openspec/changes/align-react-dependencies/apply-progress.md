# Apply Progress: Align React Runtime Dependencies

**Change**: `align-react-dependencies`
**Mode**: Strict TDD
**Delivery**: Single focused work unit under the cached feature-branch-chain session strategy; review impact is 12 authored manifest lines (6 additions, 6 deletions).

## Completed Tasks

- [x] 1.1 Baseline status captured and the known React mismatch was reproduced: focused suite failed during collection with 0 tests.
- [x] 1.2 Authorized implementation boundary confirmed; unrelated dirty files were preserved.
- [x] 2.1 Exact install upgraded only `react-dom` to `19.2.1`; package diff was limited to the requested root and package metadata.
- [x] 2.2 Clean install and dependency tree validation passed with one aligned React pair and `next@16.0.7`.
- [x] 3.1 Focused SSR suite passed all 5 tests.
- [x] 3.2 Full Vitest suite passed all 116 tests across 20 files.
- [x] 3.3 TypeScript and scoped lint passed.
- [x] 3.4 Scope and diff checks passed; no unrelated manifest or lockfile churn was found.
- [x] 4.2 The known `BILLING_PRICE_NOT_CONFIGURED` build blocker remains unrelated and was not changed.
- [ ] 4.1 Rollback gate was not applicable because no gate failed and scope did not expand.

## TDD Cycle Evidence

This is a dependency-only structural correction. The existing focused SSR contract suite supplied the RED/GREEN behavior gate; no production source or test file was created or modified. Triangulation was provided by the five focused scenarios and the full suite.

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `tests/frontend-design-primitives.test.ts` | Unit / SSR contract | ✅ 111 existing tests | ✅ Existing suite recorded React 19.2.1 / react-dom 19.2.0 collection failure | N/A baseline | N/A baseline | N/A |
| 2.1 | `tests/frontend-design-primitives.test.ts` | Dependency integration | ✅ Baseline captured | ✅ Mismatch reproduced before install | ✅ 5/5 after install | ✅ 5 focused scenarios plus 116 full-suite tests | ➖ None needed |
| 2.2 | `npm ls react react-dom next` | Dependency integrity | N/A | ✅ Invalid mismatch was the RED state | ✅ One `react@19.2.1` / `react-dom@19.2.1` pair and `next@16.0.7` | ✅ Transitive consumers deduped to aligned versions | ➖ None needed |
| 3.1 | `tests/frontend-design-primitives.test.ts` | Unit / SSR contract | ✅ 111 existing tests | ✅ Prior collection failure | ✅ 1 file, 5 tests passed | ✅ Five scenarios executed | ➖ None needed |
| 3.2 | `tests/**/*.test.ts` | Unit / integration suite | ✅ 111 prior tests | ✅ Prior full-suite collection failure | ✅ 20 files, 116 tests passed | ✅ New 5 tests plus existing suite | ➖ None needed |
| 3.3 | N/A | Static | ✅ Existing source unchanged | N/A structural dependency change | ✅ `tsc` and scoped lint exited 0 | N/A | ➖ None needed |
| 3.4 | N/A | Scope gate | ✅ Pre-install status captured | N/A structural scope assertion | ✅ Diff and status checks passed | N/A | ➖ None needed |

## Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `npx vitest run tests/frontend-design-primitives.test.ts` — exit 0; 1 file and 5 tests passed. |
| Runtime harness command/scenario and exact result | `npm ci` — exit 0; clean install reproduced the lockfile. `npm ls react react-dom next` — exit 0; aligned tree reported. |
| Rollback boundary | Restore `package.json` and `package-lock.json` together, then run `npm ci`; no source, test, or audit rollback is needed. |

## Verification Results

| Command | Result |
|---|---|
| `npm install --save-exact react-dom@19.2.1` | Passed; changed one package. |
| `npm ci` | Passed; 435 packages installed. |
| `npm ls react react-dom next` | Passed; `react@19.2.1`, `react-dom@19.2.1`, `next@16.0.7`. |
| `npx vitest run tests/frontend-design-primitives.test.ts` | Passed; 5/5. |
| `npm test` | Passed; 20 files, 116/116 tests. |
| `npx tsc --noEmit` | Passed; exit 0. |
| `npm run lint -- app/components/ui/feedback.tsx tests/frontend-design-primitives.test.ts` | Passed; exit 0. |
| `git diff --check` and scoped diff review | Passed; only the requested React DOM metadata changed in the two manifests. |

## Scope and Risks

- Implementation changes are limited to `package.json` and `package-lock.json`; `tasks.md` and this progress artifact are SDD bookkeeping requested for apply.
- Existing unrelated dirty files and prior OpenSpec artifacts were preserved.
- The prior `npm run build` failure caused by `BILLING_PRICE_NOT_CONFIGURED` remains out of scope and was not rerun or changed.
- npm reported 15 existing audit vulnerabilities during install and clean install; no audit remediation was requested.

## Status

Ready for `sdd-verify`.

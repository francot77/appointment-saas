# Design: Align React Runtime Dependencies

## Technical Approach

Make a dependency-only correction: change exact `react-dom` from `19.2.0` to `19.2.1`, retain `react@19.2.1` and `next@16.0.7`, and let npm 11 regenerate lockfile v3 metadata. The apply boundary is exactly `package.json` and `package-lock.json`; application source, tests, configuration, behavior, and prior SDD artifacts remain unchanged.

Before installation, require both target manifests to be clean and capture the existing unrelated `git status --short`. Run `npm install --save-exact react-dom@19.2.1`, then reject the result unless the lock diff is limited to the root `react-dom` declaration and `node_modules/react-dom` version, tarball URL, integrity, and React peer metadata produced by npm.

## Architecture Decisions

| Decision | Alternatives | Rationale |
|---|---|---|
| Align both runtime packages at exact `19.2.1` by upgrading only `react-dom` | Downgrade React; use ranges; update React/Next broadly | This is the smallest reproducible change, satisfies `react-dom@19.2.1`'s React peer contract, and remains inside Next.js 16.0.7's `^19.0.0` peer range. |
| Regenerate with `npm install --save-exact`, never hand-edit the lock | Edit integrity manually; use `npm update` | npm owns tarball and integrity metadata; an exact package install avoids unrelated dependency resolution. |
| Treat a two-file scoped diff as an admission gate | Accept npm's complete lock rewrite | The authorized slice has no reason to alter other packages, scripts, or source. Unexpected churn is a failure to investigate, not output to normalize. |
| Verify tests without requiring a production build | Fold the billing failure into this change | `BILLING_PRICE_NOT_CONFIGURED` occurs during `/` prerender and is independent of React patch alignment; resolving it here would expand scope and behavior risk. |

## Dependency and Verification Flow

```text
package.json exact pin
        -> npm registry metadata
        -> package-lock.json v3
        -> npm ci reproducible tree
        -> focused SSR suite -> full suite -> TypeScript -> scoped diff
```

Verification order is fixed:

1. Run `npm install --save-exact react-dom@19.2.1`; inspect lock integrity with `npm ci` and confirm `npm ls react react-dom next` reports one valid `react@19.2.1` / `react-dom@19.2.1` pair and `next@16.0.7`.
2. Run `npx vitest run tests/frontend-design-primitives.test.ts`; all five existing SSR contract tests must collect and pass unchanged.
3. Run `npm test`; the complete Vitest suite must pass.
4. Run `npx tsc --noEmit`, followed by scoped lint for the unchanged primitive module and test.
5. Run `git diff -- package.json package-lock.json` and compare final `git status --short` with the pre-install snapshot. Reject unrelated manifest/lock hunks and preserve all pre-existing unrelated worktree changes.

`npm run build` is not an acceptance gate for this slice. If executed separately, the known `BILLING_PRICE_NOT_CONFIGURED` result must be reported as an unrelated environment blocker, never as a React-alignment failure or a reason to edit billing code.

## File Changes

| File | Action | Description |
|---|---|---|
| `package.json` | Modify | Change only `dependencies.react-dom` to exact `19.2.1`. |
| `package-lock.json` | Modify | Update only the root declaration and npm-resolved `node_modules/react-dom` metadata. |

## Interfaces / Contracts

No application, API, type, route, test, or behavioral contract changes. Dependency invariants are exact React/React DOM patch equality, unchanged Next.js 16.0.7, and reproducibility through `npm ci`.

## Testing Strategy

| Layer | Evidence |
|---|---|
| Dependency integrity | Exact install, clean `npm ci`, valid `npm ls` tree, narrowly reviewed lock diff |
| Focused regression | Existing SSR primitive suite collects and passes |
| Full regression | `npm test` passes without source/test edits |
| Static | TypeScript and scoped lint remain green |

## Threat Matrix

| Boundary | Applicability | Reason |
|---|---|---|
| Documentation-like paths | N/A | No executable-file classification is implemented. |
| Git repository selection | N/A | Commands are operator-run from the fixed repository root; no selector logic is added. |
| Commit state | N/A | No staging or commit automation is introduced. |
| Push state | N/A | No push automation is introduced. |
| PR commands | N/A | No PR command composition is introduced. |

## Migration / Rollout and Rollback

No data migration, feature flag, or phased rollout is required. Apply atomically as the two-manifest unit. To roll back, restore both manifests together to their pre-change revision and run `npm ci`; never revert only one manifest. Re-run `npm ls react react-dom next` to confirm the prior reproducible tree. Application data and behavior require no rollback action.

## Open Questions

None.

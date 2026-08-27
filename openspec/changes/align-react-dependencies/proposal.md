# Proposal: Align React Runtime Dependencies

## Intent

Unblock Vitest collection of the existing SSR primitive tests by aligning the exact React runtime versions. Upgrade only `react-dom` from `19.2.0` to `19.2.1`, matching `react@19.2.1`, while preserving Next.js `16.0.7` and all application behavior.

## Scope

### In Scope
- Set `react-dom` to exact version `19.2.1` in `package.json`.
- Regenerate only the corresponding root and `node_modules/react-dom` metadata in `package-lock.json` through npm.
- Verify the clean dependency tree and rerun the previously blocked focused and full Vitest suites under strict-TDD evidence requirements.

### Out of Scope
- Application or primitive source, tests, routes, behavior, and test configuration.
- Audit, exploration, proposal, or prior-change verification artifacts beyond this proposal.
- Next.js, React, other dependency upgrades, broad lockfile refreshes, and unrelated dirty files.
- The unrelated `BILLING_PRICE_NOT_CONFIGURED` production-build environment blocker.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- None. This dependency-only correction changes no product requirement or behavior.

## Approach

Run `npm install --save-exact react-dom@19.2.1`, then reject any diff outside `package.json` and `package-lock.json` or any unrelated lockfile churn. Preserve `react@19.2.1` and `next@16.0.7`. Establish strict-TDD GREEN evidence by running `npm ci`, inspecting `npm ls react react-dom next`, then executing the focused SSR suite and `npm test`; follow with TypeScript and scoped lint checks without editing their targets.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `package.json` | Modified | Align exact `react-dom` version to `19.2.1`. |
| `package-lock.json` | Modified | Record the matching npm-resolved package metadata only. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| npm introduces unrelated lockfile churn | Medium | Use the exact install command and enforce the two-file diff boundary. |
| Alignment reveals another test failure | Low | Report it as new evidence; do not expand this change. |
| Build remains red for billing configuration | High | Record it as the known unrelated blocker, not an alignment failure. |

## Rollback Plan

Revert both package manifests together and run `npm ci` to restore the prior reproducible dependency tree. No source or data migration is required.

## Dependencies

- Registry access for `react-dom@19.2.1` and its lockfile metadata.
- Existing SSR primitive tests remain unchanged as the strict-TDD verification target.

## Success Criteria

- [ ] Only `package.json` and `package-lock.json` change, with `react@19.2.1`, `react-dom@19.2.1`, and `next@16.0.7` resolved.
- [ ] `npm ci` and `npm ls react react-dom next` succeed without invalid peers.
- [ ] `npx vitest run tests/frontend-design-primitives.test.ts` collects and passes the SSR tests.
- [ ] `npm test` passes, providing strict-TDD GREEN evidence for the previously blocked suite.
- [ ] TypeScript and scoped lint remain green; any build failure is unchanged and attributable only to `BILLING_PRICE_NOT_CONFIGURED`.

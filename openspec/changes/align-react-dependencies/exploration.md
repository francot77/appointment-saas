# Exploration: Align React Dependencies

### Current State

The repository has an exact-version runtime mismatch in `package.json` and the root package entry of `package-lock.json`: `react` is `19.2.1`, while `react-dom` is `19.2.0`. The installed lock entries match those declarations. `react-dom@19.2.0` declares `react: ^19.2.0`, so the tree is within its declared peer range, but React and React DOM are not release-aligned; Vitest fails during collection before the new SSR contract tests execute.

`next` is pinned to `16.0.7`. Its recorded peer requirements accept both `react` and `react-dom` in `^19.0.0` (as well as the supported React 18 range), and `react-dom@19.2.1` declares `react: ^19.2.1`. Therefore, keeping React at `19.2.1` and moving only `react-dom` to `19.2.1` is compatible with the repository's Next.js version and is the smallest alignment.

The prior `frontend-design-primitives` change is intentionally complete at the implementation boundary but has failed runtime verification: the focused suite collected zero tests because of this mismatch, and `npm test` passed 111 existing tests before failing collection of the new suite. TypeScript and scoped lint passed. The build has a separate environment blocker (`BILLING_PRICE_NOT_CONFIGURED`) and is not part of this dependency-alignment objective.

### Affected Areas

- `package.json` — change only the exact `react-dom` dependency from `19.2.0` to `19.2.1`; keep `react`, `next`, scripts, and all unrelated dependencies unchanged.
- `package-lock.json` — refresh the root dependency declaration and the `node_modules/react-dom` version, tarball URL, and integrity through npm; do not hand-edit lockfile metadata or run a broad update.
- `openspec/changes/frontend-design-primitives/verify-report.md` — evidence source only; do not modify it in this change.
- `tests/frontend-design-primitives.test.ts` — verification target only; do not modify it in this change.

### Approaches

1. **Upgrade `react-dom` to `19.2.1`** — retain the already newer React runtime and align both runtime packages to the same patch release.
   - Pros: one dependency declaration changes; matches `react-dom`'s exact peer requirement for React `^19.2.1`; remains within Next.js `16.0.7`'s React 19 peer range; directly addresses the collection error.
   - Cons: requires npm to refresh the lockfile integrity and installed package; the patch release still needs focused and full test verification.
   - Effort: Low.

2. **Downgrade `react` to `19.2.0`** — align both packages on the older installed React DOM patch.
   - Pros: also changes one dependency and avoids downloading a newer React DOM package.
   - Cons: discards the repository's existing newer React declaration; is less conservative with respect to the currently selected React runtime; does not preserve the newest already-pinned package.
   - Effort: Low.

3. **Use version ranges or run a broad React/Next update** — loosen exact versions or let npm resolve a wider dependency graph.
   - Pros: may absorb future patch releases automatically.
   - Cons: expands lockfile churn and regression surface, weakens reproducibility, can alter unrelated packages, and violates the explicitly authorized minimal dependency slice.
   - Effort: Medium.

### Recommendation

Choose approach 1: align `react-dom` to exact version `19.2.1` and leave `react` at `19.2.1`. During apply, run `npm install --save-exact react-dom@19.2.1` from the repository root so npm updates both `package.json` and the corresponding lockfile metadata. Review the diff immediately; only the two package manifests should change. Then use `npm ci` to validate that the committed lockfile reproduces the aligned tree, followed by `npm ls react react-dom next` and the required test commands.

Verification should be ordered as follows:

1. `npm ci` — clean installation from the refreshed lockfile.
2. `npm ls react react-dom next` — confirm one aligned React pair and `next@16.0.7`.
3. `npx vitest run tests/frontend-design-primitives.test.ts` — prove the previously blocked SSR suite collects and executes.
4. `npm test` — prove the full suite, including the prior 111 tests, remains green.
5. `npx tsc --noEmit` and scoped lint — confirm static compatibility without touching source.

The change must not edit primitives source, tests, audit artifacts, routes, behavior, or unrelated dirty files. A clean build may remain separately blocked by the previously documented missing billing configuration; that is not evidence against this dependency alignment unless it changes after the test unblock.

### Risks

- npm may produce unexpected lockfile churn if invoked without the exact package/version; reject such a diff and do not use broad `npm update` commands.
- A clean install can expose environment or registry failures independent of the version alignment; preserve those as separate evidence rather than changing scope.
- React runtime alignment removes the known Vitest collection blocker but does not prove browser focus, visual behavior, or the unrelated production build configuration.
- The worktree already contains unrelated dirty files and the `frontend-design-primitives` change; staging/applying must be limited to `package.json` and `package-lock.json`.

### Ready for Proposal

Yes — propose a minimal exact-patch dependency change that upgrades only `react-dom` from `19.2.0` to `19.2.1`, regenerates the npm lockfile through the package manager, verifies Next.js `16.0.7` peer compatibility, and reruns the previously blocked focused and full Vitest commands without changing frontend behavior.

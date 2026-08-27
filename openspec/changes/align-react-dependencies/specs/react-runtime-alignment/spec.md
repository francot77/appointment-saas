# React Runtime Alignment Specification

## Purpose

Define the bounded dependency correction that aligns React DOM with React, preserves the existing Next.js application contract, and restores collection of the existing SSR tests.

## Requirements

### Requirement: Exact Runtime Manifest Alignment

The dependency manifest MUST declare `react` and `react-dom` at exact version `19.2.1` and MUST retain `next` at exact version `16.0.7`.

#### Scenario: Manifest versions are aligned

- GIVEN the updated `package.json`
- WHEN its runtime dependency declarations are inspected
- THEN `react` and `react-dom` are exactly `19.2.1`
- AND `next` remains exactly `16.0.7`

### Requirement: Reproducible Lockfile Alignment

The npm lockfile MUST represent the manifest exactly, resolve `react-dom` to `19.2.1` with valid registry metadata, and MUST NOT contain unrelated dependency changes.

#### Scenario: Clean installation reproduces the aligned tree

- GIVEN the committed `package.json` and `package-lock.json`
- WHEN `npm ci` and `npm ls react react-dom next` run
- THEN installation succeeds with no invalid peer dependency
- AND one aligned React pair and `next@16.0.7` are reported

#### Scenario: Lockfile changes remain bounded

- GIVEN the lockfile diff against the change baseline
- WHEN changed root declarations and package entries are reviewed
- THEN only metadata required to move `react-dom` from `19.2.0` to `19.2.1` differs
- AND resolved package metadata and integrity correspond to `react-dom@19.2.1`

### Requirement: SSR Test Collection and Execution

The aligned dependency tree MUST allow the existing SSR primitive suite and full Vitest suite to collect and pass without modifying tests or test configuration.

#### Scenario: Focused SSR suite executes

- GIVEN dependencies installed from the aligned lockfile
- WHEN `npx vitest run tests/frontend-design-primitives.test.ts` runs
- THEN the file is collected without a React version mismatch
- AND all tests defined by the focused suite pass

#### Scenario: Full suite remains green

- GIVEN the focused SSR suite passes unchanged
- WHEN `npm test` runs
- THEN all discovered test files collect successfully
- AND the complete test suite passes

### Requirement: Application Compatibility

The dependency correction MUST preserve existing application behavior and MUST remain compatible with the unchanged Next.js version.

#### Scenario: Static compatibility remains green

- GIVEN only dependency manifests have changed
- WHEN TypeScript validation and lint checks scoped to the existing SSR primitive targets run
- THEN both checks complete without new errors
- AND no application behavior change is required

### Requirement: Strict Change Boundary

The change MUST modify only `package.json` and `package-lock.json`; it MUST NOT alter source, tests, audit or prior-change artifacts, or unrelated build configuration.

#### Scenario: Changed files satisfy strict scope

- GIVEN the complete implementation diff
- WHEN changed paths and dependency entries are reviewed
- THEN only `package.json` and `package-lock.json` contain implementation changes
- AND React, Next.js, source, tests, audit artifacts, and build configuration remain unchanged

#### Scenario: Unrelated build blocker remains separate

- GIVEN tests and static checks establish dependency compatibility
- WHEN a build is blocked only by `BILLING_PRICE_NOT_CONFIGURED`
- THEN the blocker is reported as pre-existing and out of scope
- AND no build configuration or application source is changed to address it

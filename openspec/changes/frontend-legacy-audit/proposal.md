# Proposal: Frontend Legacy Audit

## Intent

Produce an evidence-based **Frontend Legacy Audit** that turns the mixed Editorial-light, tenant-themed, and legacy-dark UI into a reviewable migration plan. This change is audit-only: **no production code, styles, components, assets, dependencies, tests, routes, deletions, refactors, or fixes may change**. Only OpenSpec artifacts may be created or updated.

## Scope

### In Scope
- Executive summary; current design system and tokens; route/component audits; hardcoded styles; UX inconsistencies; and dead/duplicate UI candidates.
- Route-family matrices covering 390px, 768px, 1024px, and wide desktop; loading, empty, error, success, disabled, dialog, and recovery states; responsive behavior; keyboard/focus, semantics, announcements, touch targets, overflow, and tenant contrast.
- Evidence labels distinguishing source-confirmed findings, runtime/browser-confirmed findings, candidates, and unresolved product decisions.
- A phased route-family migration plan plus prioritized tasks. Every task must include ID, P0–P3 priority, files, problem, expected result, dependencies, and S/M/L scope.
- **Frontend Design Guardrails** defining token ownership, primitive/state conventions, accessibility baselines, behavior preservation, and evidence required before migration or deletion.
- Multiple independently reviewable specs/chained slices, each below the 400 changed-line review budget.

### Out of Scope
- Any implementation, visual correction, copy change, component extraction, dead-code deletion, or runtime/API behavior change.
- Treating unverified usage, visual behavior, or design authority as confirmed.

## Capabilities

### New Capabilities
- `frontend-legacy-audit`: Defines the audit evidence model, required coverage, migration-plan structure, task schema, and design guardrails.

### Modified Capabilities
- None.

## Approach

Use the exploration inventory to specify an incremental route-family plan: authority/tokens, primitives, customer recovery, owner activation, operational consolidation, responsive/accessibility validation, and evidence-gated dead-UI decisions. Preserve behavior and record uncertainties instead of promoting assumptions.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `openspec/changes/frontend-legacy-audit/**` | New | Audit, specs, design, tasks, and evidence planning only. |
| `app/**`, `lib/**`, assets/config | Read-only | Evidence sources; no modifications permitted. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Audit overstates inferred findings | Medium | Require evidence labels and explicit uncertainties. |
| Plan becomes too broad to review | High | Split by route family and enforce chained sub-400-line artifacts. |
| Migration guidance changes behavior | Medium | Guardrails require runtime/API/state preservation. |

## Rollback Plan

Revert only OpenSpec files created or updated by this change; production remains untouched.

## Dependencies

- `exploration.md`; product confirmation of canonical visual authority; later browser/runtime evidence for unconfirmed findings.

## Success Criteria

- [ ] `Frontend Legacy Audit` contains every required section, coverage dimension, task field, migration phase, and guardrail.
- [ ] Confirmed findings and candidates are unmistakably separated.
- [ ] All follow-on work is divisible into bounded chained slices without authorizing production changes here.

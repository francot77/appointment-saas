# Proposal: Migrate Services Tab

## Intent

Replace the legacy-dark Services tab inside the light dashboard shell with existing Editorial-light surfaces, semantic tokens, and feedback primitives. Service behavior and the parent contract remain immutable.

## Scope

### In Scope
- Migrate returned presentation in exactly `app/dashboard/ServicesTab.tsx`.
- Map existing feedback to `Alert`, `Status`, `LoadingState`, and `EmptyState` without changing conditions or copy.
- Add a focused source-contract test for mapping, preservation, and isolation.

### Out of Scope
- `SettingsTab`, other dashboard tabs, `DashboardClient`, and other consumers.
- Shared primitives, APIs, `lib`, dependencies, configuration, and behavior refactors.
- Replacing or restructuring the native delete `<dialog>`.
- Browser, visual, responsive, contrast, and interaction evidence.

## Capabilities

### New Capabilities
- `services-tab-presentation`: Defines the light migration and preservation contract for service-management states.

### Modified Capabilities
None.

## Approach

Limit production edits to imports and JSX/style composition. Use product tokens for surfaces and feedback; retain tenant color only for the existing action and service decoration. Preserve CRUD endpoints, methods, bodies, normalization, validation, state transitions, copy, all feedback states, toggle and saving behavior, native delete confirmation, soft deactivation, refs, cancel/close handling, and focus restoration. Keep native dialog markup and behavior unchanged.

Deliver as one Feature Branch Chain slice under 400 changed lines. Follow RED-GREEN-REFACTOR with focused Vitest, then `npm test`; do not claim browser guarantees.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `app/dashboard/ServicesTab.tsx` | Modified | Presentation and primitive composition only. |
| `tests/services-tab-presentation.test.ts` | New | Focused source-contract evidence. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Presentation alters behavior or copy | Medium | Assert contracts first and review the production diff. |
| Feedback semantics change | Medium | Preserve conditions and use existing primitive roles. |
| Dialog regressions remain unobserved | Medium | Keep dialog structure/behavior; defer browser claims. |
| Tenant accent conveys status | Low | Use product status tokens. |

## Rollback Plan

Revert the ServicesTab slice and focused test. No data, API, primitive, parent, or configuration rollback is required.

## Dependencies

- `app/components/ui/feedback.tsx` and `app/globals.css`.

## Success Criteria

- [ ] Only `app/dashboard/ServicesTab.tsx` changes in production; exclusions remain unchanged.
- [ ] CRUD, validation, state, copy, feedback, toggle, dialog, and focus contracts remain unchanged.
- [ ] Applicable feedback uses all four named primitives; migrated surfaces contain no legacy-dark classes.
- [ ] Focused tests and `npm test` pass under strict TDD within 400 changed lines.
- [ ] Verification separates source-contract from deferred browser evidence.

## Proposal Question Round

Automatic mode applies the supplied scope and preservation contract; no blocking product decisions remain.

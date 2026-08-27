# Proposal: Migrate Client Turn Recovery

## Intent

Replace the legacy-dark presentation in the customer manage-and-reschedule recovery seam with the existing Editorial-light semantic feedback system. The migration improves journey continuity while treating every API, state, persistence, navigation, tenant, and copy contract as immutable.

## Scope

### In Scope
- Migrate presentation only in `app/r/[token]/MagicLinkClient.tsx`.
- Migrate presentation only in `app/[slug]/turno-actualizado/page.tsx`.
- Recompose existing branches with `Alert`, `Status`, `LoadingState`, and `EmptyState`, preserving tenant identity/accent and copy semantics.

### Out of Scope
- `turno-recibido`, owner tabs, the full booking flow, and all other consumers.
- API, library, dependency, configuration, storage, and shared-primitive changes.
- Replacing `window.confirm` with `Dialog`.
- Browser, visual, focus, contrast, interaction, and responsive evidence.

## Capabilities

### New Capabilities
- `client-turn-recovery`: Defines the two-route presentation migration and its strict behavior-preservation contract.

### Modified Capabilities
None.

## Approach

Limit edits to imports and returned JSX/style composition. Preserve fetch endpoints, request bodies and methods, abort timeout, token-expiry cleanup, local appointment storage, cancellation and confirmation, availability, rescheduling, redirects, query parameters, tenant inputs, copy, and state setters. Deliver through a forced Feature Branch Chain: `MagicLinkClient` first, then `turno-actualizado` targeting the immediately previous branch. Use strict RED-GREEN-REFACTOR with `npm test`; do not invent browser coverage.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `app/r/[token]/MagicLinkClient.tsx` | Modified | Semantic recovery/loading/error/empty/status presentation only. |
| `app/[slug]/turno-actualizado/page.tsx` | Modified | Light result composition and semantic status presentation only. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Presentation edits alter behavior or copy | Medium | Diff-review every preserved contract and run `npm test`. |
| Tenant accent conveys product status | Low | Keep tenant color on identity/actions; use product semantic status tones. |
| Runtime regressions remain unobserved | Medium | Record browser evidence as deferred; make no runtime claims. |
| Review scope exceeds 400 lines | Low | Keep each chained slice autonomous and below the shared budget. |

## Rollback Plan

Revert the second chain slice, then the first; no data, API, dependency, or configuration rollback is required.

## Dependencies

- Existing contracts in `app/components/ui/feedback.tsx` and product semantic variables in `app/globals.css`.

## Success Criteria

- [ ] Exactly the two authorized production files change and use all applicable shared primitives.
- [ ] Preserved behavior, copy, tenant, storage, request, state, query, and redirect contracts remain unchanged.
- [ ] `npm test` passes under strict TDD and authored additions plus deletions remain below 400 lines per chained slice.
- [ ] Verification distinguishes source/test evidence from deferred browser evidence.

## Proposal Question Round

Automatic mode applies the supplied scope and preservation contract; no blocking product decisions remain.

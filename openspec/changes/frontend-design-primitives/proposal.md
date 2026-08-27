# Proposal: Contract-First Frontend Design Primitives

## Intent

Establish the first implementation slice after the frontend legacy audit: stable product semantic tokens and reusable feedback contracts. This foundation reduces duplicated presentation without changing any existing consumer, route, copy, API, validation, or state transition.

## Scope

### In Scope
- Add product semantic CSS variables for canvas, surfaces, content, borders, action/focus, and info/success/warning/danger states.
- Add presentational `Alert`, `Status`, `LoadingState`, `EmptyState`, and controlled `Dialog` contracts.
- Add focused server-rendered contract tests under strict TDD with `npm test`.

### Out of Scope
- Services, Settings, MagicLink, recovery, or any other consumer/route migration.
- Browser harness, visual/responsive verification, and marketing CSS migration.
- Dialog focus entry/restoration, Escape behavior, and browser guarantees; these require a later verification slice before consumer migration.

## Capabilities

### New Capabilities
- `frontend-design-primitives`: Product token ownership and accessible, presentational feedback component contracts.

### Modified Capabilities
- None.

## Approach

Use RED-GREEN-REFACTOR with `npm test`: first specify semantic roles, labels, visible status text, optional actions, and dialog modal/labeling attributes; then implement the typed module and product variables. Exact token values remain provisional until product approval. Tenant colors may provide approved accent/background adaptation but MUST NOT define product status tokens. Keep `.landing-page` semantics and all existing consumers unchanged.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `app/globals.css` | Modified | Add product-owned semantic variables only. |
| `app/components/ui/feedback.tsx` | New | Presentational feedback and controlled Dialog contracts. |
| `tests/frontend-design-primitives.test.tsx` | New | Focused SSR contract tests. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Provisional values imply product approval | Medium | Document stable ownership/names separately from final values. |
| Dialog API implies unsupported focus guarantees | Medium | Test only SSR contracts and defer browser guarantees explicitly. |
| Scope expands beyond the 400-line review budget | Medium | Keep this feature-branch-chain slice to the three named files. |

## Rollback Plan

Revert the three-file foundation slice. Because no consumer imports change, rollback restores the prior UI and route behavior without migration work.

## Dependencies

- Completed `frontend-legacy-audit` findings and cached OpenSpec preflight.
- Product approval for final token values is deferred and does not block contract definition.

## Success Criteria

- [ ] `npm test` proves the feedback contracts and semantic output.
- [ ] Only the three named files change, with no existing consumer or route behavior changes.
- [ ] Product, tenant, and marketing token ownership remain explicitly separated.
- [ ] Authored changes remain within the 400-line chained-review budget.

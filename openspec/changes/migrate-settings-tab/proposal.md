# Proposal: Migrate Settings Tab — Public Settings and Slug

## Intent

Migrate the public/business settings form and slug validation surface from legacy-dark presentation to the Editorial-light dashboard language without changing behavior.

## Scope

### In Scope
- Migrate the header/preview, public-page fields, about/contact fields, sharing card, and global load/error presentation in `SettingsTab.tsx`.
- Use existing feedback primitives and Editorial-light semantic tokens.
- Add a focused source-contract test for presentation, preservation, and isolation.

### Out of Scope
- Appearance/theme controls, presets, tenant inputs, messaging configuration, and the sticky save/status bar.
- `DashboardClient`, `MessagingSettingsCard`, shared primitives, APIs, public consumers, and other dashboard files.
- Copy changes, extraction, browser harnesses, and runtime visual, responsive, focus, sticky, or contrast claims.

## Capabilities

### New Capabilities
- `settings-tab-public-presentation`: Defines the light presentation and preservation contract for public/business settings and slug feedback.

### Modified Capabilities
None.

## Approach

Limit production edits to imports and Slice 1 JSX/style composition. Map applicable loading, error, setup, and slug feedback to existing `LoadingState`, `Alert`, and `Status` contracts while retaining conditions and copy. Use semantic tokens for migrated surfaces and fields.

Preserve the no-props parent contract; all state, effects, handlers, API paths/methods/bodies, the 450 ms slug debounce and cancellation, error mappings, save transitions, copy-link behavior, labels, Spanish copy, and raw tenant inputs. Leave tenant readability logic in public consumers unchanged. Deliver through the cached Feature Branch Chain strategy under 400 changed lines with strict RED-GREEN-REFACTOR and `npm test`.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `app/dashboard/SettingsTab.tsx` | Modified | Slice 1 presentation only. |
| `tests/settings-tab-presentation.test.ts` | New | Focused source-contract test. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Async slug semantics regress | Medium | Lock debounce, cancellation, request, and message markers before styling. |
| Mixed presentation remains | High | Keep deferred subtrees as explicit exceptions. |
| Source tests overstate runtime proof | Medium | Limit claims and defer browser evidence. |

## Rollback Plan

Revert the two-file slice. No API, data, parent, primitive, tenant-readability, or configuration rollback is required.

## Dependencies

- Existing feedback contracts and semantic tokens.

## Success Criteria

- [ ] Only `SettingsTab.tsx` changes in production; every deferred area remains unchanged.
- [ ] Public/business and slug surfaces use Editorial-light tokens and applicable shared feedback primitives.
- [ ] State, API, validation, save, slug-check, copy, tenant-input, and parent contracts remain unchanged.
- [ ] Focused tests and `npm test` pass under strict TDD within 400 changed lines.
- [ ] Verification distinguishes source-contract evidence from deferred browser guarantees.

## Proposal Question Round

Automatic mode applies the supplied first-slice boundary and preservation requirements; no blocking product decisions remain.

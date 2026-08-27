# Proposal: Migrate Settings Tab Appearance

## Intent

Replace the appearance/theme editor's legacy-dark presentation with the existing Editorial-light semantic language while preserving tenant-owned values, behavior, and public readability ownership.

## Scope

### In Scope
- Restyle only the `aria-labelledby="appearance-title"` section in `app/dashboard/SettingsTab.tsx` with existing product semantic tokens.
- Preserve preset selection/update semantics, raw custom color and background values, logo input, and conditional solid/gradient/image controls.
- Add `tests/settings-tab-appearance-presentation.test.ts` as focused source-contract evidence.

### Out of Scope
- Messaging configuration and the sticky save/status bar.
- Public consumers, shared primitives, APIs, models, `DashboardClient`, and every other dashboard file.
- Copy, validation, contrast/readability logic, extraction, live preview, browser harnesses, or runtime visual claims.

## Capabilities

### New Capabilities
- `settings-tab-appearance-presentation`: Defines the light appearance-editor presentation and behavior-preservation contract.

### Modified Capabilities
None.

## Approach

Keep the appearance JSX in place and replace only product-owned slate surfaces, borders, content, and focus classes with existing semantic tokens. Retain inline tenant/preset swatches, the generic `update` helper, field identifiers, `aria-pressed` derivation, and all background-mode branches.

The source-contract test will lead strict RED-GREEN-REFACTOR with `npm test` and lock the full `JSON.stringify(settings)` PUT payload, save/error transitions, no-props parent contract, untouched deferred boundaries, and absence of local readability logic. Deliver as one Feature Branch Chain slice, forecast at 100–180 authored changed lines under the 400-line budget.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `app/dashboard/SettingsTab.tsx` | Modified | Appearance section presentation only. |
| `tests/settings-tab-appearance-presentation.test.ts` | New | Static preservation and isolation contract. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Conditional controls or raw values regress | Medium | Assert every key, branch, preset, and update call before styling. |
| Tenant colors acquire product semantics | Low | Keep tenant values limited to existing swatches and inputs. |
| Static tests overstate runtime proof | Medium | Defer focus, contrast, responsive, and visual claims. |

## Rollback Plan

Revert the two-file slice. No API, data, model, primitive, public-consumer, or parent rollback is required.

## Dependencies

- Existing product semantic tokens in `app/globals.css`.

## Success Criteria

- [ ] Only the appearance section changes in production; deferred areas remain unchanged.
- [ ] Presets, generic updates, raw values, conditional controls, payloads, save/error behavior, and tenant ownership remain intact.
- [ ] Public-consumer readability boundaries remain unchanged and unduplicated.
- [ ] Focused tests and `npm test` pass under strict TDD within 400 changed lines.

## Proposal Question Round

Automatic mode applies the supplied scope, preservation boundaries, and delivery constraints; no blocking product decisions remain.

# Proposal: Migrate Settings Tab Messaging and Sticky Save Presentation

## Intent

Complete the bounded `SettingsTab` presentation migration by moving the main sticky save/status bar from legacy-dark styling to shared feedback and Editorial-light semantics, without coupling it to the independently stateful messaging card.

## Scope

### In Scope
- Restyle only the sticky main-settings save/status presentation in `app/dashboard/SettingsTab.tsx` with existing semantic tokens and `Status`.
- Preserve `<MessagingSettingsCard />` as a read-only, no-props composition boundary.
- Add `tests/settings-tab-messaging-presentation.test.ts` as focused static contract evidence.

### Out of Scope
- `MessagingSettingsCard.tsx` internals, copy, styling, state, entitlement behavior, or API payloads.
- Public/appearance sections, APIs, libraries, shared primitives/tokens, parent wiring, dependencies, configuration, and behavior refactors.
- Browser harnesses and runtime sticky, responsive, focus, contrast, or entitlement claims.

## Capabilities

### New Capabilities
- `settings-tab-messaging-presentation`: Defines semantic sticky-save presentation and isolation from messaging configuration.

### Modified Capabilities
None.

## Approach

Keep the existing form and state ownership. Replace only the sticky bar's product-owned slate classes with light semantic surface, border, content, action, and focus tokens. Render the four existing `saveState` branches through `Status` while retaining exact Spanish labels and the polite live region. Preserve the submit button, disabled predicate, sticky/responsive classes, and z-index.

The source-contract test leads strict RED-GREEN-REFACTOR with `npm test`. It also inspects read-only messaging and parent sources to lock independent state, copy, endpoints, payload markers, and the no-props contract. Deliver as one forced Feature Branch Chain unit below 400 authored changed lines.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `app/dashboard/SettingsTab.tsx` | Modified | Sticky save/status presentation only. |
| `tests/settings-tab-messaging-presentation.test.ts` | New | Static presentation, preservation, and isolation contract. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Main and messaging save states become coupled | Medium | Assert ownership, endpoints, buttons, and state markers separately. |
| Feedback semantics or copy change | Medium | Preserve `aria-live="polite"`, conditions, and exact labels. |
| Static evidence is overstated | Medium | Explicitly defer browser-only guarantees. |

## Rollback Plan

Revert the two-file implementation slice. No API, data, messaging, primitive, parent, or configuration rollback is required.

## Dependencies

- Existing `Status` contract and product semantic tokens.

## Success Criteria

- [ ] Only the authorized sticky bar changes in production; messaging internals remain untouched.
- [ ] Four main-save states use shared feedback and light semantic tokens with unchanged copy and behavior.
- [ ] Main and messaging state, APIs, dirty state, sticky behavior, and parent contracts remain independent and unchanged.
- [ ] Focused tests and `npm test` pass under strict TDD below 400 changed lines.
- [ ] Browser limitations remain explicit.

## Proposal Question Round

Automatic mode applies the supplied exact scope and preservation contracts; no blocking product decision remains.

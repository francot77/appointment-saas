# Proposal: Frontend Reliability Hardening

## Intent

Resolve five confirmed post-migration reliability and semantic defects without reopening the visual migration or changing established API, state-ownership, navigation, or storage contracts.

## Scope

### In Scope
- Give every shared `EmptyState` instance a unique accessible title reference.
- Canonicalize `SettingsTab` slug comparisons and settle checking state on every effect path.
- Serialize per-service visibility changes, tolerate empty successful mutation responses, and preserve service/form data when refresh fails.
- Cancel and invalidate superseded `MagicLinkClient` appointment loads.
- Translate `MessagingSettingsCard` owner copy to Spanish and replace product-owned literal colors with semantic tokens.
- Extend the five existing focused Vitest files under strict RED-GREEN-REFACTOR.

### Out of Scope
- Browser, screenshot, visual-regression, responsive, focus-execution, or end-to-end work.
- Server routes, request methods/bodies, shared token definitions, dependencies, navigation, storage policy, dialog behavior, or state extraction.
- Unrelated worktree changes, including `lib/getBusinessBySlug.ts`.

## Capabilities

### New Capabilities
- `frontend-reliability`: Defines instance-safe feedback, canonical slug state, mutation/request concurrency, resilient refresh handling, and messaging presentation semantics.

### Modified Capabilities
None.

## Approach

Deliver five dependency-ordered Feature Branch Chain slices. Each slice changes one production file and its existing focused test, remains below 400 authored lines, begins with a failing focused test, and finishes with `npm test`. Reuse existing normalization, semantic-token, and component ownership contracts; add only local lifecycle guards/helpers where required.

## Affected Areas

| Slice | Files | Forecast |
|---|---|---:|
| 1 | `app/components/ui/feedback.tsx`; `tests/frontend-design-primitives.test.ts` | 30–70 |
| 2 | `app/dashboard/SettingsTab.tsx`; `tests/settings-tab-public-presentation.test.ts` | 90–170 |
| 3 | `app/dashboard/ServicesTab.tsx`; `tests/services-tab-presentation.test.ts` | 120–220 |
| 4 | `app/r/[token]/MagicLinkClient.tsx`; `tests/client-turn-recovery-presentation.test.ts` | 70–150 |
| 5 | `app/dashboard/MessagingSettingsCard.tsx`; `tests/settings-tab-messaging-presentation.test.ts` | 120–230 |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| New guards alter existing transitions | Medium | Lock preserved contracts before production edits. |
| Client slug policy diverges from server | Medium | Reuse `normalizeSlugInput`. |
| Static tests overstate runtime proof | High | Keep browser claims explicitly excluded. |

## Rollback Plan

Revert any slice's production/test pair independently, in reverse order if dependencies require it. No data migration, API rollback, or configuration restoration is needed.

## Dependencies

- Committed frontend baseline `e8a589e` and existing React 19/Vitest contracts.
- Slice 1 precedes slices 2–4; slice 5 follows slices 1–2.

## Success Criteria

- [ ] All specification scenarios have focused source/SSR contract evidence.
- [ ] Each slice remains under 400 authored changed lines and preserves named contracts.
- [ ] Focused tests, `npm test`, TypeScript, scoped lint, and diff checks pass.
- [ ] Verification makes no browser or visual claims.

## Proposal Question Round

Automatic mode applies the supplied exact defects, boundaries, and delivery constraints; no blocking product decision remains.

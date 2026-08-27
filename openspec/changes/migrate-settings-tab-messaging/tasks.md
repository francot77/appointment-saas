# Tasks: Migrate Settings Tab Messaging and Sticky Save Presentation

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 100–180 authored lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | One bounded forced-chain work unit |
| Delivery strategy | auto-chain (cached force-chained policy) |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Migrate sticky main-save feedback while proving messaging isolation | One Feature Branch Chain slice; base = feature/tracker branch | `npx vitest run tests/settings-tab-messaging-presentation.test.ts` | N/A: Node-only Vitest; browser setup/config is excluded | Revert exactly `app/dashboard/SettingsTab.tsx` and the focused test |

## Phase 1: RED — Focused Contract First

- [x] 1.1 Create `tests/settings-tab-messaging-presentation.test.ts` using `readFileSync`; extract the sticky bar and assert `Status`, light semantic tokens, no legacy slate classes, four exact state conditions/labels, `aria-live="polite"`, sticky/responsive/z-index markers, and submit/disabled/button copy.
- [x] 1.2 Add preservation assertions for `update`, dirty/save transitions, `handleSave`, settings GET/PUT headers/full body, unchanged `<MessagingSettingsCard />` and `<SettingsTab />` no-props composition, and unchanged non-sticky section markers.
- [x] 1.3 Inspect read-only `MessagingSettingsCard.tsx` from the same test; lock local saving/error ownership, connection and entitlement endpoints, PUT fields, optional token, lead-time bounds, template events, write-only autocomplete, existing copy, and independent button state.
- [x] 1.4 Run `npx vitest run tests/settings-tab-messaging-presentation.test.ts`; retain the expected RED failure before editing production.

## Phase 2: GREEN — Minimal Sticky Migration

- [x] 2.1 Modify only the sticky bar in `app/dashboard/SettingsTab.tsx`: replace product-owned slate chrome with existing surface, border, content, action, and focus tokens; preserve sticky, backdrop, shadow, z-index, and responsive classes.
- [x] 2.2 Render all four unchanged conditional save labels through `Status` tones inside the existing polite live region; preserve `type="submit"`, `disabled={saving}`, labels, form ownership, and every state/API transition.
- [x] 2.3 Leave `MessagingSettingsCard.tsx`, messaging/main ownership, completed SettingsTab sections, parent wiring, copy, APIs, primitives, libraries, dependencies, and configuration untouched; rerun the focused test to GREEN.

## Phase 3: REFACTOR — Bounded Verification

- [x] 3.1 Refactor only within the sticky boundary if needed; run `npm test`, `npx tsc --noEmit`, `npm run lint`, and `git diff --check`.
- [x] 3.2 Require the implementation delta to contain exactly the two authorized files and remain below 400 additions plus deletions; reduce the slice if either gate fails.
- [x] 3.3 Report static evidence only; explicitly leave browser stickiness, responsive layout, focus, contrast, announcements, and runtime messaging/entitlement behavior unverified.

# Exploration: Migrate Settings Tab

## Current State

`DashboardClient` is the light dashboard shell and owns local tab selection, activation navigation, and tenant `BrandConfig`. It renders Settings as `<SettingsTab />` with no props or callbacks, unlike `ServicesTab`; therefore the Settings component owns the complete settings, slug, loading, save, and messaging state boundary. The parent contract must remain unchanged.

`SettingsTab` is a 344-line monolith with three independently risky presentation areas:

1. **Public/business settings and sharing** — the public-page header/preview, public copy fields, about/contact fields, and slug sharing card. `GET /api/admin/settings` loads the settings object, `PUT /api/admin/settings` saves the full object, and `GET/PATCH /api/admin/slug` load, debounce-check, and save the public slug. `settingsErrorMessage` and `slugErrorMessage` preserve load/save, conflict, validation, and network semantics. The UI has separate `loading`, `error`, `slugChecking`, `slugCheck`, `slugSaving`, `slugError`, and `slugSavedMsg` branches.
2. **Appearance and tenant inputs** — presets (`Clásico`, `Cálido`, `Natural`) update the three tenant color fields together; advanced controls edit primary, secondary, text, solid/gradient/image background, background URL, and logo URL. The component stores raw values and does not calculate contrast. Public consumers validate hex values and select readable text (`BusinessLandingClient` supports a 4.5 contrast threshold with black/white fallback; `TurnosClient` validates primary/secondary colors and selects readable button text). Settings migration must not move or alter that tenant readability ownership.
3. **Messaging and save feedback** — `MessagingSettingsCard` is already light and self-contained, but owns separate connection/entitlement fetches and a `PUT /api/admin/messaging/connection` save action. Its save button does not participate in SettingsTab's main `saveState`. The Settings form's sticky bar is a separate main-settings save control with `unsaved`, `saving`, `saved`, and `error` states; it must not be coupled to messaging save state. The card currently contains English owner-facing copy in an otherwise Spanish surface; copy changes are out of scope.

The main settings API currently allowlists the settings fields server-side but does not perform explicit client validation beyond the slug availability workflow. The client sends the existing settings object unchanged in the `PUT` body. The slug API contract is also independent: availability is debounced by 450 ms, the persisted slug is treated as `OWN`, and PATCH failures map status/code to conflict or validation messages.

The existing shared `Alert`, `LoadingState`, `EmptyState`, and `Status` primitives are presentational only. There are no SettingsTab-specific frontend tests. The compatible test pattern is a Node/Vitest source-contract test using `readFileSync`; existing messaging tests cover normalization and secret-safe view data, not rendered Settings presentation. `npm test` cannot prove browser focus, contrast, responsive layout, or sticky positioning.

## Affected Areas

- `app/dashboard/SettingsTab.tsx` — only production consumer for the first slice; change presentation/imports while preserving all state, effects, handlers, copy, API paths, methods, bodies, and branch conditions.
- `tests/settings-tab-presentation.test.ts` — new focused source-contract test for the first slice; assert the presentation boundary and preservation contracts without requiring a browser harness.
- `app/dashboard/DashboardClient.tsx` — read-only parent dependency; preserve the no-props `<SettingsTab />` contract and tab activation behavior.
- `app/dashboard/MessagingSettingsCard.tsx` — read-only dependency for slice 3; its independent fetch/save state must not be folded into the main Settings form.
- `app/components/ui/feedback.tsx` — read-only shared primitive dependency; use existing contracts rather than extending them.
- `app/[slug]/BusinessLandingClient.tsx` and `app/[slug]/TurnosClient.tsx` — read-only tenant readability evidence; preserve their `validHex`, contrast, and readable-text behavior.
- `app/api/admin/settings/route.ts` and the slug API route — read-only API contracts; no server validation or payload changes are needed for a presentation-only migration.
- `tests/messaging-settings.test.ts` — read-only existing messaging contract coverage; it does not authorize changing the messaging card in the first slice.

## Slice Separation

| Slice | Presentation boundary | Behavior retained | Explicitly deferred |
|---|---|---|---|
| 1 — public/business form and slug | Header/preview, public-page fields, about/contact fields, sharing card, and global load/error presentation; migrate their surfaces/fields to Editorial-light semantic tokens and existing feedback primitives. | Settings `GET/PUT`, slug `GET/PATCH`, 450 ms availability debounce, conflict/validation/network mapping, copy URL behavior, labels, Spanish copy, and parent contract. | Appearance subtree, messaging card, sticky save/status bar, tenant contrast logic, browser evidence. |
| 2 — appearance/theme | Preset cards, advanced color/background/logo controls, and conditional solid/gradient/image fields. | Preset update semantics, field keys/values, conditional branches, raw tenant inputs, and main form submission. | Messaging card, sticky bar, any new contrast calculation or tenant adapter. |
| 3 — messaging and sticky save/status | Messaging card composition plus the main form's sticky save/status presentation, only after their independent state contracts are source-tested. | Messaging connection/entitlement fetches, secret-safe token handling, messaging PUT body, main settings save transitions, disabled states, and separate save ownership. | Copy/language rewrite, API changes, shared primitive changes, browser sticky/focus/contrast proof. |

## First Slice Recommendation

Proceed with **Slice 1: public/business form and slug validation presentation**. It is the smallest coherent Settings migration because it addresses the owner-facing identity and sharing surface without mixing tenant-theme semantics, the independently stateful messaging card, or the sticky save lifecycle. Keep the appearance section and sticky bar as documented legacy-dark exceptions for their dedicated slices rather than partially restyling them.

Use existing `LoadingState` for the current initial loading branch and `Alert` for the existing load/error branch only if the focused test proves the exact conditions and copy remain present. Replace dark product surfaces and fields in the Slice 1 JSX with existing product semantic token classes; do not add tokens, move state, extract child components, alter Spanish copy, or change the `PUT`/slug request contracts. Preserve tenant colors only where they already belong to tenant/action presentation; Slice 1 should not introduce tenant color calculations.

Forecast for the first implementation slice: **approximately 220–330 changed lines**, including one focused source-contract test, below the 400-line review budget. The production diff should be limited to `SettingsTab.tsx`; the test is the only additional file. The native test proves source contracts and API preservation, not runtime appearance or sticky positioning.

## Approaches

1. **Section-bounded presentation migration (recommended)** — migrate the public/business and slug sections first, retaining appearance, messaging, and sticky bar as explicit exceptions.
   - Pros: smallest safe diff; isolates slug/save semantics; preserves the no-props parent contract; leaves tenant contrast and independent messaging state untouched; fits the review budget.
   - Cons: Settings remains visually mixed until slices 2 and 3; the sticky bar remains a deliberate dark exception.
   - Effort: Medium.

2. **Whole-file presentation rewrite** — restyle all Settings JSX, including appearance, messaging composition, and sticky bar, in one pass.
   - Pros: reaches visual consistency sooner.
   - Cons: combines three state/data ownership boundaries, increases regression and line-count risk, makes slug/save preservation harder to prove, and likely exceeds the 400-line review budget.
   - Effort: High.

3. **Extract Settings subcomponents before styling** — split public, appearance, messaging, and save-bar components while migrating.
   - Pros: may improve long-term structure.
   - Cons: changes state/prop ownership in a P0 migration, expands the parent contract surface, and is unnecessary for presentation-only work.
   - Effort: High.

## Recommendation

Authorize Slice 1 as one strict-TDD, feature-branch-chain implementation unit: `app/dashboard/SettingsTab.tsx` plus `tests/settings-tab-presentation.test.ts`. The test should assert the unchanged no-props export/parent contract, `/api/admin/settings` GET/PUT behavior markers, `/api/admin/slug` GET/availability/PATCH markers, debounce and status/error copy, public/business field IDs and labels, copy-link behavior, preserved appearance/messaging/sticky boundaries, semantic light-surface usage in the migrated prefix, and absence of unrelated file edits.

After Slice 1 is verified, run Slice 2 for appearance/theme controls, then Slice 3 for MessagingSettingsCard and sticky save/status. Keep tenant contrast/readability as a preservation requirement and defer runtime contrast/browser evidence to the later verification pass.

## Risks

- The first slice intentionally leaves appearance and the sticky bar dark, so Settings will remain mixed until all three slices land.
- Replacing load/error markup can change announcements or branch visibility; preserve exact conditions and caller copy.
- Slug availability is asynchronous and cancellation-sensitive; do not refactor its effect or timer during presentation work.
- Main settings save and messaging save are separate state machines; coupling them would change user-visible status and disabled behavior.
- Tenant colors are arbitrary persisted inputs; do not add unsafe inline styles or move contrast/readability logic into Settings.
- Source-contract tests cannot prove responsive layout, sticky positioning, keyboard focus, or runtime tenant contrast; those require later browser evidence.
- `openspec/config.yaml` is absent; use the cached preflight (`npm test`, strict TDD, 400-line budget, force-chained delivery) and record the missing config for downstream phases.

## Ready for Proposal

Yes. The first proposal should authorize only Slice 1, with `SettingsTab.tsx` as the sole production file and one focused source-contract test. It should explicitly exclude ServicesTab, DashboardClient, MessagingSettingsCard implementation changes, appearance migration, sticky-bar migration, API changes, copy changes, tenant contrast logic, and browser harness work.

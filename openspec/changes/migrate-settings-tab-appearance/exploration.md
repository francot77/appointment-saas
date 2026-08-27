# Exploration: Migrate Settings Tab Appearance

## Current State

`DashboardClient` renders `<SettingsTab />` without props or callbacks. `SettingsTab` owns the complete settings object, fetch lifecycle, save lifecycle, and form update helper; the parent contract must remain unchanged.

The second bounded slice is the `aria-labelledby="appearance-title"` section in `app/dashboard/SettingsTab.tsx`:

- Three preset buttons (`Clásico`, `Cálido`, `Natural`) update `primaryColor`, `secondaryColor`, and `textColor` together through the existing `update` helper. `aria-pressed` is derived from the three persisted values.
- Advanced controls edit the same three color fields with paired native color inputs and text inputs. The inputs intentionally preserve raw tenant-owned values; `SettingsTab` performs no hex validation, contrast calculation, or readable-text selection.
- Background mode is a tenant-owned union of `solid`, `gradient`, and `image`. Only the active mode's controls render: `backgroundColor`, `gradientFrom`/`gradientTo`, or `backgroundImageUrl`. `logoUrl` remains visible for every mode.
- The current section is a legacy-dark exception: slate surfaces, borders, text, focus rings, and fields are hard-coded in the section. The preset swatches use inline styles from tenant/preset values and are not product status colors.
- There is no live public-page preview of colors or backgrounds in this section. The existing header preview only links to the persisted slug. Public consumers own runtime safety: `BusinessLandingClient` validates background/accent hex values and chooses readable text with a 4.5 contrast threshold; `TurnosClient` validates primary/secondary colors and chooses readable button text. This migration must not move or duplicate those helpers.

The settings API loads and returns the complete appearance payload (`primaryColor`, `secondaryColor`, `textColor`, `backgroundType`, `backgroundColor`, `gradientFrom`, `gradientTo`, `backgroundImageUrl`, and `logoUrl`) as part of `GET /api/admin/settings`. The existing form sends the complete `settings` object unchanged via `PUT /api/admin/settings` with `JSON.stringify(settings)`. The route allowlists these fields and has no explicit client validation; the Mongoose model constrains only `backgroundType` with the `solid | gradient | image` enum. Save failures retain the existing generic error and `saveState` transitions.

## Affected Areas

- `app/dashboard/SettingsTab.tsx` — only production file; replace appearance editor presentation/classes while preserving state keys, handlers, branches, inline tenant swatches, and form submission.
- `tests/settings-tab-appearance-presentation.test.ts` — focused Node/Vitest source-contract test for semantic presentation and preservation/isolation evidence.
- `app/dashboard/DashboardClient.tsx` — read-only parent evidence; preserve the no-props `<SettingsTab />` invocation.
- `app/api/admin/settings/route.ts` — read-only API evidence; preserve the full GET response, allowlisted PUT fields, and unchanged request body.
- `lib/models/BusinessSettings.ts` — read-only persistence evidence; preserve defaults and the background-type enum.
- `app/[slug]/BusinessLandingClient.tsx` and `app/[slug]/TurnosClient.tsx` — read-only readability evidence; preserve validation, background selection, and contrast ownership.
- `app/components/ui/feedback.tsx` and frontend OpenSpec artifacts — read-only semantic-token/primitive contract and migration guardrails.

## Approaches

1. **Section-bounded in-place presentation migration (recommended)** — replace only the appearance section's product-owned slate classes with existing `--color-surface`, `--color-surface-muted`, `--color-content`, `--color-content-muted`, `--color-border`, and `--color-focus` tokens; retain tenant values in preset swatches and all controls in place.
   - Pros: smallest diff; preserves raw tenant inputs, conditional background branches, save ownership, parent contract, and public readability helpers; fits comfortably below 400 authored lines.
   - Cons: appearance remains a simple editor without a live preview; the sticky bar and messaging card remain deferred legacy/mixed surfaces.
   - Effort: Low/Medium.

2. **Extract an appearance editor or add a live preview adapter** — move controls into a child component or calculate a tenant preview/readability model.
   - Pros: could improve component size or preview confidence later.
   - Cons: changes ownership/props, duplicates or relocates public readability semantics, expands the API/state surface, and exceeds the presentation-only boundary.
   - Effort: High; reject for this slice.

## Recommendation

Proceed with the section-bounded in-place migration. Add one focused source-contract test before production edits, then change only the appearance JSX classes and test file. The test should prove semantic light tokens in the appearance section, unchanged preset values and `update` calls, all color/background/logo identifiers and conditional branches, full settings PUT payload and save/error markers, no-props parent invocation, untouched messaging/sticky boundaries, and absence of contrast/readability logic or edits to public consumers. Do not change labels, copy, APIs, validation, state transitions, inline tenant swatches, or shared primitives.

Forecast: approximately 100–180 authored changed lines (production presentation edits plus the focused test), low 400-line budget risk. Strict TDD remains RED → GREEN → REFACTOR with `npm test`; source tests prove static contracts only.

## Risks

- Replacing slate classes in the section can accidentally style tenant swatches or make product status semantics tenant-owned; keep inline `backgroundColor` values and product semantic tokens separate.
- Changing conditional JSX can hide a background field or alter which raw value is sent; preserve the `solid`, `gradient`, and `image` branches exactly.
- A color text input can contain invalid or arbitrary persisted data; do not add client normalization, validation, or contrast calculation in `SettingsTab`.
- The full settings object is the PUT payload, so changing object shape or update timing can affect unrelated public/business fields even when only appearance is edited.
- Source-contract tests cannot prove browser focus, responsive layout, visual contrast, or public runtime readability; those claims remain deferred.
- Messaging configuration, sticky save/status presentation, shared primitive changes, public consumer helpers, APIs, and every other dashboard file are explicitly out of scope.

## Ready for Proposal

Yes. Authorize Slice 2 as one feature-branch-chain work unit limited to `app/dashboard/SettingsTab.tsx` and `tests/settings-tab-appearance-presentation.test.ts`, with the existing no-props parent/API/readability contracts preserved and all listed exclusions enforced.

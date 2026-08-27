# Exploration: Migrate Services Tab

## Current State

`DashboardClient` is the light dashboard shell. It owns the local `TabKey` state, activation checklist, desktop sidebar, mobile navigation, and passes the resolved tenant `BrandConfig` into `ServicesTab` at `DashboardClient.tsx:147-153`. The Services tab therefore has no parent CRUD callbacks or route contract to preserve; its own state and API handlers are the behavior boundary.

`ServicesTab` is a single client component with four behavior areas:

- **Load:** `useEffect` calls `GET /api/admin/services`; the response maps `id/_id`, `name`, `price`, `durationMinutes`, `color`, and `active` into local `Service` state. Failure clears the list and preserves the Spanish load error.
- **Create/edit:** one controlled form uses required `name`, nonnegative `price`, minimum/step-constrained `durationMinutes`, optional `color`, and `isActive`. Create uses `POST /api/admin/services`; edit uses `PATCH /api/admin/services/:id`; both send trimmed/normalized values, reload the list, and reset the form on success. `saving` disables submit and changes its label.
- **Toggle:** `PATCH /api/admin/services/:id` with `{ active: !service.isActive }`; successful responses optimistically update only the matching local item, while failure preserves the update-specific error.
- **Delete:** the UI opens a native `<dialog>` after storing the trigger button, focuses the cancel button on entry, restores focus to the trigger on close/cancel, and confirms with the existing Spanish copy. Confirmation calls `DELETE /api/admin/services/:id`, reloads, and resets an edit form if the deleted item was being edited. The server implements DELETE as a soft deactivation (`active: false`); this behavior must not be changed.

The current returned JSX is legacy-dark (`bg-slate-900/950`, dark fields, slate text, and dark status badges) inside the light shell. Loading is a local polite `status` span, empty is an inline paragraph, and errors are an inline `alert` paragraph inside the form. The shared `Alert`, `Status`, `LoadingState`, and `EmptyState` primitives are available in `app/components/ui/feedback.tsx`; their contracts are presentational and do not own the ServicesTab state or API calls.

There is no ServicesTab-specific frontend test. The repository's compatible focused convention is a Vitest Node source-contract test using `readFileSync`, as used by `tests/client-turn-recovery-presentation.test.ts`. `npm test` is `vitest run`; it does not prove browser rendering, native-dialog interaction, or focus behavior.

## Affected Areas

- `app/dashboard/ServicesTab.tsx` — the only production consumer to migrate; replace the dark presentation and map existing loading/empty/error/status branches to shared primitives while preserving all handlers, state setters, copy, labels, validation attributes, endpoints, methods, bodies, and tenant accent usage.
- `app/dashboard/DashboardClient.tsx` — read-only parent-shell dependency; it renders `ServicesTab brand={theme}` from the activation checklist and tab navigation. No parent callback or shell edit is required.
- `app/components/ui/feedback.tsx` — read-only shared dependency; use existing `Alert`, `Status`, `LoadingState`, and `EmptyState`. Do not change the primitive contracts or the shared `Dialog` implementation.
- `app/globals.css` — read-only semantic-token source; use existing product token classes and do not add or alter tokens in this change.
- `app/api/admin/services/route.ts` — read-only API dependency; confirms GET/POST contracts and server validation.
- `app/api/admin/services/[id]/route.ts` — read-only API dependency; confirms PATCH toggle/edit and DELETE soft-deactivation contracts.
- `tests/services-tab-presentation.test.ts` — recommended focused source-contract test for primitive mapping, light-surface boundary, preserved CRUD contracts, unchanged Spanish copy, and explicit Dialog exclusion. This follows the repository's existing Node/Vitest test convention.

## Behavior and Preservation Matrix

| Concern | Current contract to preserve | Safe exploration decision |
|---|---|---|
| Parent shell | Local tab navigation and `brand={theme}` input | Do not edit `DashboardClient`; Services remains self-contained. |
| Loading | `Cargando...`, polite `status`, list is not shown as empty while loading | Use `LoadingState` with the unchanged label and existing branch condition. |
| Empty | `Todavía no agregaste servicios. Creá el primero para que tus clientes puedan elegirlo.` | Use `EmptyState` with unchanged copy and no invented action. |
| Errors | Four distinct `serviceError` messages and current clearing/reload transitions | Use `Alert` with the existing message; retain the same error ownership and branch semantics. |
| Form labels/copy | Spanish labels, placeholders, required/min/step attributes, submit/cancel labels | Preserve byte-for-byte user-facing copy and validation attributes. |
| Create/edit | POST vs PATCH selection, normalized request body, `loadServices`, `resetForm` | Do not move or refactor handlers; presentation-only JSX change. |
| Toggle | PATCH body `{ active: !service.isActive }` and local matching-item update | Do not change callback or button labels (`Ocultar`/`Mostrar`). |
| Delete | Native `<dialog>`, confirmation text, DELETE endpoint, soft-delete API, trigger focus restoration | Keep native delete dialog markup, refs, effects, and behavior unchanged in this slice. |
| Tenant theme | `theme.primary` and `theme.textOnPrimary` style the submit action and service color fallback | Keep tenant values limited to accent/decorative/action presentation, never semantic feedback tones. |

## Approaches

1. **ServicesTab presentation-only migration with existing feedback primitives (recommended)** — replace only the returned light/dark composition and import the four existing primitives; leave all handlers, effects, refs, native delete dialog, and API calls unchanged.
   - Pros: smallest safe production boundary; directly addresses the P0 dark activation surface; preserves CRUD, validation, transitions, copy, and focus behavior; fits a sub-400-line chained slice.
   - Cons: the native delete dialog remains a dark exception; no browser evidence proves focus or visual behavior; no existing interaction test is available.
   - Effort: Medium.

2. **Also migrate the native delete dialog to the shared `Dialog`** — replace the native dialog with the controlled shared primitive while restyling the tab.
   - Pros: more visually uniform and removes one local dialog composition.
   - Cons: changes dialog semantics and browser behavior, risks focus entry/restoration and Escape/cancel behavior, and conflicts with the primitive contract's deferred browser guarantees and the audit dialog policy.
   - Effort: Medium/High.

3. **Extract service form/list subcomponents or CRUD hooks** — split the monolith while migrating styles.
   - Pros: potentially improves long-term maintainability.
   - Cons: unnecessary behavioral blast radius, larger review surface, harder preservation proof, and no need established by this P0 presentation slice.
   - Effort: High.

## Recommendation

Proceed with Approach 1. Migrate presentation only in `app/dashboard/ServicesTab.tsx`, using `LoadingState` for the existing loading branch, `EmptyState` for the existing no-services branch, `Alert` for the existing error branch, and `Status` for the visible active/hidden service state. Replace legacy-dark product surfaces with the existing light semantic tokens, retain tenant accent only for the submit action and service color decoration, and preserve every existing label and Spanish message.

The shared `Dialog` and the ServicesTab native delete dialog should remain unchanged in this slice. In particular, do not replace the native `<dialog>`, alter its refs/effects, add a focus trap, change Escape handling, or move confirmation state. This leaves a deliberate, documented dialog exception for a later browser-verified dialog slice while keeping the current trigger-focus restoration intact.

Add one focused Node/Vitest source-contract test before implementation under strict TDD. It should assert primitive imports/mappings, the absence of legacy dark product classes in the migrated presentation, preservation of the four API paths and methods/bodies, validation attributes, copy, native-dialog markers, and explicit absence of a shared `Dialog` import. Run the focused test first, then `npm test`; source tests must not be presented as browser/focus evidence.

Decision needed before apply: No  
Chained PRs recommended: No  
400-line budget risk: Low

## Risks

- A broad class replacement can accidentally alter tenant-accent inline styles or semantic status meaning; keep `theme.primary`/`theme.textOnPrimary` only on existing action/decorative paths.
- Moving error/loading/empty markup can change announcement behavior or suppress the existing error branch; preserve conditions and exact copy while changing only the primitive wrapper.
- The native dialog is deliberately excluded, so the P0 surface will be visually incomplete until a later dialog-specific evidence slice.
- The current source has no interaction coverage; `npm test` cannot prove native dialog focus entry/restoration, Escape behavior, responsive layout, contrast, or real fetch transitions.
- Existing unrelated dirty files are present in the worktree; implementation and verification must attribute only the ServicesTab slice and its focused test.
- The known production build environment blocker `BILLING_PRICE_NOT_CONFIGURED` may remain unrelated to this change; record it separately if encountered.

## Ready for Proposal

Yes. The proposal should authorize exactly one production consumer (`app/dashboard/ServicesTab.tsx`) plus one focused source-contract test, exclude `SettingsTab`, other dashboard routes, parent-shell/API/shared-primitive changes, and preserve the native delete dialog unchanged. The slice is bounded below the 400-line review budget and ready for strict-TDD design/task planning.

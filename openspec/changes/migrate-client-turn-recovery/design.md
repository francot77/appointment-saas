# Design: Migrate Client Turn Recovery

## Technical Approach

Migrate only the returned presentation of `MagicLinkClient` and `turno-actualizado` to the existing light product tokens and feedback primitives. `MagicLinkClient` lines 38–268 and `TurnoActualizadoPage` lines 28–58 remain behavior boundaries: except for imports, implementation diffs must start in their returned JSX. `turno-recibido` and every other consumer remain untouched.

## Branch-to-Primitive Map

| Existing branch | Presentation contract |
|---|---|
| `loading` in `MagicLinkClient` | `LoadingState` with unchanged “Cargando datos del turno...” label. |
| `error` | `Alert tone="danger" role="alert"`; preserve the retry button only when `!appt`, its handler, and copy. |
| `!loading && !appt && !error` | `EmptyState` with unchanged no-information copy; no invented action. |
| `confirmed` / `request` / `cancelled || rejected` | `Status` with respectively `success` / `warning` / `danger`; preserve each visible sentence. |
| `successMessage` | `Alert role="status"`; use `info` for the unchanged no-availability message and `success` otherwise, without changing its state or producers. |
| Static reschedule success in `turno-actualizado` | `Alert tone="success" role="status"` containing the existing heading and explanatory copy. |

`loadingSlots` and `saving` remain button-label/disabled branches; adding parallel loaders would duplicate announcements and change interaction presentation.

## Architecture Decisions

| Decision | Choice and rationale | Rejected tradeoff |
|---|---|---|
| Presentation boundary | Change imports and JSX/classes only; preserve handlers, effects, state, and server loading. | Extracting logic would enlarge the behavioral blast radius. |
| Light composition | Replace slate/black surfaces with `bg-[var(--color-canvas)]`, `bg-[var(--color-surface)]`, muted surface, content, border, action, focus, and semantic feedback classes. Keep hierarchy as light canvas → bordered surface → muted summary/notes regions. | New literals or changes to `globals.css` would bypass the authorized token contract. |
| Tenant ownership | Keep runtime color only on business identity and the existing primary confirmation/return actions; `accentColor` may decorate identity only. Never pass tenant colors into `Alert`/`Status`, canvas, cards, error, warning, or success meaning. | Tenant-tinted state/surfaces make semantics and contrast theme-dependent. |
| Native confirmation | Keep `window.confirm` unchanged. | `Dialog` would introduce unproved focus and interaction behavior. |

## Data and Behavior Boundary

    existing API/storage/state/query inputs → unchanged logic → existing branches
                                                       ↓
                         light wrappers + feedback primitives → same copy/actions

Immutable contracts include fetch URLs/methods/bodies, 10-second abort, token cleanup, `saveAppointment`, `removeSavedAppointmentByToken`, setters, date/slot selection, disabled predicates, `window.confirm`, query forwarding, `notFound`, canonical-slug redirect, `router.push`, hrefs, and all user-visible copy.

## File Changes and Delivery Gates

| Slice | Files | Rollback boundary |
|---|---|---|
| PR1 | Modify `app/r/[token]/MagicLinkClient.tsx`; create focused Node source-contract test | Revert PR1 only; no data/config rollback. |
| PR2 | Modify `app/[slug]/turno-actualizado/page.tsx`; extend the same test; target PR1 branch | Revert PR2 independently, then PR1 if full rollback is required. |

The test file is non-production; exactly two production consumers are authorized. Each slice must satisfy `additions + deletions < 400`, contain no other production path, and show a clean child diff against its immediate parent. If a slice reaches 400, simplify its JSX/test assertions; do not broaden scope or claim an exception.

Decision needed before apply: No  
Chained PRs recommended: No  
400-line budget risk: Low

The proposal's forced Feature Branch Chain remains the delivery rule despite the low size-based chaining recommendation.

## Strict-TDD Evidence

1. **RED:** add `tests/client-turn-recovery-presentation.test.ts` using the existing Vitest/Node `readFileSync` convention. Record a failing focused run proving missing primitive imports/light composition and remaining dark classes.
2. **GREEN:** implement one slice, then pass `npx vitest run tests/client-turn-recovery-presentation.test.ts`, `npm test`, `npx tsc --noEmit`, and `npm run lint`.
3. **REFACTOR:** inspect `git diff --word-diff=plain` for preserved copy and `git diff --numstat` for budget. The source contract locks primitive mapping, forbidden dark surface classes, critical endpoint/storage/redirect/query strings, and scope; it does not prove runtime behavior.

## Threat Matrix

N/A — routes and redirects are immutable; no routing, shell, subprocess, VCS automation, executable classification, or process-integration boundary changes.

## Deferred Guarantees

Browser focus, keyboard behavior, responsive layout at 390/768/1024/wide, visual appearance, tenant contrast, announcements in a real browser, touch/overflow, fetch/localStorage interaction, and end-to-end navigation remain explicitly deferred. Source checks and Node tests must not be reported as evidence for them. Production build remains separately subject to the known `BILLING_PRICE_NOT_CONFIGURED` environment blocker.

## Open Questions

None blocking.

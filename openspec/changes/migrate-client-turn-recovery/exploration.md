# Exploration: Migrate Client Turn Recovery

## Current State

The authorized foundation is available in `app/components/ui/feedback.tsx` and the product semantic variables are available from `app/globals.css`. The foundation is presentational: callers retain copy, async work, navigation, persistence, and state transitions. Its focused SSR contract tests pass, but they do not provide browser, focus, responsive, contrast, or interaction evidence.

The highest-priority customer journey is already connected as booking → received → manage → reschedule:

- `app/[slug]/turno-recibido/page.tsx` renders the booking acknowledgement and preserves the management-token link to `/r/:token`.
- `app/r/[token]/MagicLinkClient.tsx` loads the appointment, saves valid appointment data locally, removes expired/invalid saved entries, displays appointment status, cancels through `PATCH`, loads availability, and reschedules through `PATCH` before redirecting to `/:slug/turno-actualizado`.
- `app/[slug]/turno-actualizado/page.tsx` renders the reschedule result and preserves the tenant-slug redirect, query parameters, and return link.

The source audit classifies `turno-recibido` as mostly current/light, `MagicLinkClient` as legacy/dark, and `turno-actualizado` as mostly legacy/dark. The smallest safe migration therefore excludes `turno-recibido`: it is needed for journey continuity but is not the legacy presentation seam. The bounded consumer slice is the presentation layer of the two legacy consumers only.

## Affected Areas

- `app/r/[token]/MagicLinkClient.tsx` — migrate the JSX presentation region (approximately lines 270–475) from dark local feedback/status/loading/empty markup to the shared semantic primitives and Editorial-light hierarchy. Preserve logic in approximately lines 38–269 unchanged: fetch URLs, abort timeout, token expiry handling, `saveAppointment`, `removeSavedAppointmentByToken`, local state, `window.confirm`, cancellation, availability, rescheduling, `router.push`, and all copy semantics.
- `app/[slug]/turno-actualizado/page.tsx` — migrate the returned page presentation (approximately lines 59–159) to the light recovery composition and shared status/feedback primitives. Preserve server data loading, `notFound`, tenant-slug redirect, query-string forwarding, business identity, tenant accent inputs, summary values, and navigation.
- `app/[slug]/turno-recibido/page.tsx` — read-only continuity boundary; do not change in this slice because it is already light and its token/query redirect contract is not the legacy seam.
- `app/components/ui/feedback.tsx` — existing shared dependency; no change expected. `Alert`, `Status`, `LoadingState`, and `EmptyState` are the applicable contracts. Do not replace `window.confirm` with `Dialog`; the foundation explicitly leaves browser dialog guarantees and caller behavior to consumers.
- `lib/clientAppointmentsStorage.ts` — read-only behavior dependency. Its local-storage key, expiry filtering, five-entry cap, and token removal must remain untouched.
- `tests/frontend-design-primitives.test.ts` — existing convention is Node SSR contract testing only. It does not support client interaction, fetch mocking, browser navigation, localStorage, focus, or visual evidence; add focused tests only if a compatible existing test convention is discovered before apply.

## Approaches

1. **Two-consumer presentation migration (recommended)** — retain all component logic and replace only the recovery/status/feedback JSX and product-owned styling in `MagicLinkClient` and `turno-actualizado`.
   - Pros: completes the identified manage → reschedule seam; preserves APIs and state machinery; excludes the already-light received route; has a clear two-file rollback boundary; can remain below 400 authored changed lines.
   - Cons: browser guarantees remain unproven; `window.confirm` remains legacy by policy; no interaction test exists in the current suite.
   - Effort: Medium

2. **Migrate only `turno-actualizado` first** — modernize the result page without touching the management client.
   - Pros: smallest diff and low behavior risk.
   - Cons: leaves the highest-trust manage surface dark and makes the journey visibly inconsistent; does not meaningfully complete recovery migration.
   - Effort: Low

3. **Include `turno-recibido` for visual continuity** — restyle all three customer pages together.
   - Pros: one uniform customer journey composition.
   - Cons: unnecessary churn in an already-light route, larger review surface, and greater risk to received-link/query semantics without addressing the primary legacy seam.
   - Effort: Medium/High

## Recommendation

Use Approach 1 and authorize exactly two production consumers: `MagicLinkClient.tsx` and `turno-actualizado/page.tsx`. Limit edits to imports and returned JSX/class/style composition; do not alter effect handlers, fetch bodies, HTTP methods, query parameters, local appointment storage, redirects, or state setters. Use `LoadingState` for loading, `Alert` for retryable/error and success announcements, `EmptyState` for the no-appointment branch, and `Status` for visible appointment/result status labels. Keep cancellation as `window.confirm` and keep tenant colors confined to identity/action presentation, never semantic status meaning.

The implementation plan must forecast **Low** 400-line risk and include the exact guard lines: `Decision needed before apply: No`, `Chained PRs recommended: No`, and `400-line budget risk: Low`. If the JSX restyle exceeds the budget, split the two-file slice with `MagicLinkClient` first and `turno-actualizado` second rather than broadening scope.

## Runtime and Browser Evidence Gaps

- The audit has no browser or screenshot evidence for the four target viewports: 390, 768, 1024, and wide.
- No existing test convention proves fetch loading/error/success transitions, abort timeout behavior, token expiry cleanup, localStorage persistence, `window.confirm` cancellation, availability empty results, or reschedule navigation.
- Focus entry/restoration, keyboard interaction, announcements in a real browser, touch targets, overflow, and tenant contrast combinations remain unresolved. SSR primitive tests prove markup contracts only.
- Production build verification is currently externally blocked by `BILLING_PRICE_NOT_CONFIGURED`; `npm test` is the available regression command and previously passed after the foundation/dependency alignment.

These gaps must be recorded as limitations, not silently converted into runtime claims. A later browser-evidence slice is required for visual and interaction confirmation.

## Strict-TDD Strategy

1. RED: before production edits, use only an existing compatible focused test convention. The repository currently has SSR primitive tests but no consumer/browser harness, so do not invent interaction coverage in this exploration.
2. GREEN: implement the smallest two-consumer presentation change, keeping all behavior code byte-for-byte conceptually unchanged, then run `npm test` and TypeScript/lint checks scoped to the changed consumers where available.
3. REFACTOR: inspect the diff for copy, endpoint, state-transition, storage, redirect, and tenant-accent preservation; keep authored additions plus deletions below 400 lines.
4. Verification must separately report what source/SSR checks prove and what browser evidence cannot prove. Do not claim focus, responsive, visual, or real interaction guarantees from `npm test`.

## Risks

- Shared primitive adoption could accidentally change Spanish copy, announcement roles, disabled behavior, or retry visibility; preserve every existing semantic branch and message.
- Styling tenant-colored identity/action elements with product state classes could make status meaning tenant-dependent; keep product status tokens separate.
- Replacing `window.confirm` or changing controlled state would alter cancellation behavior and is explicitly out of scope.
- The two render regions are large enough that careless class-only churn could cross the 400-line budget; measure authored diff before apply.
- Lack of browser evidence leaves responsive, contrast, focus, and real state-transition regressions possible until a later evidence slice.

## Ready for Proposal

Yes. The proposal should authorize the two-file presentation-only migration, explicitly exclude `turno-recibido`, owner tabs, full booking flow, API/lib changes, dependency/config changes, and dialog behavior changes. It should carry the 400-line guard, strict-TDD limitation, exact preservation contract, and browser-evidence follow-up.

# Exploration: Frontend Design Primitives

### Current State

The completed `frontend-legacy-audit` establishes the dependency order `authority/tokens → primitives → route migrations` and identifies HS-01, HS-03, HS-05, UX-04, and UX-05 as the relevant findings. Product UI currently has no shared feedback module: loading, empty, error, success, status, and dialog markup are composed locally in `AppointmentsTab`, `AppointmentDetailClient`, `ServicesTab`, `SettingsTab`, `BillingClient`, `TurnosClient`, `MagicLinkClient`, and the recovery result pages.

`app/globals.css` contains global background/foreground variables plus marketing-only `.landing-page` variables. Product surfaces still use repeated Tailwind slate/indigo/emerald/amber/rose values and arbitrary colors. The audit's Editorial-light authority remains provisional, so this slice can define semantic ownership and stable names without asserting final canonical visual values or touching marketing selectors.

The repository has no existing frontend test files, Storybook setup, or browser test harness. `npm test` runs Vitest (`vitest run`) and can exercise React contracts with server-rendered markup; it does not prove focus behavior or visual appearance. The repository also has no `openspec/config.yaml`, so the cached preflight is the available SDD configuration for this change.

### Affected Areas

- `app/globals.css` — add product-scoped semantic CSS variables for canvas, surfaces, content, borders, action/focus, and success/warning/danger/info states; retain marketing variables as a scoped exception.
- `app/components/ui/feedback.tsx` — new shared contracts and implementations for `Alert`, `Status`, `LoadingState`, `EmptyState`, and a controlled `Dialog` shell. The module should be presentational and preserve caller-provided copy, actions, and tenant accent inputs rather than owning business behavior.
- `tests/frontend-design-primitives.test.tsx` — focused Vitest contract tests using `react-dom/server`; verify semantic roles, accessible labels, status text independent of color, optional retry/action rendering, and dialog labeling/ modal attributes.
- `app/dashboard/AppointmentsTab.tsx`, `app/dashboard/appointments/[id]/AppointmentDetailClient.tsx`, `app/dashboard/ServicesTab.tsx`, `app/dashboard/SettingsTab.tsx`, `app/billing/BillingClient.tsx`, `app/[slug]/TurnosClient.tsx`, `app/r/[token]/MagicLinkClient.tsx`, and recovery pages — identified consumers for later chained migrations, intentionally unchanged in this exploration and proposed foundation slice.

### Approaches

1. **Contract-first shared feedback module** — define semantic CSS variables and one typed `ui/feedback.tsx` module, then add server-rendered contract tests without migrating existing consumers.
   - Pros: establishes the importable API that prevents new inline legacy feedback; preserves all current route behavior; keeps the first PR independent of unresolved route/data-boundary decisions; fits the feature-branch-chain boundary.
   - Cons: existing duplication remains until later migration slices; Dialog focus behavior must be deliberately bounded and verified in a future browser/accessibility slice.
   - Effort: Low/Medium.

2. **Immediate extraction from `AppointmentsTab`** — create primitives while replacing its alerts, loading/empty states, and two dialogs in the same change.
   - Pros: proves the primitives against a high-traffic operational surface.
   - Cons: mixes foundation with behavior-preservation risk, dialog focus changes, appointment API/state regression risk, and likely exceeds the 400-line review budget; it would violate the audit's dependency-ordered migration boundary.
   - Effort: Medium/High.

### Recommendation

Proceed with approach 1 as PR1 of the new chained change. Define the following stable, semantic contracts in English identifiers while preserving existing Spanish caller copy:

- `Alert`: `tone` (`info | success | warning | danger`), `children`, optional retry/action content, `role="alert"` for actionable/error interruption and `role="status"` only when explicitly non-interruptive.
- `Status`: `tone`, visible `label`, and optional `description`; the label must communicate state without relying on color.
- `LoadingState`: required accessible `label`, `role="status"`, polite announcement, and no API/data ownership.
- `EmptyState`: required title, optional description, and optional action; it must be distinct from loading and error.
- `Dialog`: controlled `open`, accessible title, optional description, `onClose`, children, and explicit cancel/confirm slots. It is justified by UX-04 because the codebase has custom, native, and `window.confirm` patterns, but this slice should establish the contract rather than migrate or replace any existing dialog.

Use product semantic variables such as `--color-canvas`, `--color-surface`, `--color-surface-muted`, `--color-content`, `--color-content-muted`, `--color-border`, `--color-action`, `--color-focus`, and semantic state foreground/background/border variables. Do not encode tenant colors as product status tokens, do not change copy, endpoints, routes, validation, state transitions, or dialog callers, and do not modify `.landing-page` marketing semantics.

The planned authored change is approximately 320–380 lines: roughly 20–30 CSS lines, 210–250 primitive/contract lines, and 80–100 focused test lines. This remains below the 400-line budget with low-to-medium risk, provided no consumer migration or browser harness is added. Proposal should make the no-consumer-migration boundary explicit and reserve browser focus/visual verification for the subsequent recovery/consumer slices.

### Risks

- Editorial-light remains provisional; token names can be approved now, but exact final values and product authority still require owner confirmation.
- A Dialog contract can accidentally imply focus guarantees it does not implement. Proposal/design must specify Escape, focus entry/restoration, cancellation, destructive actions, and browser verification before any consumer migration.
- Server-rendered contract tests cannot prove keyboard focus, responsive behavior, contrast, or tenant runtime combinations; those remain later verification work.
- Existing consumers use Spanish copy and varied API/state semantics. Replacing markup in this foundation change could alter announcements, retry behavior, focus, or user-visible behavior, so consumer files must remain untouched.
- `openspec/config.yaml` is absent even though the cached preflight specifies OpenSpec, strict TDD, and `npm test`; the next SDD phase should preserve those explicit constraints and flag the missing config rather than invent project rules.

### Ready for Proposal

Yes — propose the contract-first foundation slice with the three planned files, strict TDD through `npm test`, a forecast below 400 authored changed lines, and an explicit exclusion of Services, Settings, MagicLink, recovery routes, all route migrations, visual harness work, and production consumer edits beyond the new primitive module itself.

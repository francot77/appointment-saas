# Exploration: Migrate Settings Tab Messaging and Sticky Save Feedback

## Current State

`DashboardClient` renders `<SettingsTab />` without props or callbacks. `SettingsTab` therefore owns the main settings object, the `/api/admin/settings` GET/PUT lifecycle, `saveState`, `saving`, and the form-level save handler. The parent contract is a no-props default export and must remain unchanged.

The final SettingsTab migration boundary has two separate presentation concerns:

1. **Messaging configuration composition** — `SettingsTab.tsx` renders `<MessagingSettingsCard />` between the public header and the main settings form. The card is a self-contained state machine in `app/dashboard/MessagingSettingsCard.tsx`: it loads `/api/admin/messaging/connection`, normalizes masked connection/template data, loads `/api/admin/entitlements`, presents the entitlement state through `presentAutomaticMessaging`, and independently saves with `PUT /api/admin/messaging/connection`. Its `saving` and `error` state must not be joined to the main settings `saveState`.
2. **Main sticky save/status bar** — `SettingsTab.tsx` owns the sticky bar at the end of the main form. It reflects only `saveState` (`unsaved`, `saving`, `saved`, `error`) and `saving`, submits the existing form handler, and currently uses legacy-dark slate classes. It is independent from messaging save feedback.

The messaging card is already a light surface, but its implementation uses local `slate`, `red`, `emerald`, and `indigo` classes and English owner-facing copy inside an otherwise Spanish dashboard. Because this change is explicitly production-scoped to `app/dashboard/SettingsTab.tsx`, the card internals and its copy cannot be migrated here. The safe SettingsTab-only action is to preserve the `<MessagingSettingsCard />` composition unchanged and migrate only the sticky bar in this file; a full semantic-token migration of the card would require an out-of-scope edit to `MessagingSettingsCard.tsx`.

## Affected Areas

- `app/dashboard/SettingsTab.tsx` — only production file authorized; restyle the sticky save/status presentation and preserve the messaging-card composition, main form state, handlers, copy, and APIs.
- `app/dashboard/MessagingSettingsCard.tsx` — read-only dependency; preserve connection/template fields, masked identifiers, entitlement display, independent load/save state, error handling, write-only token behavior, and messaging PUT body.
- `app/dashboard/DashboardClient.tsx` — read-only parent evidence; preserve the no-props `<SettingsTab />` invocation and tab activation behavior.
- `app/components/ui/feedback.tsx` — read-only primitive contract; `Status` may represent sticky state only if its visible labels and live-region semantics remain intact. Do not extend or modify primitives.
- `app/api/admin/messaging/connection/route.ts` — read-only API contract; preserve GET redaction/defaults, PUT fields, optional access-token handling, validation, and independent entitlement gate.
- `app/api/admin/entitlements/route.ts` and `lib/entitlementPresentation.ts` — read-only entitlement display contracts; preserve available, unavailable, approaching, reached, uncertain, and enterprise/custom states and advisory-only semantics.
- `lib/messaging/settings-contract.ts` — read-only normalization contract; preserve masked connection IDs, approved-template derivation, disabled/disconnected defaults, and safe lead-time fallback.
- `tests/messaging-settings.test.ts` and messaging route tests — read-only existing behavioral evidence; these cover normalization/API behavior, not rendered Settings presentation.
- `openspec/changes/frontend-legacy-audit/`, `openspec/changes/frontend-design-primitives/`, and completed SettingsTab slice artifacts — guardrails and prior preservation evidence for semantic ownership, primitives, strict TDD, and the 400-line review boundary.

## Preservation Contracts

### Messaging card

- Keep the exact `<MessagingSettingsCard />` parent composition and do not pass new props, extract state, or move ownership.
- Preserve connection fields: masked Sender ID and WABA ID, enable checkbox, reminder lead time (`0..10080`), write-only access token with `autoComplete="new-password"`, and approved-template rows for confirmed, rescheduled, and reminder events.
- Preserve entitlement display from `/api/admin/entitlements`, including plan/allowance/period values, unavailable/quota/uncertain/custom distinctions, and the billing upgrade link when supplied.
- Preserve independent messaging loading/error/save branches, `saving` disabled behavior, secret-safe payload construction, and the exact messaging PUT endpoint/body.
- Do not translate the existing English copy in this slice; the audit identifies it as a product-language issue, but copy changes are explicitly excluded.

### Main settings form and sticky bar

- Preserve `handleSave`, `update`, `saving`, `saveState`, `error`, `settings`, and the complete `JSON.stringify(settings)` PUT body.
- Preserve all four state transitions and exact Spanish copy: unsaved changes, saving, all changes saved, and save failure.
- Preserve the submit button's `type="submit"`, disabled predicate, labels, form ownership, `aria-live="polite"`, sticky positioning (`sticky bottom-3`), responsive flex layout, and z-index behavior.
- Do not make messaging edits update the main `saveState`, and do not make the main save button submit messaging settings.
- Preserve all completed public/business and appearance migrations and their APIs, slug state machine, tenant-owned raw values, and no-props parent contract.

## Approaches

1. **SettingsTab-only sticky presentation migration (recommended)** — keep `<MessagingSettingsCard />` byte-for-byte composed in `SettingsTab.tsx`; replace only the sticky bar's product-owned slate surface, border, text, button, hover, and disabled classes with existing semantic light tokens. Optionally map each existing state branch to the existing `Status` primitive only if the exact visible copy and live-region behavior remain provable.
   - Pros: satisfies the one-production-file boundary; smallest diff; isolates main save feedback; preserves the independently stateful messaging card and all API contracts; fits comfortably below 400 authored lines.
   - Cons: the messaging card retains local slate/state classes and English copy; it becomes a deliberate light-but-not-tokenized exception until a separate card-scoped change is authorized.
   - Effort: Low.

2. **SettingsTab wrapper/class override** — pass a wrapper or `className` from `SettingsTab.tsx` around the messaging card while migrating the sticky bar.
   - Pros: can align outer spacing or placement without editing the card file.
   - Cons: cannot replace the card's internal slate classes, status semantics, or English copy; adds styling indirection without materially migrating the card.
   - Effort: Low, but low value.

3. **Full messaging-card semantic migration** — edit `MessagingSettingsCard.tsx` as well as `SettingsTab.tsx`, replacing local product classes with semantic tokens and shared feedback primitives.
   - Pros: achieves actual card-level visual consistency and could improve error/status semantics.
   - Cons: violates the explicit one-file production boundary, risks changing independent connection/entitlement state behavior, expands copy scope, and needs a separate focused contract test; reject for this change.
   - Effort: Medium.

## Recommendation

Proceed with Approach 1. Treat the messaging card as a read-only, already-light composition boundary and migrate only the sticky main-settings bar in `SettingsTab.tsx` using existing semantic surface/content/border/action/focus tokens. Keep the four existing state branches and Spanish copy unchanged; use the existing `Status` primitive only if its contract can preserve the current live-region and visible-label behavior without coupling state. Do not edit `MessagingSettingsCard.tsx`, APIs, libraries, shared primitives, dependencies, configuration, parent wiring, or any other dashboard file.

The focused strict-TDD source-contract test should be a new test artifact, not production scope. It should prove the sticky semantic-token boundary, exact state/copy/submit markers, `sticky bottom-3`, independent `<MessagingSettingsCard />` composition, and preservation of messaging fields/endpoints/body markers by inspecting the read-only card source. It should explicitly record that source tests do not prove browser sticky positioning, responsive layout, focus rendering, contrast, or runtime entitlement presentation.

Forecast: approximately 100–180 authored changed lines including one focused source-contract test and the SettingsTab presentation diff, below the 400-line budget. Use the supplied automatic OpenSpec, strict-TDD `npm test`, force-chained/feature-branch-chain delivery policy. No blocking product decision is required for this bounded SettingsTab-only slice.

## Risks

- A shared `Status` substitution could alter DOM semantics or announcements; preserve the existing polite live region and exact visible copy, or retain the current conditional text within the semantic bar.
- Messaging save state is independent from main settings save state; coupling either button, disabled predicate, error message, or status would be a behavior regression.
- The card's English copy and local slate classes cannot be fixed without violating the one-file boundary; this is an intentional deferred exception, not evidence that the card was fully migrated.
- Entitlement presentation is advisory and must not become a client-side authorization gate beyond the existing disabled checkbox behavior.
- Source-contract tests cannot prove sticky positioning, responsive overflow, keyboard focus, color contrast, or runtime connection/entitlement states.
- `openspec/config.yaml` is absent in the current worktree; use the supplied preflight constraints and record that absence for downstream phases.
- The worktree contains unrelated staged, unstaged, and untracked changes; later scope checks must attribute only the authorized change files and preserve all existing work.

## Ready for Proposal

Yes. Authorize one feature-branch-chain implementation unit limited to `app/dashboard/SettingsTab.tsx` plus a focused source-contract test and OpenSpec bookkeeping. The proposal must explicitly exclude `MessagingSettingsCard.tsx` implementation/copy changes, public form, appearance, APIs, libraries, dependencies, configuration, shared primitives, parent wiring, tenant readability logic, and browser harness work.

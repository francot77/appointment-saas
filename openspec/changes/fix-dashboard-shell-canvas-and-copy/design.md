# Design: Reorder the Dashboard Around Daily Work

## Technical Approach

Keep the current client, tab, endpoint, and card boundaries. Recompose only `DashboardClient` so the default Turnos content renders before activation and sharing, add a mounted-visit activation state machine, and move public-link markup into a sibling local utility. Make `MessagingSettingsCard` return no UI until a paid entitlement resolves. Existing neutral canvas, responsive appointment controls, Spanish copy, handlers, and request contracts remain unchanged.

## Architecture Decisions

| Decision | Alternative | Rationale |
|---|---|---|
| Reorder JSX inside `DashboardClient`; keep all tab components | Introduce a dashboard-layout component | The existing boundary already owns hierarchy and activation data. A new layer adds no behavior. |
| Track `unresolved \| incomplete \| completion \| suppressed` in component state | Persist dismissal; infer visibility only from API data | Mounted state implements session-only acknowledgement without storage or API changes. |
| Extract `PublicLinkUtility` beside `ActivationChecklist` in the same file | Keep sharing nested; create a new file | A sibling makes sharing independent of checklist visibility while retaining handlers and avoiding a new public interface. |
| Fail closed inside `MessagingSettingsCard` from its existing entitlement read | Change entitlement APIs or lift data into `SettingsTab` | `null` already represents loading/failure; checking `entitlement.plan` locally preserves API and parent contracts. |

## Composition and State Flow

```text
activation GET ─→ activation data ─→ visit-state transition ─→ checklist/acknowledgement
       │                  └────────→ publicLinkAvailable ─────→ sharing utility
entitlements GET ─→ unresolved/basic: null UI | premium/enterprise: existing card
```

Within the current `section`, render `AppointmentsTab` first when `tab === 'appointments'`, then contextual activation and independent sharing, then the existing non-appointment tab branches. Thus Turnos leads the initial viewport while activation/sharing retain their current shell ownership and other tab behavior.

Activation transitions after each accepted, non-stale activation response:

| Current | Response/action | Next | Visible result |
|---|---|---|---|
| `unresolved` | incomplete | `incomplete` | Checklist below Turnos |
| `unresolved` | complete | `suppressed` | No completion replay on mount/remount |
| `incomplete` | complete | `completion` | “Todo listo” acknowledgement for this mount |
| `completion` | acknowledge | `suppressed` | Checklist hidden for the remaining mount |
| any | incomplete | `incomplete` | Current setup guidance restored |
| `completion`/`suppressed` | complete refresh | unchanged | No duplicate acknowledgement |

`complete` remains the existing three configured steps plus `publicLinkAvailable`. `PublicLinkUtility` renders solely when `activation?.checklist.publicLinkAvailable`; it never reads visit state. It reuses `publicUrl`, open-link markup, `copyPublicUrl`, `sharePublicUrl`, copied feedback, focus styles, and accessible names.

## File Changes

| File | Action | Exact change |
|---|---|---|
| `app/dashboard/DashboardClient.tsx` | Modify | Reorder branches; add visit state and acknowledgement; split sharing into local `PublicLinkUtility`. Preserve fetch cancellation, navigation, URLs, and handlers. |
| `app/dashboard/MessagingSettingsCard.tsx` | Modify | After all hooks, return `null` for unresolved or `basic`; render the existing paid card unchanged for `premium`/`enterprise`. |
| `tests/dashboard-presentation.test.ts` | Modify | Add source contracts for render order, every transition, acknowledgement suppression/remount default, and sharing conditioned only by `publicLinkAvailable`; retain canvas, copy, request, and responsive contracts. |
| `tests/settings-tab-messaging-presentation.test.ts` | Modify | Assert unresolved/Basic null guard, paid path retention, unchanged no-props parent, connection/entitlement reads, save payload, and manual WhatsApp independence in `SettingsTab`. |

No other production or test file changes are planned. In particular, do not modify `app/api/admin/activation/route.ts`, `app/api/admin/entitlements/route.ts`, `lib/entitlements.ts`, `lib/plans/catalog.ts`, `lib/entitlementPresentation.ts`, `app/billing/BillingClient.tsx`, public pages, or global primitives.

## Testing and Browser Verification

Run `npm test -- tests/dashboard-presentation.test.ts tests/settings-tab-messaging-presentation.test.ts`, then `npm test`, `npm run lint`, and `npm run build`.

Use browser tooling against representative incomplete, transition-to-complete, initially complete, Basic, unresolved, Premium, and Enterprise responses. At 390, 768, 1024, and 1440 CSS pixels, plus 200% zoom, verify: Turnos precedes support content; incomplete activation follows it; completion appears once, dismisses, stays hidden after focus/tab refresh, and is suppressed after remount; valid open/copy/share remains usable whenever activation is hidden; Basic/loading/error expose no automatic-messaging text, placeholder, error, quota, upsell, or action; paid states remain intact. Keyboard-check logical focus order, visible focus, unchanged names/status feedback, and confirm `scrollWidth <= clientWidth`. Record screenshots and explicitly mark unexercised claims unverified.

## Threat Matrix

N/A — no routing, shell command, subprocess, VCS/PR automation, executable classification, or process-integration boundary changes.

## Migration / Rollout

No migration or flag. Deliver one force-chained Feature Branch Chain slice below 400 authored changed lines; revert the four-file slice together. No data or API rollback is required.

## Open Questions

None.

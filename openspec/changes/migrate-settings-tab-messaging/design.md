# Design: Migrate Settings Tab Messaging and Sticky Save Presentation

## Technical Approach

Apply an in-place migration only to the final sticky bar in `SettingsTab`. Keep the existing `<form>`, `handleSave`, `update`, state variables, request body, and `<MessagingSettingsCard />` composition unchanged. Replace legacy slate chrome with `--color-surface`, `--color-border`, `--color-content`, `--color-action`, and `--color-focus` classes. Keep the existing polite live region and render each unchanged conditional label with `Status` using warning, info, success, or danger tone.

## Architecture Decisions

| Decision | Choice and rationale | Rejected tradeoff |
|---|---|---|
| Ownership boundary | Edit sticky JSX in place; keep `SettingsTab()` no-props and messaging self-owned. This preserves two independent save state machines. | Lifting messaging state or adding callbacks would couple unrelated APIs and disabled states. |
| Feedback mapping | Retain four explicit `saveState === ...` branches and exact copy, substituting `Status` inside the existing polite live region. | A new state model or copy map is an unnecessary behavior refactor; hand-built colored spans bypass the primitive contract. |
| Product styling | Use light semantic surface/border/content/action/focus tokens on the bar and submit button. Preserve `sticky bottom-3`, `z-10`, backdrop, shadow, responsive layout, and disabled predicate. | Local slate/status utilities retain legacy ownership; changing layout risks sticky behavior. |
| Static evidence | Add one Node/Vitest source-contract test that inspects `SettingsTab`, read-only `MessagingSettingsCard`, and read-only `DashboardClient`. | Component/browser setup would require excluded configuration and imply unavailable runtime guarantees. |

## Data Flow

    main field ──update──> settings + saveState=unsaved
                              │
    main submit ──handleSave───┴──> PUT /api/admin/settings ──> main Status

    MessagingSettingsCard local state ──> /api/admin/messaging/connection
                 └──────── entitlement ──> /api/admin/entitlements

The flows share only visual composition. Neither state machine, request, error, button, nor disabled condition crosses the boundary.

## File Changes

| File | Action | Description |
|---|---|---|
| `app/dashboard/SettingsTab.tsx` | Modify | Migrate only sticky save/status presentation. |
| `tests/settings-tab-messaging-presentation.test.ts` | Create | Lock semantic presentation, state/API preservation, messaging isolation, and parent contract. |

No other implementation, test, API, library, primitive, dependency, or configuration file may change.

## Interfaces / Contracts

No interface changes. Preserve `export default function SettingsTab()`, `<SettingsTab />`, and `<MessagingSettingsCard />` without props.

The focused test MUST assert:

- sticky/responsive/z-index classes, semantic tokens, `Status` use, no legacy slate classes in the extracted bar, exact four conditions and labels, polite live region, submit type, `disabled={saving}`, and button labels;
- `update`, all four `setSaveState` transitions, `handleSave`, `/api/admin/settings`, PUT headers, and `body: JSON.stringify(settings)`;
- messaging-local `saving`/`error` state, connection GET/PUT, entitlement GET, payload fields, optional `accessToken`, lead-time bounds, template events, write-only autocomplete, existing copy, and messaging button predicate;
- unchanged no-props parent/card composition and completed non-sticky `SettingsTab` boundaries.

## Testing Strategy

1. **RED** — create only the focused test; run `npx vitest run tests/settings-tab-messaging-presentation.test.ts` and retain the expected legacy-presentation failure.
2. **GREEN** — make the minimum sticky JSX/class changes; rerun the focused command.
3. **REFACTOR** — simplify only within the sticky boundary; run `npm test`, `npx tsc --noEmit`, `npm run lint`, and `git diff --check`.

Before delivery, the implementation delta MUST list exactly the two files above. Use `git diff --numstat <slice-base>...HEAD -- app/dashboard/SettingsTab.tsx tests/settings-tab-messaging-presentation.test.ts`; **400 or more** additions plus deletions fails the gate. Forecast: 100–180 authored lines, low budget risk.

Node source inspection does not prove browser stickiness, responsive overflow, focus rendering, visual contrast, live announcements, or runtime connection/entitlement states.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary changes.

## Migration / Rollout

No data migration or flag is required. Deliver one forced Feature Branch Chain unit. Roll back by reverting the two implementation files; messaging, APIs, data, primitives, parent wiring, and configuration require no rollback.

## Open Questions

None blocking.

# Design: Migrate Settings Tab Appearance

## Technical Approach

Apply an in-place, appearance-only presentation migration to the `aria-labelledby="appearance-title"` section of `SettingsTab`. Replace product-owned slate surfaces, borders, content, and focus styles with the existing Editorial-light variables: `--color-surface`, `--color-surface-muted`, `--color-content`, `--color-content-muted`, `--color-border`, and `--color-focus`. Keep tenant and preset colors only in the existing inline swatches and controlled values. Do not extract components, introduce helpers, or change copy, behavior, APIs, or public readability ownership.

## Architecture Decisions

| Decision | Choice and rationale | Rejected tradeoff |
|---|---|---|
| Migration boundary | Edit only the appearance section JSX in `SettingsTab.tsx`; preserve the no-props component and current state ownership. This isolates the legacy-dark exception without disturbing the completed public-settings slice. | Extraction, a live preview, or whole-file cleanup would change ownership and exceed this presentation slice. |
| Product versus tenant color | Product chrome consumes Editorial-light semantic variables. Preset/custom values remain raw tenant-owned data used by existing controls and inline `backgroundColor` swatches only. | Normalizing, validating, or mapping tenant colors to product status tokens would change persisted behavior and semantic ownership. |
| Control behavior | Preserve the preset tuple values, three sequential `update` calls, exact `aria-pressed` predicates, paired picker/text controls, and `solid`/`gradient`/`image` conditional branches. | New reducers, validation, or branch refactors add behavioral risk without supporting the visual migration. |
| Evidence | Add one Node/Vitest `readFileSync` source-contract test that extracts the appearance section by stable ARIA boundaries and checks both migration and preservation markers. | Browser tests are not available in the current Node-only Vitest setup and would overclaim runtime visual evidence. |

## Data Flow

    preset button ──three existing update calls──┐
    raw custom/background/logo input ──update───┼──> settings state
                                                  └──> JSON.stringify(settings) PUT
    tenant values ──existing inline swatches────────> visual sample only
    public consumers ──existing validation/contrast──> runtime readable output

`update` continues to merge one key and set `saveState` to `unsaved`. `handleSave` continues to send the complete settings object and retains current saving, saved, error, and generic-error transitions.

## File Changes and Scope

| File | Action | Description |
|---|---|---|
| `app/dashboard/SettingsTab.tsx` | Modify | Replace classes only inside the appearance section. |
| `tests/settings-tab-appearance-presentation.test.ts` | Create | Focused static contract for semantic styling, tenant ownership, behavior, and isolation. |

No other file may change. In particular, `MessagingSettingsCard`, the sticky save/status bar, `DashboardClient`, APIs, models, globals, shared primitives, public consumers, configuration, and dependencies are excluded.

## Interfaces / Contracts

No interface is added. `SettingsTab()` remains no-props. The test MUST preserve:

- exact preset names/hex tuples, inline swatches, three `update` calls, and three-value `aria-pressed` selection;
- `primaryColor`, `secondaryColor`, `textColor`, `backgroundType`, `backgroundColor`, `gradientFrom`, `gradientTo`, `backgroundImageUrl`, and always-visible `logoUrl` controlled values and updates;
- exact conditional checks for `solid`, `gradient`, and `image`, with no local `contrastRatio` or `readableText` logic;
- `body: JSON.stringify(settings)`, `setSaveState('unsaved'|'saving'|'saved'|'error')`, save-error markers, and `<SettingsTab />` parent invocation;
- unchanged `<MessagingSettingsCard />` and legacy sticky-bar boundary.

Within the extracted appearance section, assert all required semantic variables and absence of `bg-slate-`, `border-slate-`, and `text-slate-` product classes.

## Testing Strategy

Strict TDD sequence:

1. **RED** — create only the focused test; run `npx vitest run tests/settings-tab-appearance-presentation.test.ts` and retain the expected semantic-presentation failure.
2. **GREEN** — make only the minimum appearance-section class edits; rerun the focused command.
3. **REFACTOR** — simplify without changing selectors or behavior; run `npm test`, `npx tsc --noEmit`, `npm run lint`, and `git diff --check`.

Before delivery, `git diff --name-only <slice-base>...HEAD` MUST list exactly the two files above. Sum additions and deletions with `git diff --numstat <slice-base>...HEAD -- app/dashboard/SettingsTab.tsx tests/settings-tab-appearance-presentation.test.ts`; the gate fails at **400 or more** authored changed lines. Forecast: 100–180 lines, low budget risk.

Source contracts prove static structure only. Real-browser contrast, focus rendering, responsive layout, visual appearance, and public runtime readability evidence are explicitly deferred.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary changes.

## Migration / Rollout and Rollback

No data migration or feature flag is required. Deliver as one Feature Branch Chain slice. Roll back by reverting the two-file slice; tenant data, APIs, models, public consumers, shared tokens, messaging, and sticky-save behavior require no rollback.

## Open Questions

None blocking.

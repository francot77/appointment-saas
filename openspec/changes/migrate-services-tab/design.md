# Design: Presentation-Only Services Tab Migration

## Technical Approach

Change only the `ServicesTab` imports and returned presentation. Existing state, effects, handlers, API requests, normalization, validation, copy, tenant accents, and native delete-dialog block remain in place. The migrated header, form, controls, list, and cards use existing product variables through Tailwind arbitrary-value classes; shared feedback primitives replace only the current loading, error, empty, and active/hidden markup.

## Architecture Decisions

| Decision | Choice and rationale | Rejected tradeoff |
|---|---|---|
| Behavioral boundary | Keep all code before `return` unchanged and edit only imports plus JSX/classes. This makes presentation reviewable independently from service behavior. | Extracting hooks or child components would increase behavioral and line-count risk. |
| State mapping | Render `LoadingState` with `Cargando...`; `Alert tone="danger" role="alert"` with the existing error; `EmptyState` with the unchanged empty copy and no action; and `Status` as `success/Activo` or `info/Oculto`. Conditions and visible labels remain unchanged. | Local state markup preserves fragmentation; tenant colors or raw emerald/slate badges would retain non-semantic status ownership. |
| Light styling | Use `--color-surface`, `--color-surface-muted`, `--color-canvas`, `--color-border`, `--color-content`, `--color-content-muted`, `--color-focus`, and danger tokens on product-owned surfaces, fields, cards, and controls. Preserve `theme.primary`, `theme.textOnPrimary`, and the service-color fallback only on the existing submit action and color strip. | New tokens, primitive changes, or raw light literals exceed this consumer migration. |
| Dialog exception | Preserve the native delete overlay and `<dialog>` subtree byte-for-byte, including dark classes, refs, `showModal`, cancel/close handlers, copy, and trigger-focus restoration. Tests isolate this suffix before checking for forbidden dark classes. | Shared `Dialog` would alter untested native focus, Escape, and close behavior. |
| Evidence boundary | Use a Node/Vitest source-contract test. It proves source preservation and isolation, not rendered appearance, contrast, responsiveness, announcements in a browser, or focus execution. | Adding DOM/browser tooling violates scope and the two-file review boundary. |

## Data Flow

```text
GET/POST/PATCH/DELETE -> existing handlers/state -> unchanged branch conditions
                                              -> feedback primitives + token classes
BrandConfig -------------------------------> submit action + service color strip only
deleteTarget/refs --------------------------> unchanged native dialog and focus lifecycle
```

## File Changes

| File | Action | Description |
|---|---|---|
| `tests/services-tab-presentation.test.ts` | Create | Focused source contracts written first. |
| `app/dashboard/ServicesTab.tsx` | Modify | Import four primitives and migrate only non-dialog presentation. |

No other production, test, configuration, token, primitive, API, parent-shell, or consumer file may change. `SettingsTab` and every other consumer are explicitly excluded.

## Interfaces / Contracts

No new interface is introduced. `ServicesTab({ brand?: BrandConfig })`, `Service`, local state, and primitive APIs remain unchanged. The source test must assert:

- all four primitive imports/usages and no `Dialog` import;
- exact loading/error/empty/status conditions and copy;
- semantic token classes and no legacy-dark utilities in the source prefix before `{deleteTarget && (`;
- the unchanged dialog suffix markers, refs, handlers, confirmation copy, and dark class exception;
- GET/POST/PATCH/DELETE paths, methods, headers, normalized bodies, reload/reset, toggle update, and DELETE edit reset;
- required/min/step attributes, labels/placeholders, saving disable/labels, and focus-restoration effect.

## Testing Strategy

1. **RED:** create the focused test; run `npx vitest run tests/services-tab-presentation.test.ts` and require failures only for missing primitive/token presentation.
2. **GREEN:** make the smallest `ServicesTab` presentation edit; rerun the focused test.
3. **REFACTOR:** inspect the production diff for JSX/class-only changes, then rerun the focused test.
4. **Regression/static:** run `npm test`, `npx tsc --noEmit`, and `npm run lint`.
5. **Scope/size gates:** `git diff --name-only` must list only the two files above. Sum additions plus deletions from `git diff --numstat` and stop if the slice reaches 400 changed lines. Forecast: 180–300 changed lines; no chaining is expected.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary changes.

## Migration / Rollout and Rollback

No data migration or feature flag is required. Roll back both files together. This restores the previous presentation without API, data, parent, primitive, token, configuration, or native-dialog rollback.

## Open Questions

None blocking. Browser, visual, responsive, contrast, and focus evidence remains deferred to a separately authorized slice.

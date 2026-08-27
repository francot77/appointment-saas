# Design: Contract-First Frontend Design Primitives

## Technical Approach

Add a three-file, importable foundation before any route migration: product-owned semantic variables in `app/globals.css`, typed presentational contracts in `app/components/ui/feedback.tsx`, and Node-based SSR contract tests in `tests/frontend-design-primitives.test.ts`. Tests lead implementation through RED-GREEN-REFACTOR. The test uses `React.createElement` because the current Vitest include is `tests/**/*.test.ts`; changing `vitest.config.mts` or adding a browser harness would break the three-file boundary.

## Architecture Decisions

| Decision | Choice and rationale | Rejected tradeoff |
|---|---|---|
| Token ownership | Add stable `:root` product variables for canvas, surface/default-muted, content/default-muted, border, action, focus, and info/success/warning/danger foreground-background-border triplets. Values are provisional; names and ownership are the contract. | Reusing Tailwind literals would preserve fragmentation. Treating Editorial-light values as approved would overstate the audit evidence. |
| Marketing and tenant boundaries | Leave `.landing-page` variables and selectors byte-for-byte unchanged. Existing `BrandConfig`/tenant scopes continue to own accent, approved background, logo, and readable-text adaptation; tenant accent never supplies product status meaning. | Aliasing `--color-success` or other state tokens to tenant colors would make semantics runtime-theme dependent. |
| Feedback API | Export one dependency-free typed module. Components own markup and semantic classes only; callers own copy, async work, retries, actions, and state transitions. | Hooks, fetches, copy maps, or route-specific adapters would couple the foundation to consumers. |
| Dialog boundary | `Dialog` is controlled by `open`; it renders nothing when closed and never stores open state. `onClose` is invoked only by its explicit close affordance in this slice. Cancel and confirm are caller-supplied slots. | Backdrop dismissal, Escape handling, focus trapping, and action execution would imply browser guarantees this slice cannot prove. |
| Verification boundary | Use `renderToStaticMarkup` under the existing Node Vitest environment to prove SSR output and types. | DOM emulation would add dependencies; SSR tests cannot prove runtime focus or visual behavior. |

## Data Flow

    caller state/copy/actions ──props──> feedback primitive ──> semantic HTML + token classes
    tenant accent ─────────────wrapper/action slot only; never──> product status tokens
    Dialog event ──onClose callback──> caller-owned state transition

No primitive reads application state, calls an API, or changes navigation.

## File Changes

| File | Action | Description | Authored forecast |
|---|---|---|---:|
| `app/globals.css` | Modify | Add product semantic variables only; preserve existing globals and `.landing-page`. | 25–35 |
| `app/components/ui/feedback.tsx` | Create | Typed `Alert`, `Status`, `LoadingState`, `EmptyState`, and controlled `Dialog`. | 190–220 |
| `tests/frontend-design-primitives.test.ts` | Create | SSR accessibility and optional-slot contracts. | 90–110 |

Forecast: **305–365 authored lines**, below the 400-line review budget.

## Interfaces / Contracts

```ts
export type FeedbackTone = 'info' | 'success' | 'warning' | 'danger';
export type AlertProps = { tone: FeedbackTone; role: 'alert' | 'status'; children: ReactNode; retry?: ReactNode; action?: ReactNode };
export type StatusProps = { tone: FeedbackTone; label: string; description?: ReactNode };
export type LoadingStateProps = { label: string };
export type EmptyStateProps = { title: string; description?: ReactNode; action?: ReactNode };
export type DialogProps = { open: boolean; title: string; description?: ReactNode; closeLabel: string; onClose: () => void; children?: ReactNode; cancel?: ReactNode; confirm?: ReactNode };
```

- `Alert` renders the caller-selected `role`; non-interruptive feedback MUST explicitly use `status`. Retry and action slots are optional and rendered unchanged.
- `Status` always renders its visible `label`; tone/color is supplementary. `description` is optional and does not replace the label.
- `LoadingState` renders `role="status"`, `aria-live="polite"`, and the required visible label. It owns no loading state.
- `EmptyState` renders a named region with a visible title, optional description, and optional action. It is not an error or loader.
- Open `Dialog` renders `role="dialog"`, `aria-modal="true"`, generated title/description IDs, and `aria-labelledby`/conditional `aria-describedby`. Its close button uses `closeLabel`; cancel/confirm slot behavior remains caller-owned.
- Semantic state styles consume only product state variables. Caller action nodes may retain existing tenant accent behavior during later migrations.

## Testing Strategy

| Layer | Contract | Verification |
|---|---|---|
| RED SSR | Roles, live-region attributes, visible labels, tone classes, optional retry/action output, closed-dialog omission, and open-dialog modal/ID relationships | `npx vitest run tests/frontend-design-primitives.test.ts` |
| Regression | Existing suite remains green | `npm test` |
| Static | Type and lint compatibility | `npx tsc --noEmit`; `npm run lint` |

SSR assertions inspect semantic output, not fragile full-markup snapshots. No consumer imports are added.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout and Rollback

No migration or feature flag is required. Rollback is independently bounded: remove the new `:root` variables, delete `feedback.tsx`, or delete its contract test. A full three-file revert restores the exact prior runtime because no existing consumer changes.

Explicitly deferred to later authorized slices: route/consumer migration; real-browser focus entry, focus trapping, and restoration; Escape/backdrop behavior; visual contrast (including tenant combinations); responsive validation; and visual/browser evidence.

## Open Questions

None blocking. Final token values remain subject to product approval without changing the contracts above.

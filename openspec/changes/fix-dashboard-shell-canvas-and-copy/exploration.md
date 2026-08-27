# Fix Dashboard Shell Canvas and Copy — Exploration

## Exploration: fix-dashboard-shell-canvas-and-copy

### Current State

The shell canvas and appointment-control corrections are already present in the worktree. The active exploration now defines hierarchy as the whole dashboard product experience, not only activation. This phase changes SDD artifacts only; no production code is in scope.

The primary job-to-be-done is: **help the owner understand what needs attention today, manage the agenda, and keep the public booking page usable**. Therefore the first viewport of `/dashboard` should begin with the appointments/current-work surface, not setup education. Its appointment summary and today/tomorrow agenda are already implemented in `AppointmentsTab` through `loadSummary`, request counting, reminder actions, and the agenda controls. Activation and sharing should provide context around that work, not displace it.

The shell currently has a coherent structural frame: desktop sidebar, mobile bottom navigation, account/billing/logout actions, and a contextual header with business name, page title, and subtitle. `NAV_ITEMS` defines Turnos, Servicios, Horarios, Calendario, and Ajustes; all tabs render inside the same `max-w-6xl` content column. However, `ActivationChecklist` is rendered before every tab, so it occupies the first viewport even when appointments are the active job. Its completion state and public-link actions are also coupled in one large card.

Tab experiences are not equally prioritized or dense. Appointments has the richest operational hierarchy: priority label, today/tomorrow summary, then filters and agenda. Services remains a compact CRUD surface with a small heading and dense controls. Schedule uses a page header plus explanatory card and weekday editing grid. Calendar has a control card for week selection, management/share modes, and a calendar view. Settings has a public-page header, sharing utility, appearance/content forms, and the messaging card. The shell header supplies the page title, so tab-local headings must support rather than compete with it.

### Bounded hierarchy model

1. **Product shell and navigation** — neutral product canvas; business identity; persistent primary navigation; account state and logout remain secondary utilities. Mobile keeps the bottom navigation and must not lose access to billing.
2. **Header and first viewport** — show business name, the active page title, and a specific subtitle. On Turnos, the subtitle should explain attention/action today. The first meaningful content is the appointment summary and agenda.
3. **Primary work surface** — Turnos leads with today/tomorrow summary, pending-request signal, refresh/error feedback, then the agenda and its existing filters, status actions, reminders, and rescheduling. No hierarchy change may alter its API, mutations, or filter semantics.
4. **Contextual activation** — incomplete activation remains actionable but moves below primary work. A genuine incomplete-to-complete transition may show a 100% acknowledgement once for the mounted visit; an initially complete/reopened visit shows neither checklist steps nor completion hero.
5. **Public sharing utility** — a valid public link remains available as a clearly secondary card/action, independent from activation completion. It retains open, copy, and share behavior. If `publicLinkAvailable` is false, no guessed or misleading available URL action is shown.
6. **Secondary actions and navigation** — billing/account, logout, tab switching, create/edit/save controls, and calendar sharing remain discoverable but visually subordinate to the active job. Existing keyboard and `aria-current` behavior remains intact.
7. **Tab consistency** — every tab keeps the common shell width, neutral canvas, readable title/supporting copy, bounded controls, consistent surface/border/focus tokens, and responsive wrapping. Existing tab-specific functionality remains intact; consistency does not mean flattening all tabs into one template.

The activation endpoint (`app/api/admin/activation/route.ts`) remains read-only and derives three setup steps plus `publicLinkAvailable`. `DashboardClient` refreshes it on mount, focus, visibility, and internal navigation with request-id and abort guards. Use component-local visit state, not browser or server persistence: a visit that starts incomplete may acknowledge completion once; a new mount that loads complete stays quiet.

The authoritative automatic-messaging boundary remains `lib/plans/catalog.ts` → `lib/entitlements.ts` → `app/api/admin/entitlements/route.ts` → presentation. Basic has `automaticMessaging: false` and allowance `0`. `MessagingSettingsCard` currently renders its connection card unconditionally and only gates usage presentation, so Basic can still see messaging labels and controls. The dashboard gate must fail closed while entitlement is loading, malformed, or unavailable. Premium and Enterprise presentation, manual WhatsApp appointment actions, and public-page links remain unchanged. `presentAutomaticMessaging` is a state mapper, not permission to render Basic UI.

### Affected Areas

- `app/dashboard/DashboardClient.tsx` — implement the hierarchy and mounted-visit activation state; place appointments before contextual blocks; separate sharing; preserve shell navigation and link mechanics.
- `app/dashboard/AppointmentsTab.tsx` — preserve the primary summary/agenda surface and verify its controls remain bounded below the shell header.
- `app/dashboard/ServicesTab.tsx`, `ScheduleTab.tsx`, `CalendarTab.tsx`, `SettingsTab.tsx` — align page-level hierarchy, headings, surface tokens, spacing, and responsive behavior without changing CRUD, schedule, calendar, settings, or sharing APIs.
- `app/dashboard/MessagingSettingsCard.tsx` — gate all automatic-messaging content from the effective entitlement; fail closed for unknown states.
- `lib/entitlementPresentation.ts`, `lib/entitlements.ts`, `app/api/admin/entitlements/route.ts` — preserve the server authority and paid-plan state mapping; change only if a shared boundary is required.
- `tests/dashboard-presentation.test.ts` and `tests/settings-tab-messaging-presentation.test.ts` — source contracts for ordering, titles/subtitles, sharing separation, tab consistency, and Basic absence.
- `tests/entitlements.test.ts` and `tests/entitlements-route.test.ts` — preserve Basic capability/allowance and Premium/Enterprise effective-entitlement behavior.
- `app/billing/BillingClient.tsx` — verify whether the Basic automatic-messaging absence rule is product-wide; if so, suppress only that section while preserving paid-plan usage behavior.
- Existing authenticated screenshot evidence — retain the neutral canvas and no-horizontal-overflow evidence at 390, 768, 1024, and 1440 CSS widths; add hierarchy evidence without claiming untested pixel geometry.

### Approaches

1. **Client-only hierarchy orchestration with presentation gates** — keep the existing endpoints and tab boundaries, reorder shell content, add a small mounted-visit state machine, separate sharing, and gate messaging from effective entitlements.
   - Pros: smallest rollback boundary; preserves behavior and screenshot evidence; directly matches the product hierarchy.
   - Cons: initially complete after a new mount is intentionally quiet; entitlement loading may briefly show no messaging surface.
   - Effort: Medium

2. **Introduce a new dashboard layout/data aggregation layer** — centralize tab metadata, activation, entitlement, summary, and sharing into a new dashboard model.
   - Pros: stronger long-term composition point.
   - Cons: broadens API/state coupling, risks changing loading and error behavior, and exceeds this presentation fix.
   - Effort: High

### Recommendation

Use Approach 1. Define Turnos as the primary dashboard job and first viewport; keep the header and navigation as the stable shell; move activation and sharing into contextual/secondary positions; and make tab consistency a bounded presentation contract. Preserve all existing tab APIs, filters, mutations, activation request guards, manual WhatsApp behavior, public sharing mechanics, and supplied screenshot evidence. Apply the Basic hard absence rule at the messaging presentation boundary while preserving Premium/Enterprise states.

### Testable Acceptance Criteria

- [ ] The dashboard shell has one clear hierarchy: business identity/header, active title/subtitle, then the Turnos summary and agenda as the first meaningful work surface.
- [ ] Turnos displays the existing today/tomorrow summary, pending-request signal, agenda, filters, refresh, reminder, status, and reschedule behavior without request or mutation contract changes.
- [ ] Activation is below primary work when incomplete; an incomplete-to-complete transition shows 100% once per mounted visit; initially complete, reopened, and same-visit refresh/navigation states do not replay it.
- [ ] A valid public link remains a separate secondary utility after completion; unavailable links do not render a misleading available action; open/copy/share behavior remains intact.
- [ ] Desktop sidebar, mobile bottom navigation, billing/account, logout, active `aria-current`, keyboard focus, and tab switching remain available and consistent.
- [ ] Turnos, Servicios, Horarios, Calendario, and Ajustes retain their existing capabilities while using the common shell width, neutral canvas, readable title/supporting copy, bounded responsive controls, and consistent surface/focus treatment.
- [ ] Basic entitlement renders no automatic-messaging card, status, limit, upgrade prompt, connection control, template label, reminder label, or automatic-messaging copy; loading, malformed, and failed entitlement states fail closed.
- [ ] Premium available/approaching/reached/uncertain states and Enterprise custom-limit state remain renderable; manual WhatsApp actions and public-page messaging remain unaffected.
- [ ] Focused source/domain tests and authenticated browser evidence cover the hierarchy, activation states, sharing availability, Basic absence, paid-plan preservation, and target widths without claiming unmeasured geometry.
- [ ] Implementation remains a single bounded feature-chain slice under the 400-line authored review budget; unrelated worktree changes remain untouched.

### Risks

- Rendering activation before appointments preserves the current code order but violates the product job-to-be-done; ordering needs an explicit test contract.
- Reusing generic page subtitles can make secondary tabs feel identical; copy should be specific while remaining concise.
- A messaging card that renders before entitlement resolution can leak Basic labels; the safe default is no messaging surface.
- Sharing coupled to checklist visibility can accidentally remove a useful utility after completion; keep `publicLinkAvailable` independent.
- Broad visual normalization could alter proven appointment controls or screenshot evidence; preserve existing responsive markers and verify rather than redesigning every tab.
- Focus/visibility refreshes can race activation transitions; retain the current abort/request-id guards.

### Ready for Proposal

Yes. Reconcile proposal, specification, design, and tasks around the bounded dashboard hierarchy above. No production code was changed in this exploration.

## Key Learnings

1. Dashboard hierarchy means the owner workflow across shell, tabs, activation, sharing, and messaging boundaries.
2. Appointments already owns the strongest operational summary and agenda surface, but activation currently precedes it.
3. Public sharing is a durable secondary utility and must remain independent from completion acknowledgement.
4. Basic automatic messaging requires fail-closed presentation gating despite shared upgrade-state mapping.

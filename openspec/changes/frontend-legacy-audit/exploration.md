# Frontend Legacy Audit — Exploration

## Exploration: frontend-legacy-audit

### Current State

FezTime is a Next.js 16 / React 19 application using Tailwind CSS 4 through `app/globals.css` and the PostCSS plugin. There is no `tailwind.config.*`, `components/` directory, Storybook script, or frontend test suite. `npm test` is available and currently passes 19 backend/route-oriented test files with 111 tests; it does not establish visual or browser coverage.

The recent visual work is not one coherent system. The strongest current source of truth is the Editorial-light product direction documented in `COMMERCIALIZATION_PLAN.md` and implemented in the landing page, public business page, public booking flow, demo, auth, billing, dashboard shell, appointments, calendar, and schedule. However, several dashboard tabs and customer-link routes still use an older dark SaaS treatment. The result is a mixed application: the dashboard shell is light while Services and Settings are dark; customer booking is editorial-light while the magic-link and rescheduling confirmation surfaces are dark.

The visual sources currently in production are:

- **Marketing/editorial source:** `app/page.tsx` plus landing-specific CSS in `app/globals.css`; custom classes include `.landing-page`, `.section-shell`, `.button`, `.hero`, `.product-preview`, and responsive rules at 800px/420px.
- **Product light source:** Tailwind utility composition in `app/dashboard/DashboardClient.tsx`, `AppointmentsTab.tsx`, `ScheduleTab.tsx`, `CalendarTab.tsx`, `AppointmentDetailClient.tsx`, `app/billing/*`, `app/login/*`, `app/register/page.tsx`, `app/demo/page.tsx`, and `app/[slug]/BusinessLandingClient.tsx` / `TurnosClient.tsx`.
- **Legacy dark source:** Tailwind utility composition in `app/dashboard/ServicesTab.tsx`, `app/dashboard/SettingsTab.tsx`, `app/r/[token]/MagicLinkClient.tsx`, `app/[slug]/turno-actualizado/page.tsx`, and fallback `app/turnos/page.tsx`.
- **Tenant-brand source:** `app/dashboard/types.ts` (`BrandConfig`, `DEFAULT_BRAND`) and repeated runtime color validation/readability logic in `BusinessLandingClient.tsx`, `TurnosClient.tsx`, and `turno-recibido/page.tsx`. Tenant colors are used as accents but do not form a shared token contract.

The latest visual commits confirm a staged redesign rather than a completed migration: `02cbf3b` editorial landing, `e802bad` public business page, `9b323a2` public booking, `dac9ac3` dashboard shell, `ea92850` appointments/calendar, `07b2284` schedule, `002878f` billing/auth, and `fbcba8d` demo. The roadmap explicitly scoped several of those changes to individual surfaces and left other tabs/routes unchanged. That history is useful migration evidence, not proof that unchanged surfaces are intentionally legacy.

### Route Inventory

| Route | Implementation | Surface / audit boundary | Current evidence |
|---|---|---|---|
| `/` | `app/page.tsx`, `app/globals.css` | Public marketing and conversion | Editorial-light custom CSS; separate token vocabulary from Tailwind product UI. |
| `/demo` | `app/demo/page.tsx` | Guided product walkthrough | Editorial-light Tailwind; duplicates booking/admin presentation with fictitious data. |
| `/login` | `app/login/page.tsx`, `LoginForm.tsx` | Auth entry | Editorial-light; repeated header/footer/form patterns with register. |
| `/register` | `app/register/page.tsx`, `register/layout.tsx` | Onboarding entry | Editorial-light; long form and first-run explanation; no shared form primitives. |
| `/dashboard` | `app/dashboard/page.tsx`, `DashboardClient.tsx` | Authenticated owner shell | Light shell, desktop sidebar, mobile bottom nav, activation checklist; tab state is client-local rather than route-addressable. |
| `/dashboard/appointments/:id` | `AppointmentDetailClient.tsx` | Appointment detail | Light standalone page, not rendered inside dashboard shell; duplicated detail/action/status patterns. |
| `/billing` | `app/billing/page.tsx`, `BillingClient.tsx` | Billing/recovery | Editorial-light; separate typography (`font-serif`), card scale, and status treatment. |
| `/:slug` | `page.tsx`, `BusinessLandingClient.tsx` | Tenant public landing | Tenant-themed editorial-light; dynamic background, logo, contrast fallback, share/install. |
| `/:slug/turnos` | `turnos/page.tsx`, `TurnosClient.tsx` | Tenant booking | Tenant-themed editorial-light four-step flow; separate hard-coded token palette and duplicated color helpers. |
| `/:slug/turno-recibido` | `turno-recibido/page.tsx` | Booking result | Light tenant-adjacent confirmation; own color/contrast helper and static fallback palette. |
| `/:slug/turno-actualizado` | `turno-actualizado/page.tsx` | Reschedule result | Dark legacy surface with different status hierarchy and compact typography. |
| `/r/:token` | `MagicLinkClient.tsx` | Customer appointment management | Dark legacy surface; uses `window.confirm`, compact controls, and independent error/status language. |
| `/turnos` | `app/turnos/page.tsx` | Generic booking fallback | Dark legacy chooser unless deployment default slug redirects. |
| `/terms`, `/privacy` | `app/terms/page.tsx`, `app/privacy/page.tsx` | Legal/trust | Must remain in audit for typography, navigation, and legal readiness; not inspected as a redesign target without approved legal copy. |
| `/api/**` | `app/api/**` | Runtime contract boundary | Out of visual migration scope except route evidence needed to preserve loading/error/status behavior. |

### Component and Feature Inventory

#### Dashboard and owner operations

- `DashboardClient` — shell, navigation, activation checklist, public-link copy/share, responsive navigation, inline SVG icon set.
- `AppointmentsTab` — summary cards, date/day-week/status controls, appointment cards, confirmation dialog, reschedule dialog, manual WhatsApp reminder feedback, loading/error/empty states.
- `CalendarTab` — weekday calendar, admin/share modes, schedule fetch, weekly appointment fetch, `WeekCalendar`, `ShareWeekCalendar`; it duplicates week-range/date loading concepts with `AppointmentsTab`.
- `ScheduleTab` — seven-day schedule cards, editable blocks, validation, copy-day interaction, replacement confirmation, saved/error/loading/empty states.
- `ServicesTab` — create/edit service form, active toggle, list, delete dialog, loading/empty/error states. It is the clearest legacy dark dashboard tab (`bg-slate-900`, `bg-slate-950`, tiny text, compact controls) inside the light shell.
- `SettingsTab` — public profile, appearance presets/advanced colors/background, about/contact, slug availability, messaging card, sticky save bar. It is also legacy dark and contains a large monolithic form with no shared field/card primitives.
- `MessagingSettingsCard` — newer light card, but copy is English while the surrounding owner UI is Spanish; it has its own status, inputs, templates list, entitlement projection, and save flow.
- `AppointmentDetailClient` — standalone light detail page with inline confirmation dialog; shares status labels, action labels, feedback, and appointment fields with `AppointmentsTab` but not through shared components.
- `BillingClient` — plan status, automatic messaging usage, payment CTA, history, reconciliation, loading/error/empty states.

#### Public/customer and acquisition surfaces

- `BusinessLandingClient` — tenant landing, color contrast helpers, background modes, contact links, share/install status, `SavedAppointments`.
- `TurnosClient` — service/date/availability/slot/details flow, four-step progress, retry/empty/loading states, submit feedback, saved appointment integration.
- `SavedAppointments` — local customer appointment list/removal; uses literal hex values distinct from the booking flow.
- `MagicLinkClient` — load/cancel/reschedule via bearer token; dark legacy layout and browser confirmation.
- `turno-recibido` and `turno-actualizado` pages — two separate confirmation result compositions with materially different visual systems.
- `DemoPage` and its internal `Frame`, `Detail`, `StatusPill`, and demo panels — a third presentation of booking/admin/reschedule concepts, useful as evidence but not a source of runtime UI truth.
- `HeroPreviews.tsx` — older dark product preview with `PanelPreview`, `CalendarPreview`, and `PublicPreview`; no import was found in `app/*.tsx`, so it is a dead-UI candidate pending repository-wide/build confirmation.
- `app/components/HeroDemoCarousel.tsx` — export with no import found in the inspected TSX files; dead-UI candidate.
- `app/components/InstallPwaButton.tsx` — export with no import found; public pages implement their own install/share affordance, so this is a dead/duplicate candidate.
- `ServiceWorkerRegister` is live from `app/layout.tsx`; it must not be removed as part of a visual cleanup without validating PWA behavior.

### Findings by Priority

#### P0 — audit blockers / trust or recovery risk

1. **Route-family visual inconsistency affects recovery confidence.** `MagicLinkClient.tsx` and `turno-actualizado/page.tsx` use dark legacy layouts while the booking and received-request routes are light. A customer moving from a branded booking page to a management link or reschedule result changes product identity and hierarchy at the moment they need status/recovery clarity.
2. **Dashboard has two incompatible visual systems in one authenticated task flow.** `DashboardClient.tsx` establishes a light shell, while `ServicesTab.tsx` and `SettingsTab.tsx` render dark cards, dark fields, compact 11px labels, and dark destructive dialogs. This is especially risky during first-run activation because the checklist links directly into those tabs.
3. **No validated visual regression boundary exists.** The repository has no Storybook, no frontend test files, and no screenshot/route test script. Any migration that touches shared tokens or multiple route families currently lacks automated proof for 390px/mobile, desktop, focus states, dialogs, and tenant color contrast. This is a planning prerequisite, not a production-code change in this phase.

#### P1 — material UX consistency and migration risk

1. **Token ownership is fragmented.** `globals.css` has root variables and a large landing-only CSS system; product UI uses repeated Tailwind slate/indigo/rose/emerald values; tenant surfaces use literal hex values and inline styles; `BrandConfig` defaults still contain legacy indigo/cyan/slate values. There is no explicit semantic token layer for canvas, surface, border, text, action, success, warning, danger, focus, or tenant accent.
2. **Shared primitives are absent.** Buttons, fields, cards, badges, alerts, dialogs, status pills, headers, and loading/empty states are reimplemented across tabs/routes. `AppointmentsTab`, `AppointmentDetailClient`, `ServicesTab`, `MagicLinkClient`, and confirmation pages provide direct evidence of duplication.
3. **Booking logic and presentation are duplicated.** `validHex`, contrast/readable text, date formatting, status language, slot selection, summary fields, and loading/error feedback occur in multiple files. `BusinessLandingClient`, `TurnosClient`, and confirmation pages do not consume one shared tenant theme/presentation contract.
4. **Settings is a high-risk migration boundary.** It combines a large form, theme presets, advanced values, URL availability checks, messaging configuration, sticky persistence status, and public-preview actions. It should be migrated in independently verifiable sections rather than rewritten as a single broad component.
5. **Calendar and appointments overlap.** Both implement week/date calculations, appointment loading, and status/date presentation. `CalendarTab` additionally fetches schedule data for its share mode. The audit should decide whether these are two intentionally distinct jobs or one canonical agenda model before any UI consolidation.
6. **Language consistency is incomplete.** `MessagingSettingsCard` contains English labels and messages (`Automatic messaging`, `WhatsApp connection`, `Save messaging settings`) inside otherwise Spanish owner surfaces. This is a P1 trust/quality finding, but changing copy is out of scope here.
7. **Standalone appointment detail breaks shell continuity.** `/dashboard/appointments/:id` is a separate full-page composition with its own background, max width, header, action buttons, and dialog rather than reusing the dashboard shell/navigation context.

#### P2 — system quality and responsive polish

1. **Responsive strategies are per-file.** Landing CSS uses 800px/420px media rules; dashboard uses Tailwind `sm`/`md`/`lg`; public booking uses a 2/3-column slot layout; legacy dark routes use compact fixed-ish grids. These need a route matrix at 390px, 768px, 1024px, and wide desktop before migration priorities are finalized.
2. **Typography and sizing drift.** Editorial surfaces use large `font-serif` headings and 15–16px controls; legacy surfaces use 10–13px labels; dashboard light surfaces mix `text-xs`, `text-sm`, `text-lg`, and `text-2xl` without a documented scale.
3. **Dialog behavior is inconsistent.** `AppointmentsTab` and appointment detail use custom `role="dialog"` overlays; `ServicesTab` uses a native `<dialog>` plus an outer overlay; `MagicLinkClient` uses browser `window.confirm`. Focus restoration is explicitly handled only in Services, while the other dialogs do not show equivalent focus trapping/restoration evidence.
4. **Feedback state patterns vary.** Light surfaces use bordered alert cards and `role=status/alert`; legacy surfaces use tiny inline colored text. Empty states range from helpful explanatory cards to minimal paragraphs. A semantic state matrix is needed.
5. **Navigation/URL behavior is not uniform.** Dashboard tabs are local state, while detail/billing/auth/public journeys are URL routes. The audit should document whether preserving tab state on refresh/deep link is desired before treating this as a UX defect.
6. **Potential dead/duplicate preview components need confirmation.** `HeroPreviews`, `HeroDemoCarousel`, and `InstallPwaButton` have no imports found in the inspected TSX source. They must be checked with the compiler/build and repository-wide references before deletion is ever proposed.

#### P3 — cleanup candidates / deferred polish

1. Remove or archive confirmed unused preview/install components only after usage and history checks; do not delete during this audit.
2. Consolidate repeated local `Icon`, `Info`, `Detail`, `StatusPill`, `SummaryItem`, `StepHeading`, and status-label helpers after semantic behavior is locked.
3. Normalize arbitrary values and class ordering after semantic tokens and component boundaries are agreed.
4. Evaluate whether `HeroPreviews` and `HeroDemoCarousel` should become marketing-only examples, be replaced by the current `ProductPreview`, or be removed as stale experiments.

### Canonical Design-System Candidates

These are candidates for proposal/design, not decisions made in exploration:

| Candidate | Evidence | Recommended role |
|---|---|---|
| Editorial-light canvas and surface hierarchy | `app/page.tsx`, `app/demo/page.tsx`, auth, billing, public booking, dashboard shell | Product-wide default for FezTime-owned surfaces. |
| Tenant theme adapter | `BrandConfig`, `BusinessLandingClient` contrast helpers, `TurnosClient` guarded colors | Semantic adapter for tenant accent/background/logo values; should not replace product tokens. |
| Light dashboard shell | `DashboardClient`, `AppointmentsTab`, `ScheduleTab`, `CalendarTab` | Canonical owner workspace frame and operational card language. |
| Rounded card/button/input language | Dashboard light surfaces and public booking | Shared primitives with size variants, not copy-pasted utility strings. |
| Semantic state palette | Existing emerald/amber/rose feedback plus non-color labels | Centralize success, warning, danger, neutral, pending, loading, and focus semantics. |
| Editorial custom CSS | `globals.css` landing selectors | Keep scoped to marketing if the team wants a distinct acquisition expression; do not use it as an implicit product token source. |

### Evidence, Uncertainty, and Audit Boundaries

- **Confirmed from source:** route/page inventory above, mixed light/dark systems, repeated inline tokens/helpers, no Tailwind config, no Storybook script, and test command results.
- **Confirmed by targeted reference search:** `ServiceWorkerRegister` is live; no imports were found for `HeroPreviews`, `HeroDemoCarousel`, or `InstallPwaButton` in inspected TSX files. Treat these as candidates, not confirmed deletions, until build output and all non-TSX references are checked.
- **Not proven in this phase:** production usage of every route, browser visual appearance at each viewport, tenant-specific color contrast across all custom values, actual dead-code status after Next.js dynamic resolution, and whether the latest dashboard redesign is the approved product source of truth. These require route smoke/screenshot evidence or explicit product confirmation.
- **CodeGraph limitation:** the indexed source exposed high-value symbol/call-path evidence but did not return every requested file in one capped query; targeted filesystem reads were used afterward for the route and component inventory.
- **Production scope boundary:** no app, lib, CSS, config, dependency, test, or asset file was changed. Only this OpenSpec exploration artifact is allowed to change.
- **OpenSpec convention gap:** `openspec/config.yaml` is absent in the current checkout even though archived and main specs exist. Downstream SDD phases should preserve the existing directory convention and record this missing project config rather than inventing rules.

### Recommended Migration Plan

1. **Baseline and authority decision:** approve the Editorial-light product language as the default source of truth, while keeping tenant theming and marketing-specific CSS explicitly scoped. Record exceptions, especially the marketing landing and tenant custom backgrounds.
2. **Inventory and token contract:** define semantic product tokens and component variants for canvas, surface, border, content, muted content, action, focus, success, warning, danger, and tenant accent. Map current literal colors before changing them.
3. **Foundational primitives:** create or nominate shared components for page frame, section/card, button, field, badge, alert, loading state, empty state, and dialog. Preserve current labels/API behavior while replacing visual duplication.
4. **P0 recovery journeys:** migrate `/r/:token` and `/:slug/turno-actualizado`, then validate the full booking → received → manage → reschedule path at mobile and desktop sizes.
5. **P0 activation journeys:** migrate `ServicesTab` and `SettingsTab` into the light dashboard shell, keeping form behavior, messaging contracts, slug checks, and save/error semantics unchanged.
6. **P1 consolidation:** align standalone appointment detail, billing/auth, and public confirmation states; decide whether Calendar and Appointments share a presentation/data model or remain intentionally separate.
7. **P2 responsive/accessibility pass:** run a route-by-viewport matrix, verify focus/keyboard/dialog behavior, state announcements, touch targets, overflow, and tenant contrast.
8. **Dead UI decision:** confirm unused components with build/reference evidence and history; only then create a separate deletion task with a narrow rollback boundary.

### Actionable Planning Tasks for Downstream SDD Phases

- Produce a route × viewport × state audit matrix covering 390px, 768px, 1024px, and wide desktop for every route in the inventory.
- Define the canonical semantic token contract and document which colors remain tenant-configurable versus product-owned.
- Map every shared primitive candidate to current implementations and define migration acceptance criteria without changing API contracts.
- Migrate legacy dark customer recovery surfaces (`MagicLinkClient`, `turno-actualizado`) as one chained slice with booking-flow screenshot evidence.
- Migrate legacy dark owner tabs (`ServicesTab`, `SettingsTab`) as separate slices because Settings contains materially more state and persistence behavior.
- Audit dialog semantics and focus behavior across appointment confirmation, rescheduling, service deletion, and customer cancellation; replace browser confirmation only in a future implementation slice.
- Decide Calendar/Appointments ownership and duplication boundaries before extracting date/status/appointment presentation helpers.
- Align or explicitly scope Spanish/English copy in `MessagingSettingsCard` and other mixed-language surfaces.
- Verify suspected dead components and record evidence before any deletion proposal.
- Add a read-only visual verification capability (screenshots or equivalent route evidence) before applying broad UI migration; do not add it in this exploration phase.

### Approaches

1. **Incremental strangler migration by route family** — establish tokens/primitives, then migrate recovery, activation, operations, and polish in bounded chained slices.
   - Pros: protects the 400-line review budget, keeps rollback narrow, exposes visual regressions per journey, and respects the existing staged redesign history.
   - Cons: temporary mixed implementation remains while slices land; requires an explicit authority decision and migration map.
   - Effort: High

2. **One-pass frontend rewrite** — replace dashboard/public/auth/billing styling and extract components in one change.
   - Pros: faster apparent convergence and fewer temporary patterns.
   - Cons: exceeds review budget, combines high-risk forms/dialogs/recovery journeys, makes regressions hard to localize, and violates the user's audit-only/no-production-change constraint for this phase.
   - Effort: Very high

3. **Style-only sweep** — replace colors/classes in-place without extracting semantic primitives or reviewing route/state behavior.
   - Pros: low initial structural effort.
   - Cons: preserves duplication, does not resolve dialog/state/responsive inconsistencies, and makes future changes harder; not recommended as the migration strategy.
   - Effort: Medium

### Recommendation

Use the incremental strangler migration by route family. Treat the current Editorial-light dashboard/public/auth/billing work as the visual baseline, keep the marketing CSS scoped, and make tenant branding an explicit adapter. Start downstream work with token/primitive design and P0 recovery/activation slices; do not begin implementation from a color search alone.

### Risks

- A broad shared-token change can alter tenant contrast, focus visibility, and status meaning across dynamic brand colors.
- Moving standalone customer recovery pages into the light system can accidentally change token-expiry, cancellation, or reschedule semantics.
- Extracting shared components from monolithic tabs can change form submission, save-state, or dialog focus behavior even when the visual diff appears small.
- Calendar/Appointments consolidation may change date ranges or API query behavior; preserve current endpoint contracts until the data boundary is explicitly designed.
- Dead-UI deletion without build/reference/history evidence could remove a dynamically referenced or future marketing surface.
- Missing `openspec/config.yaml` may leave downstream phase-specific project rules undefined.

### Ready for Proposal

Yes. The proposal can define an audit-led, chained migration plan with no production implementation in this change. It should explicitly preserve current runtime/API behavior, require evidence before dead-code deletion, and use the route inventory, priority findings, canonical candidates, and task boundaries above as its baseline.

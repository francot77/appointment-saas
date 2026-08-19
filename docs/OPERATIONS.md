# Production Operations

This runbook describes the production controls that must be configured before a commercial launch. It does not claim that backups, alerts, error tracking, or deployment automation are currently provisioned.

## Quick path

1. Confirm the deployment has the required secrets and a MongoDB replica set or sharded cluster.
2. Check `GET /api/health` before and after a release.
3. During an incident, preserve payment and booking records, capture the request/business/provider reference, and follow the triage flow below.

## Environment and secrets

Required or production-recommended variables are listed in [`README.md`](../README.md). Store them in the deployment platform's encrypted secret store; never put them in GitHub workflow output, issue comments, logs, or support tickets.

| Secret/configuration | Purpose | Owner/action |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection, including replica-set-capable topology | **Owner: assign. Action: configure and verify.** |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | Authenticated sessions | **Owner: assign. Action: configure and rotate procedure.** |
| Mercado Pago variables | Checkout and signed webhook verification | **Owner: assign. Action: configure test/prod separation.** |
| `NEXT_PUBLIC_APP_URL` or `APP_URL` | Public and provider return URLs | **Owner: assign. Action: verify production URL.** |
| `MP_BASIC_PRICE_ARS` | Current basic-plan price in whole ARS units | **Owner: assign. Action: set `100` only for temporary production testing, then restore `10000` before commercial launch.** |
| `MP_ACCEPTED_PRICES_ARS` | Explicit comma-separated ARS prices accepted by webhook/reconciliation during a transition | **Owner: assign. Action: include every intentional prior price, then remove it only after the delayed-payment/reconciliation window is clear.** |

### Automatic messaging prerequisites

Automatic messaging is **disabled by default** (`MessagingConnection.enabled=false`). Before enabling a canary, verify:

| Setting | Requirement |
| --- | --- |
| `INTERNAL_MESSAGING_RUN_SECRET` | Long random secret used only by the scheduler as a Bearer token. |
| `MESSAGING_ENCRYPTION_KEYRING` / `MESSAGING_ENCRYPTION_KEY_ID` | JSON keyring with AES-256-GCM 32-byte keys and one active key ID. |
| `META_WHATSAPP_APP_SECRET` / `META_WHATSAPP_VERIFY_TOKEN` | Deployment secrets for signed webhook and Meta challenge verification. |
| Scheduler | HTTPS `GET /api/internal/messaging/run` every minute; each run is bounded to 20 jobs and safe to overlap. |
| Meta webhook | Public HTTPS `GET/POST /api/webhooks/meta/whatsapp` with the exact callback URL and verify token. |
| Templates | Approved `es_AR` Utility templates for `confirmed`, `rescheduled`, and `reminder`; no locale fallback. |

Never put access tokens, app secrets, verification tokens, or encryption keys in client configuration, logs, CI output, or support tickets.

#### Encryption key rotation

1. Add the new 32-byte base64 key while retaining the previous key.
2. Change `MESSAGING_ENCRYPTION_KEY_ID` to the new key ID and deploy.
3. Confirm new writes use the new ID and existing connections still decrypt.
4. Re-encrypt existing connection secrets, then retire the old key only after a restore test confirms no dependency remains.

#### Canary, disable, and rollback

1. Deploy with the scheduler stopped and all messaging connections disabled.
2. Verify health, replica-set transactions, webhook challenge/signature checks, approved templates, and alert delivery.
3. Enable one tenant, run the scheduler once, and confirm provider references/status webhooks without duplicate sends.
4. Expand only after queue lag, retry/dead counts, ambiguous deliveries, and webhook failures stay within on-call thresholds.

To disable or roll back, first disable affected connections, then stop the scheduler. Preserve jobs and appointment data. The legacy manual WhatsApp actions and `wa.me` links remain the fallback and must be tested during rollback.

### Safe transition procedure

1. Set `MP_BASIC_PRICE_ARS=100` for the temporary production test.
2. Set `MP_ACCEPTED_PRICES_ARS=100,10000` so both the test price and the previous price remain valid for delayed webhooks and reconciliation. The current price is always included even if omitted from this list.
3. After the pending-provider and reconciliation window is clear, restore `MP_BASIC_PRICE_ARS=10000` and remove `100` from `MP_ACCEPTED_PRICES_ARS` (or unset the variable if no prior price is needed).

Checkout and UI use only `MP_BASIC_PRICE_ARS` as the new price. Webhooks and reconciliation accept only the current price plus explicitly listed transition prices. Never accept arbitrary provider amounts or rewrite historical `Payment` records and periods.

Production checkout requires `NEXT_PUBLIC_APP_URL` or `APP_URL` to be a valid public `http`/`https` URL. The application rejects missing, invalid, or localhost production configuration before creating a preference. Never place tokens or webhook secrets in client-visible configuration or logs.

CI uses repository code and dependency installation only. It does not require production secrets and must not receive them.

## MongoDB availability

Public booking and payment transitions use MongoDB transactions. Production MongoDB must be a replica set or sharded cluster. A standalone deployment is not a supported production topology for these paths and returns a temporary-unavailability response instead of claiming atomicity.

Messaging job claims and appointment lifecycle invalidation rely on atomic MongoDB operations and tenant-scoped unique indexes. Run production and acceptance checks against a replica set or sharded cluster; a standalone MongoDB process is not an equivalent test environment.

## Health check

`GET /api/health` is the readiness endpoint. A healthy response is HTTP `200` with `{"status":"ok","checks":{"database":"ok"}}`; an unavailable database produces HTTP `503` with a non-sensitive unavailable response. Configure the deployment/platform probe to call this endpoint. **Owner: assign. Action: configure probe and document escalation.**

## Backups and restore

No cloud backup provider or restore automation is configured by this change. The production owner must:

- Select an encrypted MongoDB backup method with retention and access control.
- Record backup success and failure evidence outside the application logs.
- Run and record a restore drill in an isolated environment before launch and on a defined cadence.
- Verify restored indexes, tenant ownership, payment references, and booking records.

**Owner: assign. Action: configure backups, retention, restore drill, and evidence location.**

## Payment duplicate cleanup

Before rolling out or relying on the unique `Payment.mpPaymentId` index, clean existing duplicate provider references in production. Identify duplicates, retain the authoritative transition/audit row, repair `Business.paidUntil` from approved periods, validate affected tenants, and only then create or validate the unique index. Do not delete payment history without an approved recovery decision.

**Owner: assign. Action: execute cleanup and attach query/results evidence.**

## Incident triage

1. Check `/api/health` and deployment status.
2. Classify the symptom: authentication, public booking, billing/webhook, database, or dependency/provider.
3. Correlate safe identifiers such as route, business ID, appointment ID, payment ID, and provider reference. Do not request secrets or raw provider payloads.
4. For billing, verify provider status server-side and preserve idempotency/payment records.
5. For booking, avoid manual duplicate creation; verify the tenant, date, status, and overlap before intervention.
6. Escalate with timestamp, route, status code, safe identifiers, and the last known good release.

Error tracking and alert routing are not configured by this change. **Owner: assign. Action: choose provider, define thresholds, and document on-call escalation.**

For messaging, alert at minimum on scheduler silence, queue lag, lease age, retry/dead-letter growth, ambiguous `delivery_unknown` outcomes, invalid webhook signatures, webhook processing failures, and repeated provider 429/5xx responses. Alerts must contain only safe tenant, job, and provider references.

## Rollback

Rollback only the application release that introduced the regression. Preserve database data and forward-compatible migrations; never roll back payment state or booking data by deleting production records. If a schema/index change is involved, stop and use the documented forward recovery procedure after assessing compatibility.

**Owner: assign. Action: document deployment rollback command, approval authority, and database recovery boundary.**

Messaging rollback boundary: disable tenant connections and stop the scheduler before reverting application code. Keep encrypted connection records, durable jobs, webhook audit records, appointment versions, and manual appointment routes intact.

## Business PWA and local access

Public business pages emit tenant-scoped manifests with configured public branding only. Verify `/<slug>/manifest.webmanifest` after a release and confirm `start_url` is `/<slug>/turnos`, `scope` is `/<slug>/`, and no provider/payment secret is present. A missing or unsafe logo falls back to the public FezTime icons.

Appointment management tokens are stored server-side with an expiry and are also returned as bearer links to the customer. The browser stores only a bounded, slug-filtered list of token references and appointment display data; it never stores customer PII. `localStorage` is convenience storage, not cryptographic protection: same-origin JavaScript/XSS can read the token. Customers can remove entries, and expired or invalid entries are removed without cancelling or changing the appointment.

PWA uninstall/reinstall behavior is browser-controlled. Uninstalling removes the installed shell but may leave site storage; reinstalling does not guarantee recovery after site data is cleared. Support should ask for the business link or a fresh management link rather than requesting customer phone data in browser storage.

## Alert ownership

The following ownership is intentionally unassigned until the operating team confirms it:

| Alert | Initial action | Owner |
| --- | --- | --- |
| Health/readiness failure | Check deployment and MongoDB connectivity | **Assign** |
| Booking 5xx/503 increase | Check MongoDB topology and recent release | **Assign** |
| Webhook verification/reconciliation failures | Check provider status and secret configuration | **Assign** |
| Backup or restore failure | Open recovery incident and preserve evidence | **Assign** |

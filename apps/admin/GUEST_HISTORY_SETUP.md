# Guest history foundation (no live booking data)

`GET /api/my-bookings` accepts `Authorization: Bearer <Cognito access token>`.
No cookies, email/user-ID headers, URL identity filters, ID tokens or test bypasses
are accepted as authorization. Missing/invalid tokens receive 401; employee-only
accounts receive 403. Configuration/repository failures return 503. Responses
are private and no-store. Tokens, records and provider errors are never logged.

## Server configuration (not set by this change)

- `GUEST_HISTORY_COGNITO_USER_POOL_ID`: the existing approved Cognito pool ID.
- `GUEST_HISTORY_COGNITO_CLIENT_ID`: the existing approved mobile client ID.

These are public identifiers, not credentials. Use the same values as the mobile
configuration. Region/issuer/JWKS location are derived from the pool ID, never
from a client-supplied URL. No AWS access keys, client secret, new resources or
changes to Cognito settings are required. Configuration is cached per process;
restart the server after changing it.

AWS `aws-jwt-verify` validates the signature, issuer, client ID, access-token type,
expiry and not-before time; RS256 is required. A deployed request may retrieve
public Cognito signing keys (JWKS). No live request or JWKS lookup was made by
the automated tests: tests generate ephemeral local RSA keys and prohibit network.

## Data and ownership

Successful response: `{ "bookings": [] }` until a trusted adapter exists.
The route intentionally imports an empty repository. Upcoming/past example stays
exist ONLY in `lib/guestHistory/guestHistory.test.ts`, with fictional users and
references; they cannot be enabled via an environment switch or client parameter.

`OwnedBookingRecord` links `(issuer, sub, propertyId)` to a summary and optional
Simplotel identifiers. Future repository queries must include all ownership keys.
The handler also filters by these keys and projects only allowed summary fields.
No email matching, booking-reference claiming, persistent database or ingestion
is implemented. A normal guest needs no Guests group; employee-only accounts are
denied, consistent with the current mobile policy.

Dates use YYYY-MM-DD in the contract; the existing mobile history renderer uses
DD-MM-YYYY. Stay state and paid/confirmed status must come from trusted data, not
from availability or successful invoice creation. Existing invoice flows remain
unconfirmed/payment-pending and are not connected to this repository.

## UI readiness and limitations

Ready for a future My Account client consuming `{ bookings: BookingHistoryRecord[] }`:
pass the access token only in the authorization header over HTTPS, never query
strings/logs; handle 401/403/503; clear records on sign-out/account switch and do
not persist history in an unscoped cache.

My Account now includes a My Stays section consuming this route for the empty
state only. It distinguishes empty results from unavailable/unauthenticated states.
Nonempty responses are not displayed until real-history rendering is approved.
The section never persists records or tokens and does not automatically retry.
Release builds require `EXPO_PUBLIC_API_BASE_URL` with an approved HTTPS backend.
Development builds default to `http://127.0.0.1:3001` when unset; use USB forwarding
with `adb reverse tcp:3001 tcp:3001`. HTTP is permitted only for loopback development.
This does not change the existing Simplotel service URL or authentication configuration.

Access-token validation is not an online revocation or account-status check.
Already-issued valid tokens can remain usable until expiry after sign-out or
group changes. Before serving real personal data, decide revocation requirements,
add appropriate rate limits and audit/retention protections, connect trusted
ownership storage, and obtain documented Simplotel reconciliation support.
Access tokens do not prove the email_verified attribute; ownership uses sub, not
email. If future product policy requires server-enforced email verification at
each request, define a trusted attribute check before real-data rollout.

Run `npm run test:guest-history`. These are offline mock tests, not proof of a
deployed Cognito connection or live booking-history availability.

## Local-tested DynamoDB repository foundation (not activated)

`DynamoGuestBookingRepository` implements the unchanged `GuestBookingRepository`.
It requires an explicitly injected `BookingDocumentClient` and table name. There
is no AWS SDK dependency, default client, AWS credential configuration, table,
environment activation switch or route connection. The production route STILL
uses the empty repository; My Stays remains unchanged. The in-memory fake exists
only in `dynamoRepository.test.ts`, never in production code.

The port uses DynamoDB DocumentClient-shaped Get, Query and TransactWrite inputs.
A future AWS wrapper must use real atomic TransactWrite operations, preserve
conditional expressions and consistent reads, and propagate AWS errors without
logging inputs. It must not emulate transactions with separate writes. Keys are
`pk`/`sk` strings. Owner partition keys hash the tuple (issuer, sub, propertyId);
submission sort keys are owner-scoped. Queries never scan. Pagination is consumed
internally with a defensive bound; an ownership-bound public cursor is future work.

Records include schema/version, internal UUID, ownership, provenance, submission
key, server-computed canonical SHA-256 request fingerprint, timestamps, pending
booking/payment status, stay dates, room/rate snapshots, daily prices, taxes,
addons and penalties. Amounts are decimal strings with currency. Exact-shape
validation rejects unexpected fields; never pass raw requests, provider responses,
tokens, card details or credentials into this API. Text fields must contain only
their intended trusted values. Snapshots have a conservative size limit; this
bounded normalized model is not a lossless archive of every Simplotel field.

`begin` requires a server-validated pending snapshot and identity already derived
from verified Cognito authentication. It conditionally creates a durable item.
Same key/fingerprint returns the existing record; different contents conflict.
Fingerprints are immutable even when processing advances. These are internal
idempotency keys, not undocumented Simplotel request fields.

`advance` uses optimistic version conditions:
`prepared -> dispatching -> invoice_created`, or
`dispatching -> uncertain -> invoice_created` after trusted reconciliation.
Only one worker can claim dispatch. There is no timeout-based reset, lease
takeover, TTL deletion or automatic external retry. A recovered record is not
permission to resubmit. Lost storage acknowledgement requires a consistent read:
an accepted write may already exist. A prepared record can be claimed; dispatching
and uncertain records require investigation. Database errors propagate closed.

Attaching invoice identifiers atomically reserves a property/Simplotel booking-ID
ownership marker; another owner OR attempt cannot claim that booking ID. No GSI
is relied on for uniqueness. Invoice creation leaves booking/payment pending.
There is intentionally no method to mark paid/confirmed or synchronize cancellation:
trusted Simplotel confirmation/reconciliation capabilities must be documented first.

Before real deployment: supply/test an AWS SDK transport against DynamoDB,
provision encryption/backups and least-privilege backend IAM, define retention,
revocation/audit requirements, and approve activation separately. Future invoice
integration must authenticate Cognito ownership and persist the attempt BEFORE
external execution. Current operator test authorization is not guest ownership.
No transaction spans Simplotel and DynamoDB: unknown external outcomes require
reconciliation, not replay. This test foundation does not claim exactly-once
external execution or process-persistent storage in the local fake.

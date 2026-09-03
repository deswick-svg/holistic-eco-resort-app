# Guest history foundation (no live booking data)

`GET /api/my-bookings` accepts `Authorization: Bearer <Cognito access token>`.
No cookies, email/user-ID headers, URL identity filters, ID tokens or test bypasses
are accepted as authorization. Missing/invalid tokens receive 401; employee-only
accounts receive 403. Configuration/repository failures return 503. Responses
are private and no-store. Tokens, records and provider errors are never logged.

## Server configuration

- `GUEST_HISTORY_COGNITO_USER_POOL_ID`: the existing approved Cognito pool ID.
- `GUEST_HISTORY_COGNITO_CLIENT_ID`: the existing approved mobile client ID.
- `AWS_REGION=eu-north-1`
- `GUEST_HISTORY_DYNAMODB_TABLE=holistic-eco-resort-guest-bookings-dev`

Supply these through the backend environment (a local process environment is
sufficient); never mobile configuration. No environment files or credentials are
committed. Use the existing temporary AWS login/provider chain locally and a
least-privilege execution role when deployed. History retrieval needs Query on
the configured table, not write permissions. Missing/invalid configuration or
expired/unavailable AWS credentials fails closed with 503, not a false empty list.

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

Successful response for an owner with no stored records: `{ "bookings": [] }`.
The route uses `guestHistoryReadRepository`, a lazy read-only facade over the
tested SDK transport/repository. It exposes only `listOwned`; authentication and
query-parameter rejection happen before configuration, credential resolution or
DynamoDB access. The client is reused per server process; results are not cached.
Only owner-partition Query operations occur; no scans, writes or ingestion.
Upcoming/past example stays
exist ONLY in `lib/guestHistory/guestHistory.test.ts`, with fictional users and
references; they cannot be enabled via an environment switch or client parameter.

`OwnedBookingRecord` links `(issuer, sub, propertyId)` to a summary and optional
Simplotel identifiers. Future repository queries must include all ownership keys.
The handler also filters by these keys and projects only allowed summary fields.
No email matching, booking-reference claiming or ingestion is implemented.
A normal guest needs no Guests group; employee-only accounts are
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

## DynamoDB repository foundation (read retrieval activated)

`DynamoGuestBookingRepository` implements the unchanged `GuestBookingRepository`.
It requires an explicitly injected `BookingDocumentClient` and table name. There
is no default client or table inside the adapter. The route's server read facade
constructs the SDK transport lazily from the configuration above. Write methods
remain disconnected from all live routes, including booking/payment. The in-memory fake exists
only in `dynamoRepository.test.ts`, never in production code.

The port uses DynamoDB DocumentClient-shaped Get, Query and TransactWrite inputs.
The AWS wrapper must use real atomic TransactWrite operations, preserve
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

A controlled synthetic SDK write/read/isolation/idempotency test against the
development table passed and its records were deleted; the table was empty afterward.
Before production personal-data deployment: verify least-privilege backend IAM,
encryption/backups, retention and revocation/audit requirements. Future invoice
integration must authenticate Cognito ownership and persist the attempt BEFORE
external execution. Current operator test authorization is not guest ownership.
No transaction spans Simplotel and DynamoDB: unknown external outcomes require
reconciliation, not replay. This test foundation does not claim exactly-once
external execution or process-persistent storage in the local fake.

## AWS SDK transport (read-only route connection)

`dynamoTransport.ts` uses pinned AWS SDK v3 DynamoDB and document-client packages.
`readGuestHistoryDynamoConfig()` requires `AWS_REGION` and
`GUEST_HISTORY_DYNAMODB_TABLE`, validates them without echoing values in errors,
and performs no I/O. Approved development configuration is region
`eu-north-1`, table `holistic-eco-resort-guest-bookings-dev`. No environment files
are changed. The authenticated history route now uses this configuration for reads;
it does not enable booking/payment execution or DynamoDB writes.

`createGuestHistoryDynamoTransport(config)` constructs a client and repository
only when explicitly called. It does not run queries on construction/import.
Credentials remain lazy/provider-based: the default AWS SDK Node provider chain
can use a future execution role. Do not place long-lived keys in environment
files. No credentials, endpoint or table configuration is accepted from mobile.
The factory ignores configured endpoint URL overrides and rejects attempts to
use a different table through its port. Call `destroy()` when disposing it.

GetCommand/QueryCommand preserve consistent reads, ownership partition conditions
and pagination. TransactWriteCommand preserves atomic writes, conditions and
CancellationReasons. SDK retries are explicitly disabled (`maxAttempts: 1`),
including throttling/transport failures, to keep uncertain outcomes visible.
No errors or request/response data are logged by this wrapper. Existing route
error handling must continue to redact provider errors before returning to guests.

Document marshalling keeps monetary decimal strings as strings and safe version,
occupancy and invoice numbers as numbers. Undefined nested values are rejected,
not silently removed. No class-instance conversion or empty-value coercion is
enabled. The SDK generates a per-command transaction client token; it is not a
replacement for durable owner-scoped submission keys and fingerprint checks.

Contract differences handled: DynamoDB can return an empty LastEvaluatedKey map
at the end of pagination (normalized to no cursor); AWS SDK retry defaults must
not be inherited for uncertain submissions. The SDK deserializes transaction
CancellationReasons in the shape used by the existing conflict handling.

`dynamoTransport.test.ts` exercises real SDK signing with ephemeral fictional
material, marshalling, command serialization and response/error deserialization
through an in-process request handler. It never uses real credentials, profiles,
metadata services, sockets or AWS resources. Wire responses/conditional semantics
are mocked, not a running DynamoDB Local service. Existing local repository tests
remain unchanged. Passing tests proves the SDK wire contract, NOT IAM permissions,
table provisioning, real service validation or production readiness. The completed
synthetic service test is separate evidence; production ingestion and deployment
still require separate approval. Route/facade tests also verify authenticated empty
results, invalid-token rejection, configuration failure, cross-owner isolation and
Query-only SDK operations using local mocks.

## Mock-only authenticated invoice orchestration (not activated)

`invoiceOrchestration.ts` is a dependency-injected, server-only lifecycle service.
It has no default Cognito verifier, DynamoDB transport, Simplotel client, environment
reader or route registration. The live send-invoice route and mobile flow do not
import it. Tests use fictional identities, an in-memory conditional document client
and a mock provider; global fetch is disabled.

The service authenticates before parsing booking input and derives ownership only
from the injected authenticated `issuer` and `sub`. Property 7849 is a server
constant. An exact root request shape rejects identity/property/key fields. Guest
email and phone are booking snapshot data, never ownership. After injected fresh
validation, the durable lifecycle is `prepared -> dispatching -> invoice_created`,
`provider_rejected`, or `uncertain`. Only a successful conditional dispatch claim
may call the provider. Recovered identifiers return without resubmission; rejected
and uncertain attempts are terminal for automatic execution.

The fingerprint includes owner/property (in the repository), normalized guest and
stay data, totals, rooms, and complete freshly validated rate-plan/occupancy
snapshots, including daily prices, taxes, addons and penalty data. Success atomically
attaches booking/quote/invoice identifiers, reserves provider-booking ownership and
updates the guest-safe reference. Booking and payment remain pending. My Stays hides
durable workflow attempts other than `invoice_created`.

A lost DynamoDB acknowledgement is recovered with a consistent read. If the
provider may have succeeded but identifiers cannot be durably confirmed, the record
is moved to uncertain where possible and the operation fails closed; the provider
is never automatically retried. Connecting real Cognito, fresh preparation,
DynamoDB and Simplotel adapters to a guarded route requires separate approval.

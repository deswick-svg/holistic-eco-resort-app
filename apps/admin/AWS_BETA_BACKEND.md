# AWS beta backend

The private V1 beta backend runs on AWS Lambda in `eu-north-1` with a public HTTPS Lambda Function URL. AWS Amplify Hosting was not selected because its managed SSR support does not cover this project's Next.js 16 runtime. App Runner is not available in this region.

## Resources

- Lambda function: `holistic-eco-resort-beta-backend`
- Runtime role: `HolisticEcoResortBetaBackendRole`
- Runtime: Node.js 22, x86-64, 1024 MB, 30-second timeout
- Adapter: official `LambdaAdapterLayerX86` layer version 28
- Guest-history table: existing `holistic-eco-resort-guest-bookings-dev`

The runtime role may only read the guest-history table with `dynamodb:GetItem` and `dynamodb:Query`, and write logs for this Lambda. It cannot write, update, or delete booking-history records. This is deliberate defense in depth for the browsing-only beta.

The Function URL permits invocation only through the URL. The runtime is configured with `BETA_API_ONLY=true`, so non-API admin pages return 404.

## Required runtime configuration

Keep these values server-side:

- `SIMPLOTEL_ACCESS_TOKEN`
- `GUEST_HISTORY_COGNITO_USER_POOL_ID`
- `GUEST_HISTORY_COGNITO_CLIENT_ID`
- `GUEST_HISTORY_DYNAMODB_TABLE`

Safety settings for every beta deployment:

- `SIMPLOTEL_BOOKING_ENABLED=false`
- `SIMPLOTEL_DIRECT_BOOKING_ENABLED=false`
- Do not configure `SIMPLOTEL_INVOICE_TEST_SECRET`.
- Do not configure `SIMPLOTEL_INVOICE_TEST_GUEST_SUB`.

The deployed package is the Next.js standalone server plus `public` and `.next/static`. The Lambda handler is `run.sh`; the web adapter starts it on port 8080 and checks `/api/health` for readiness.

## Verification

Before distributing a new beta, verify:

- `/api/health` returns `200` and `status: ok`.
- `/` returns `404` while `BETA_API_ONLY=true`.
- availability and preparation work through HTTPS.
- preparation reports `paymentCreationEnabled: false`.
- unauthenticated `/api/my-bookings` is rejected.
- an authenticated guest can retrieve only their own My Stays response.
- all seven room-media galleries load without extraction errors.

Never exercise `/api/simplotel/booking/send-invoice`, `/book`, or cancellation as part of beta deployment verification.

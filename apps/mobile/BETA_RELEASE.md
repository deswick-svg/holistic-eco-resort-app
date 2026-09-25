# Holistic Eco-Resort V1 Beta

This profile is for private testing only. It is not a public store release.

## Release identity and branding

- App version: `1.0.0`
- Android version code: `2` (incremented after the existing version-code 1 EAS builds)
- iOS build number: `1`
- Android application ID and iOS bundle identifier are unchanged.
- The app icon, adaptive icon, and splash screen use the existing official full-colour Holistic Eco-Resort logo without modification.

## Required public mobile configuration

The `beta` EAS profile sets `EXPO_PUBLIC_API_BASE_URL` to the deployed AWS Lambda HTTPS origin. The beta build fails closed when this value is missing, uses HTTP, or points to localhost, loopback, a private/LAN address, or a `.local` host.

Cognito's region, user-pool ID, and app-client ID are public client configuration required by Cognito mobile applications. Keep them in the approved Expo/EAS environment and never display them in the UI or logs. Do not place AWS credentials or Cognito client secrets in the mobile app. This app client must continue to have no client secret.

## Required backend deployment

The Next.js backend is deployed as a Node.js 22 Lambda in `eu-north-1`, using Next.js standalone output and the official AWS Lambda Web Adapter layer. Its Lambda Function URL provides public HTTPS. Configure its server-only environment using the existing deployment pattern. At minimum it needs `SIMPLOTEL_ACCESS_TOKEN`, `GUEST_HISTORY_COGNITO_USER_POOL_ID`, `GUEST_HISTORY_COGNITO_CLIENT_ID`, and `GUEST_HISTORY_DYNAMODB_TABLE`; Lambda supplies `AWS_REGION`. Values remain server-side and must not be committed.

For beta:

- `SIMPLOTEL_BOOKING_ENABLED` must be absent or exactly `false`.
- Do not configure controlled-test authorization secrets or test-guest restrictions in the beta service.
- Preserve the existing server-side validation and fresh-availability behavior.
- Confirm `/api/simplotel/availability`, room media, booking preparation, and authenticated `/api/my-bookings` through the public HTTPS origin.
- The disabled response must continue to drive the guest-friendly payment-unavailable message. No `/book` or `/send-invoice` execution is permitted.

## Private distribution

The `beta` EAS profile uses internal distribution. Android produces an installable APK for a private tester link. iOS produces an ad hoc internal build and therefore requires an Apple Developer account plus each tester device registered in the provisioning profile.

The `play-internal` EAS profile produces a signed Android App Bundle for manual upload to Google Play Internal testing. Building this profile does not submit, publish, or promote a Play release.

No mobile build or upload has been performed as part of beta preparation.

The project must also be linked to the approved Expo/EAS project before the first cloud build. Do not create or link that external project without release-owner approval.

## Release checks

Run from `apps/mobile`:

```text
npm run test:release
npm run typecheck
npm run test:auth
npm run test:booking-ux
npx expo-doctor
```

Run the repository's backend booking, payment, guest-history, room-gallery, lint, TypeScript, and production-build checks before distribution. Test a release artifact on physical Android and iPhone devices; splash behavior can differ from Expo Go and development builds.

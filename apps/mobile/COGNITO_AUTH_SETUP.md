# Mobile Cognito authentication

## Scope and configuration

This connects the existing pool only; there is no Amplify backend project,
deployment, identity pool, IAM access key, or app-client secret. Public identifiers
are centralized in `src/services/aws.ts`. Optional public overrides are
`EXPO_PUBLIC_AWS_REGION`, `EXPO_PUBLIC_COGNITO_USER_POOL_ID`, and
`EXPO_PUBLIC_COGNITO_CLIENT_ID`. Never put passwords, tokens, or secrets in these
variables. Actual `.env` files are local-only; the optional `.env.example`
template is not part of this checkpoint.

- Region: `eu-north-1`
- Pool: `eu-north-1_lszbPmAvq`
- Public mobile client: `3i8v47npf9eo1ihjfqdrh5qufr`
- Groups: `Guests`, `Employees` (case-sensitive)

No Cognito user, sign-in, signup, verification email, or deployment was performed
during implementation. Live validation needs separate authorization.

## Authentication and role rules

`guestAuth` and `employeeAuth` retain `beginSignIn({ email })` (returns
`interaction_required` without a password). They expose sign-in completion,
verification, recovery, session restoration, and sign-out. Only the guest provider
exposes `signUp`. The SDK uses `USER_SRP_AUTH`, not a client secret or AWS credentials.

There is one active Cognito identity on the device, not two independently stored
accounts. Explicit sign-in replaces the prior session. Guest access accepts
email-verified ordinary users, including self-registered users without a group,
and members of Guests. Employee-only accounts are directed to Employee Login;
accounts in both groups may use both interfaces. Employee access always requires
the exact Employees claim from the Cognito access token, including after refresh.
Registration does not assign any group. Never assign Employees in client code.

The screen restores/refreshes on mount, foreground, and every minute while active
in its sign-in/session view. Missing, expired, revoked, malformed, wrong-pool,
wrong-client, or unverified sessions cannot grant access. Network failure locks
the view; it does not assert an offline staff authorization. Refresh is through
Amplify `fetchAuthSession({ forceRefresh: true })`. No tokens reach screen props,
results, logs, UI, or the booking API. No auth context has been connected to other
modules. Backgrounding clears entered passwords/codes and hides authorized UI.

Signup confirmation/resend, signed-in email-attribute verification, password
reset, temporary-password replacement, and SMS/email/TOTP sign-in code challenges
are handled. MFA enrollment/selection and other unsupported challenges fail closed
with an administrator-contact message; no staff access is granted for them.
Sign-out clears local secure storage and requests SDK client sign-out/revocation.
It does not promise remote/global sign-out if the network or provider fails.

## Secure storage

`SecureAuthStorage` is registered AFTER `Amplify.configure`, which otherwise
restores Amplify's default store. All token-provider keys, including refresh
tokens and device metadata, use Expo SecureStore; no AsyncStorage fallback is
allowed. AsyncStorage is installed only as an Amplify React Native dependency.
Native storage failures fail closed. Large values are chunked into small encrypted
items, with serialized writes and a secure key index for cleanup. iOS accessibility
is `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. The SecureStore config plugin handles Android
backup exclusions. Do not add auth logging or enable SDK debug logging.

Keychain data can persist across iOS app reinstalls. Explicitly sign out before
handing a device to another person. Session restoration requires live Cognito
refresh; cached token claims are not authoritative backend authorization.

## Native Android development setup and verified checkpoint

### Local Android development build preparation

SDK 54-compatible `expo-dev-client` is installed. Expo's default prebuild plugins
configure it when installed; no EAS project, `eas.json`, hosted authentication
redirect, or additional app-config plugin is needed. The Android package ID and
existing SecureStore plugin are retained. Secure token storage is unchanged.

**EAS is optional, not required.** Local `expo run:android` generates the native
Android project if absent, compiles a debug development client, installs it on
the selected device, and starts Metro. The native debug development APK has now
been successfully built locally, installed, and launched on an authorized POCO F6.
Metro from the original working copy successfully loaded the Holistic Eco-Resort
guest Home screen over USB. The Home screen was visually verified on the phone.
This verifies development-build startup, not live Cognito authentication or booking.

The generated `android/` tree, Gradle caches, APKs, and debug keystores stay local
and are ignored by Git. `app.json`, config plugins, and locked dependencies are
the source of truth. Regenerate native configuration through Expo Prebuild when
those inputs change; do not rely on manual edits to ignored native files.

Local Windows preparation installed Eclipse Temurin JDK 17. Set User `JAVA_HOME`
to the actual JDK 17 installation directory and `ANDROID_HOME` to the SDK directory
(commonly `%LOCALAPPDATA%\Android\Sdk`). Preserve existing User PATH entries and
add `%JAVA_HOME%\bin`, `%ANDROID_HOME%\platform-tools`, and
`%ANDROID_HOME%\cmdline-tools\latest\bin`. Keep Android Studio's bundled JDK
unchanged and do not set the deprecated `ANDROID_SDK_ROOT` variable.
Open a fresh terminal after environment changes (restart its host application if
it still inherits the old environment).

Expo-supported dependency alignment now uses React Native 0.81.5 / React 19.1.0
and the SDK 54 versions of supporting packages. `expo-font` is an explicit native
dependency with its config plugin. Expo Doctor passes all 18 checks. This native
stack requires Android API 36 / Build Tools 36.0.0 and NDK 27.1.12297006; API 35
alone is insufficient. API 36 was installed and verified in Android's package
inventory. Build Tools 36.0.0, NDK 27.1.12297006, CMake 3.22.1, and platform-tools
are also installed. API 35 and Build Tools 35.0.0 remain installed unchanged.
No audit-fix command was run. Other machines may still need to download Gradle
and build dependencies; successful checks alone do not guarantee native compilation.

### Windows build-path and download lessons

The Gradle 8.14.3 wrapper download initially timed out. The official distribution
was downloaded with a longer timeout and its SHA-256 verified against Gradle's
published checksum before being placed in the wrapper cache. The project's
Gradle version and distribution URL were not changed. Do not use unverified
archives or broadly delete Gradle caches to recover from a download failure.

The first native compilation then hit Windows' 260-character path limit in
Ninja/CMake. A temporary drive alias did not fix it because native tooling still
resolved the original long path. Building the same source and exact lockfile in
a physically shorter temporary directory succeeded, without application changes.
For Windows builds, use a short physical checkout/build directory (for example
`C:\dev\resort`) and run `npm ci`. A temporary build copy is not the authoritative
working copy: exclude `.env` files, secrets, and old generated caches, and refresh
it from the current source before any future native build. Never commit the copy,
APKs, or cache backups. No emulator, AWS deployment, or production signing was used.

Connect the physical Android phone with USB debugging enabled and approve this
computer's RSA authorization prompt. Verify that `adb devices` shows `device`,
not `unauthorized`. On devices that require it, enable Install via USB and approve
the installation prompt. The POCO F6 initially rejected installation until that
device-side permission was granted. No emulator is required or created.

After the tooling and compatibility prerequisites are addressed, run this single
command from the `apps/mobile` directory to build/install on the selected device:

```powershell
npx expo run:android --device
```

### Metro over USB (no APK rebuild)

From the original mobile working copy, start Metro:

```powershell
npx expo start --dev-client --localhost --port 8081
```

In another terminal, replace `<device-serial>` with the authorized device shown
by `adb devices` and connect the installed development client:

```powershell
adb -s <device-serial> reverse tcp:8081 tcp:8081
adb -s <device-serial> shell am start -W -a android.intent.action.VIEW -d "exp+holistic-eco-resort://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081" com.holisticecoresort.guest
```

Keep Metro running and USB connected. Dismiss Expo's first-run developer menu on
the phone to see Home; remote ADB input can be restricted by device security.
JavaScript-only changes do not need an APK rebuild. A native-library change does.
Do not enter credentials or trigger signup/sign-in until live testing is authorized.

Reference: https://docs.expo.dev/guides/local-app-development/

Amplify React Native includes the `AmplifyRTNCore` native module for SRP.
**Expo Go cannot run this sign-in implementation.** A missing module or unsupported
web platform displays a setup message and sends no auth request. Use a native
development/standalone build. The existing Expo Go guest modules are not redesigned.

1. Keep dependencies aligned with Expo SDK 54 using `npx expo install --check`.
   The current alignment was performed using Expo-supported install commands,
   without forced peer-dependency overrides or broad framework upgrades.
2. On a properly configured local Android build machine, rebuild with the existing
   `npm run android` command after dependencies are installed. Native generation
   or framework alignment is a separate reviewed change, not an AWS deployment.
3. For iOS, use macOS/Xcode; regenerate/link native dependencies and CocoaPods as
   required by the chosen Expo development-build workflow. Rebuild the app after
   adding SecureStore and Amplify. No hosted-UI redirect URI or Cognito domain is
   required for this native email/password SRP flow.
4. Do not invoke any live authentication UI until explicitly authorized. No test
   users are embedded in the app; automated tests use dependency-injected mocks.

## Cognito console checks (no console changes made)

- Confirm the supplied client belongs to the supplied pool and has **no secret**.
- Enable `ALLOW_USER_SRP_AUTH` and supported refresh sessions for that public client.
  Confirm refresh-token expiration/revocation settings; review rotation settings
  against the installed Amplify version. Do not use an admin-only auth flow.
- Confirm email sign-in, self-service signup, and email verification are enabled.
  Ensure email is readable/writable by the client and signup has no additional
  required attributes beyond email unless the UI is extended first.
- Verify email delivery configuration/SES restrictions, password policy, and
  recovery via verified email. Console configuration was supplied by the owner,
  not independently read through AWS APIs.
- Provision employees through authorized administration and assign Employees.
  Set/verify their email appropriately. Self-registration alone must never grant
  employee membership. A Guests assignment is optional for normal self-signups.
- Code-based MFA and temporary-password challenges work; mandatory MFA enrollment,
  selection, extra required attributes, or custom challenges need additional UI
  before affected accounts can sign in. Do not weaken staff MFA just to bypass UI.

## Backend authorization remains future work

Successful mobile authentication does not expose Booking History, bookings, guest
data, payments, or operations. Future backend endpoints must validate JWT signature,
issuer, client/audience, expiry, token use, and Employees membership where required.
Guest records must be scoped to verified Cognito `sub` ownership. Never trust this
mobile UI's role checks as a server authorization boundary. No existing admin,
booking/payment, Simplotel, or gallery code was changed.

## Verification

`npm run test:auth` uses mocked Cognito and secure-storage ports, with live fetch
blocked. `npm run typecheck` checks mobile TypeScript. Run the existing admin
booking/preparation/execution/safety/room-media tests for cross-feature regression.
Device sign-in, email delivery, native keychain behavior, and console configuration
still require authorized manual validation. npm audit reported 20 advisories
(11 moderate, 9 high) in the installed dependency tree; do not blindly run a major
`npm audit fix --force` across the approved app to address them.

Official implementation references:
- https://docs.amplify.aws/react-native/build-a-backend/auth/use-existing-cognito-resources/
- https://docs.amplify.aws/gen1/react-native/build-a-backend/auth/manage-user-session/
- https://docs.amplify.aws/react-native/frontend/auth/sign-in/
- https://docs.expo.dev/versions/v54.0.0/sdk/securestore/

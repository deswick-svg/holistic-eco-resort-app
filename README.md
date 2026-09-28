# Holistic Eco-Resort App

Guest app for Holistic Eco-Resort, Kannur. The phone is Expo / React Native. The API and admin screens are a Next.js app. Simplotel is the booking system. Guest accounts are Amazon Cognito in `ap-south-1` (Mumbai).

## Apps

| App | Path | Run |
|---|---|---|
| Guest phone app | `apps/mobile` | `npm install` then `npx expo start` |
| API and admin site | `apps/admin` | `npm install` then `npm run dev` |

Sign-in needs a native development build. Expo Go cannot run the Cognito SRP flow.

```bash
cd apps/mobile
npm install
npx expo run:android
# or: npx expo run:ios
```

The admin API for local booking search is `http://127.0.0.1:3001`. Point the phone at it with `EXPO_PUBLIC_API_BASE_URL`.

## Environment

Each app has its own env file. Do not commit the local files.

| Local file | Template |
|---|---|
| `apps/mobile/.env` | `apps/mobile/.env.example` |
| `apps/admin/.env.local` | `apps/admin/.env.example` |

Keep these pairs identical:

- `EXPO_PUBLIC_AWS_REGION` and `AWS_REGION` (`ap-south-1`)
- `EXPO_PUBLIC_COGNITO_USER_POOL_ID` and `GUEST_HISTORY_COGNITO_USER_POOL_ID`
- `EXPO_PUBLIC_COGNITO_CLIENT_ID` and `GUEST_HISTORY_COGNITO_CLIENT_ID`
- `EXPO_PUBLIC_COGNITO_GUEST_GROUP` and `COGNITO_GUEST_GROUP` (default `Guests`)
- `EXPO_PUBLIC_COGNITO_EMPLOYEE_GROUP` and `COGNITO_EMPLOYEE_GROUP` (default `Employees`)

Cognito group names are case-sensitive. Change them in the env files and in the Cognito pool. The phone and the API both read those names, so a rename does not require a code edit. A normal guest needs no group. An account that is only in the employee group must use Employee Login.

`EXPO_PUBLIC_API_BASE_URL` is the phone’s API address. Locally that is `http://127.0.0.1:3001`. For a beta build it must be an `ap-south-1` Lambda Function URL.

Server-only values stay in `apps/admin/.env.local`: `SIMPLOTEL_ACCESS_TOKEN`, `SIMPLOTEL_API_BASE_URL`, `SIMPLOTEL_HOTEL_ID`, `GUEST_HISTORY_DYNAMODB_TABLE`, and the booking flags. Do not put those in the mobile env.

EAS cloud builds do not read `apps/mobile/.env`. The `beta` and `play-internal` profiles in `apps/mobile/eas.json` set the region and the two group names. Set the pool id, client id, and API URL on the Expo preview environment before `eas build`. Lambda does not read `apps/admin/.env.local`. Set the same server names on the function in Mumbai.

## Booking

Live rates come from Simplotel through the Next.js API. The phone never holds the Simplotel token. Payment-link creation stays off unless `SIMPLOTEL_BOOKING_ENABLED=true` on the server.

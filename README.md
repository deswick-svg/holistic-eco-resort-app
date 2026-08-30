# Holistic Eco-Resort App

Starter codebase for the Holistic Eco-Resort guest app.

## Current scope

- Android + iPhone guest app with Expo / React Native
- Official supplied Holistic Eco-Resort logo used as-is; only proportional resizing in UI
- Attached guest-experience image used as the main home hero image
- Real Tree House and Glass Dome photography referenced from the official Holistic Eco-Resort / Simplotel-hosted website assets
- Guest menu includes all requested legacy-app options
- Booking UI scaffold designed to be connected to Simplotel rather than maintaining an independent room inventory
- AWS integration points stubbed for app-specific services

## Run locally

```bash
cd apps/mobile
npm install
npx expo start
```

Then open in Expo Go or an Android/iOS simulator.

## Important

The Simplotel service is intentionally a stub until official API/integration documentation and credentials are available. Do not create a parallel production room inventory without first confirming the authoritative data flow with Simplotel/PMS/channel manager.

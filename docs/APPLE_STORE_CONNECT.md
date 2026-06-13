# OpenDev App Store Connect Setup

OpenDev is prepared for App Store Connect submission through Expo EAS Submit. The repository does **not** commit Apple secrets or `.p8` private keys.

## 1. Create the App Store Connect app

Create a new iOS app in App Store Connect using:

- App name: `OpenDev`
- Bundle ID: `com.opendev.app`
- SKU: `opendev-ios`
- Primary language: `English (U.S.)`

The bundle identifier must match `apps/mobile/app.json`.

## 2. Create an App Store Connect API key

In App Store Connect, go to **Users and Access → Integrations → App Store Connect API**, create a key with the right access, then download the `.p8` private key once.

Place the downloaded file locally at:

```bash
apps/mobile/credentials/apple/AuthKey_<KEY_ID>.p8
```

The `apps/mobile/credentials/apple/.gitignore` file prevents committing Apple private keys.

## 3. Set local environment variables

Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in:

```bash
EXPO_APPLE_ID=apple-id@example.com
EXPO_ASC_APP_ID=1234567890
EXPO_ASC_API_KEY_ID=ABC123DEFG
EXPO_ASC_API_KEY_ISSUER_ID=00000000-0000-0000-0000-000000000000
EXPO_ASC_API_KEY_PATH=./credentials/apple/AuthKey_ABC123DEFG.p8
```

## 4. Verify local App Store Connect configuration

```bash
npm run check:apple-connect
```

## 5. Connect EAS Submit to Apple

Run the interactive EAS submit configuration from the mobile workspace:

```bash
cd apps/mobile
npm run connect:apple
```

When prompted, choose the OpenDev App Store Connect app and API key. EAS will store the secure submit credentials with Expo.

## 6. Build and submit

```bash
npm run build:ios:testflight
```

Or build and submit separately:

```bash
npm run build:ios
npm run submit:ios
```

If submitting from CI, store the Apple/EAS values as encrypted CI secrets and ensure the `.p8` file is available at the configured path during the job.

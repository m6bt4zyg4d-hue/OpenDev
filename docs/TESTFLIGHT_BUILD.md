# Submit the first OpenDev iOS build for TestFlight

App Store Connect cannot start TestFlight testing until at least one signed iOS build has been uploaded and processed.

## Fast path: build and submit in one command

From the repo root, after App Store Connect credentials are configured:

```bash
npm run build:ios:testflight
```

This runs EAS Build with the `production` profile and `--auto-submit`, so the completed build is uploaded to App Store Connect automatically.

## Manual path: build first, then submit

```bash
npm run build:ios
npm run submit:ios
```

Use this path if you want to inspect the EAS build before uploading it to Apple.

## After upload finishes

1. Open App Store Connect.
2. Select the `OpenDev` app.
3. Go to the `TestFlight` tab.
4. Wait for Apple processing to finish. Expo notes that iOS submissions appear in TestFlight after App Store Connect processing.
5. Add the processed build to an internal testing group.
6. Invite internal testers.
7. For external testers, add the build to an external group and submit it for Apple's beta app review when prompted.

## Troubleshooting

- If App Store Connect still says “submit a build to start testing,” the upload has not completed or Apple has not finished processing the build yet.
- If EAS asks for Apple credentials, run `cd apps/mobile && npm run connect:apple` first.
- If local validation fails, run `npm run check:apple-connect` and fill in the missing values in `apps/mobile/.env`.
- Make sure the App Store Connect app bundle ID is `com.opendev.app`, matching `apps/mobile/app.json`.

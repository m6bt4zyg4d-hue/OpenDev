# OpenDev

OpenDev is a full-stack AI software development platform monorepo for iOS, Android, desktop web, and Supabase. The codebase is now framed around project creation, AI agents, OpenDev Studio, hosting, deployment, billing, and app-store publishing instead of the previous social-media product surface.

## Workspace layout

- `apps/mobile` — Expo React Native companion app for OpenDev dashboards, project wizard, Studio, AI agents, deployment, and billing surfaces.
- `apps/web` — Next.js desktop/web OpenDev dashboard with project creation, Studio IDE preview, AI agents, hosting, publishing, collaboration, security, and billing sections.
- `packages/types` — Shared TypeScript domain and database-facing types.
- `packages/api` — Shared Supabase repository plus production integration adapters for live streaming, push/email delivery, and AI moderation services.
- `packages/design-system` — Shared dark-mode-ready color, spacing, radius, typography, shadow, and button tokens.
- `supabase/schema.sql` — Current Postgres schema retained for auth, accounts, content/assets, notifications, support, moderation, operational views, and storage while OpenDev-specific product tables are iterated.

## Requirements

- Node.js 20+
- npm 10+
- Expo CLI through `npx expo`
- EAS CLI for iOS cloud builds and App Store submission
- A Supabase project or local Supabase CLI stack

## Environment setup

```bash
npm install
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

Fill in both env files with your Supabase project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database setup

Apply `supabase/schema.sql` in the Supabase SQL editor or with the Supabase CLI while the OpenDev-specific schema is finalized.

```bash
supabase db push
```

## Running locally

```bash
npm run dev:web
npm run dev:mobile
```

The web app runs the OpenDev desktop dashboard. The mobile app runs a native OpenDev companion experience with Dashboard, Studio, Agents, Deploy, and Billing tabs.

## Building

```bash
npm run build:desktop
npm run build:ios
npm run build:ios:testflight
npm run build:ios:preview
npm run build:ios:simulator
npm run submit:ios
```

The iOS build and submit commands require EAS CLI access, an Expo account, Apple Developer credentials, and App Store Connect setup. See `docs/APPLE_STORE_CONNECT.md` for the OpenDev connection workflow and `docs/TESTFLIGHT_BUILD.md` for submitting the first TestFlight build.

## External integration TODOs

External provider adapters are configured through environment variables:

- `OPENDEV_LIVE_STREAM_WEBHOOK_URL` for live stream or preview provisioning.
- `OPENDEV_AI_MODERATION_URL` for managed AI moderation, with a Supabase heuristic fallback.
- `OPENDEV_PUSH_WEBHOOK_URL` and `OPENDEV_EMAIL_WEBHOOK_URL` for push and transactional email delivery.
- Add payment/subscription providers when OpenDev introduces paid AI, hosting, or premium features.

## Useful commands

```bash
npm run typecheck
npm run lint
npm run build:desktop
npm --workspace apps/web run dev
npm --workspace apps/mobile run start
```

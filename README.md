# Media

Media is a full-stack social media platform monorepo for iOS, Android, desktop web, and Supabase. It includes a working Supabase Auth foundation, cross-platform social screens, shared strict TypeScript packages, and a production-oriented database schema for feeds, stories, DMs, notifications, safety, support, and moderation.

## Workspace layout

- `apps/mobile` — Expo React Native app for iOS and Android with persisted Supabase sessions, protected mobile tabs, feed, stories, DMs, notifications, profile, support, and moderation surfaces.
- `apps/web` — Next.js responsive desktop/web app with protected routes, X-like sidebar/feed/trending layout, auth, public profiles, edit profile, dashboards, DMs, notifications, safety flows, and legal/delete-account pages.
- `packages/types` — Shared TypeScript domain and database-facing types.
- `packages/api` — Shared Supabase repository plus production integration adapters for live streaming, push/email delivery, and AI moderation services.
- `packages/design-system` — Shared dark-mode-ready color, spacing, radius, typography, shadow, and button tokens.
- `supabase/schema.sql` — Postgres schema, Auth signup trigger, views, relationships, indexes, triggers, RLS enablement, policies, storage setup, auto-moderation triggers, advertising tables, and operational views.

## Requirements

- Node.js 20+
- npm 10+
- Expo CLI through `npx expo`
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

Apply `supabase/schema.sql` in the Supabase SQL editor or with the Supabase CLI. The schema includes:

- Email/password auth profile auto-creation via `public.handle_new_auth_user()`.
- Profiles with avatar, banner, bio, username, display name, verification, and follower/following/post counters.
- Posts, media, comments, likes, reposts, quote posts, bookmarks, follows, feeds, and trending hashtags.
- Stories with 24-hour expiration and story views.
- 1-on-1/group conversations, messages, read receipts, and typing indicators.
- In-app notifications and device tokens for Expo/APNS/FCM delivery adapters.
- Reports, blocks, mutes, support tickets, appeals, bans, admin actions, and moderation queue.
- RLS policies for users, content owners, conversation members, ticket participants, and staff roles.

```bash
supabase db push
```

## Running locally

```bash
npm run dev:web
npm run dev:mobile
```

The web app runs with protected Next.js routes and client-side Supabase session awareness. The mobile app persists sessions using AsyncStorage and gates protected tabs until login.

## External integration TODOs

External provider adapters are configured through environment variables:

- `MEDIA_LIVE_STREAM_WEBHOOK_URL` for live stream provisioning.
- `MEDIA_AI_MODERATION_URL` for managed AI moderation, with a Supabase heuristic fallback.
- `MEDIA_PUSH_WEBHOOK_URL` and `MEDIA_EMAIL_WEBHOOK_URL` for push and transactional email delivery.
- Add payment/subscription providers only if Media introduces paid creator or premium features.

## Useful commands

```bash
npm run typecheck
npm run lint
npm --workspace apps/web run dev
npm --workspace apps/mobile run start
```

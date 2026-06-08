# Media Production Audit — 2026-06-08

## Fully working / production-backed after this pass

- Authentication: signup, login, logout, password reset, and persisted Supabase sessions are handled by the shared repository and used by web/mobile clients.
- Users: profile reads/edits, avatars, banners, bio, location, website, counts, and verification flags are Supabase-backed.
- Posts: text posts, image/video/multiple media uploads, post edits, deletes, counts, and profile feeds are Supabase-backed.
- Engagement: likes, comments/replies, reposts, shares through the native share API, and bookmarks write to Supabase.
- Discovery: home feed, following feed, explore trends, user search, post search, bookmark feed, and right-rail suggestions query Supabase.
- Communication: notifications and direct-message conversation lists query Supabase.
- Admin/moderation: dashboards query live metrics, moderation queue, support tickets, sponsored posts, and can perform staff actions through RLS-protected RPCs.
- Auto moderation: Supabase triggers score posts/comments for spam, NSFW, hate/harassment, scam language, and escalation.
- Advertising: sponsored posts, active promoted feed view, pinned promotion support, and admin metrics are modeled in Supabase.
- Mobile: authentication, feed, explore, posting, messages, alerts, profile, and admin screens now consume the shared Supabase repository instead of demo data.

## Partially working features

- AI moderation uses a deterministic Supabase heuristic by default and can call `MEDIA_AI_MODERATION_URL`; teams should connect a managed ML provider for image/video classifiers and advanced policy taxonomies.
- Push, email, and live streaming use production webhook adapters; deployment requires provider URLs in environment variables.
- Comment moderation is available through queue entries and admin review, but a full threaded comment management UI remains a later enhancement.
- Reports can be created and counted; a richer report detail workspace is still needed for high-volume trust-and-safety teams.
- Mobile media picking/camera UI advertises the configured capability, but this pass focused on removing demo data and wiring core Supabase flows.

## Missing / next production priorities

- Full ad campaign CRUD with targeting, impressions, billing, pacing, and creative review.
- Full direct-message thread view with send/edit/delete message UI.
- Rich reports inbox with evidence previews, bulk actions, and appeal workflows.
- Provider-backed image/video NSFW classifiers and perceptual hash matching.
- Legal finalization of Terms/Privacy copy by counsel.

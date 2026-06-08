# Mobile screen-by-screen production audit

This audit was produced after inspecting `apps/mobile/App.tsx`, `apps/mobile/src/lib/supabase.ts`, and the shared Supabase repository. The production rule used for this pass: every visible screen must either use real Supabase-backed data/actions behind a confirmed Supabase session, or the unfinished feature must be hidden from mobile UI/navigation.

## Global authentication and navigation

### What was broken
- A local cached session could previously be trusted too early if it existed in storage.
- The home composer prompt looked tappable but did not open the composer.

### What was fixed
- Candidate sessions are now verified with `supabase.auth.getUser()` before protected tabs can render; invalid/stale sessions are cleared and signed out.
- Empty login/signup inputs fail on the mobile form and again in the shared repository before Supabase auth calls.
- The bottom navigation only renders after a verified Supabase session exists.
- The home composer prompt now opens the real Create screen instead of acting like a dead control.

### What was hidden
- Auth, Admin, Alerts, debug, Premium, Stories, DMs-as-a-separate-tab, Go Live, camera, GIF, poll, and draft tabs/actions are not exposed in production navigation.

### App Store blockers
- EAS/TestFlight must still be run against production Supabase credentials.

## Home screen

### What was broken
- The composer prompt was a visual affordance without an action.

### What was fixed
- For You loads real posts/trends from Supabase repository calls.
- Following loads real followed-user posts from Supabase.
- Pull-to-refresh reloads the active backend feed.
- The composer prompt now routes to Create.

### What was hidden
- Ads/sponsored posts are not shown in mobile Home.
- Stories, Go Live, Premium, GIFs, polls, drafts, and camera capture are hidden.

### App Store blockers
- Production Supabase `post_feed`, `following_feed`, and `trending_hashtags` must be deployed and accessible under RLS.

## Search screen

### What was broken
- Search needed verification that default content was not fake/demo content.

### What was fixed
- Search queries real profiles and real posts through the repository.
- Default explore content uses real feed/trending data only, with empty states when none exists.
- User follow buttons use real follow/unfollow state and writes.

### What was hidden
- Fake trending hashtags and scraped/demo content are not present.
- Premium/admin/debug discovery surfaces are hidden.

### App Store blockers
- Search quality depends on deployed Supabase data, indexes, and RLS policies.

## Create Post screen

### What was broken
- Unfinished creation tools needed to remain hidden.

### What was fixed
- The composer requires text or media before posting.
- Text posts are created through Supabase.
- Image/video library assets upload to Supabase storage and are linked to posts.
- GIF, poll, live, camera capture, and drafts are not exposed.

### What was hidden
- Camera capture, GIFs, polls, live, and drafts.

### App Store blockers
- Supabase `media` bucket/table/storage policies must exist in production.
- Native media upload should be validated in a real EAS/TestFlight build.

## Activity screen

### What was broken
- Activity needed verification that notifications and messages were not hardcoded.

### What was fixed
- Notifications load from Supabase.
- Conversation summaries load from Supabase.
- Empty states are safe and generic; they do not include fake alerts or fake conversations.

### What was hidden
- A separate DMs tab and message composer are hidden until the full messaging UX is implemented.
- Admin/debug alerts are hidden.

### App Store blockers
- Push notification delivery and full DM compose/thread UX require end-to-end production validation.

## Profile screen

### What was broken
- Profile controls needed verification for backend persistence and username-change restrictions.

### What was fixed
- The authenticated profile loads from Supabase.
- Profile feed loads real posts from Supabase.
- Edit profile persists username, display name, bio, avatar URL, and banner URL through the repository.
- Username uniqueness and 30-day username-change restriction are checked before save.

### What was hidden
- Public profile navigation/details beyond search rows are not exposed as unfinished deep links.
- Premium/admin profile controls are hidden.

### App Store blockers
- Production schema triggers/RLS for username changes must be deployed.

## Remaining global App Store blockers

- Run a real EAS build with production Supabase credentials.
- Apply the current Supabase schema, RLS policies, storage bucket, and storage policies in production.
- Validate media upload, auth redirects/password reset, notifications, and conversation reads on physical iOS/Android devices.
- Resolve existing dependency audit warnings through planned framework/dependency upgrades.

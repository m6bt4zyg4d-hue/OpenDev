-- Media Supabase schema
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "citext";

create type app_role as enum ('owner', 'admin', 'moderator', 'support', 'user');
create type visibility as enum ('public', 'followers', 'private');
create type post_type as enum ('text', 'image', 'video', 'quote');
create type media_type as enum ('image', 'video', 'audio');
create type moderation_status as enum ('pending', 'approved', 'rejected', 'escalated');
create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type ticket_status as enum ('open', 'pending', 'resolved', 'closed');
create type conversation_member_role as enum ('owner', 'member');
create type notification_type as enum ('like', 'comment', 'follow', 'repost', 'mention', 'message', 'system', 'moderation');
create type live_status as enum ('scheduled', 'live', 'ended');
create type appeal_status as enum ('open', 'accepted', 'rejected');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role app_role not null default 'user',
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  username citext unique not null,
  display_name text not null,
  avatar_url text,
  banner_url text,
  bio text,
  verified boolean not null default false,
  location text,
  website text,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  posts_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~* '^[a-z0-9_]{3,30}$')
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  storage_path text not null,
  url text not null,
  media_type media_type not null,
  alt_text text,
  width integer,
  height integer,
  duration_seconds numeric,
  blurhash text,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '',
  post_type post_type not null default 'text',
  visibility visibility not null default 'public',
  quote_post_id uuid references public.posts(id) on delete set null,
  moderation_status moderation_status not null default 'pending',
  like_count integer not null default 0,
  comment_count integer not null default 0,
  repost_count integer not null default 0,
  bookmark_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_media (
  post_id uuid references public.posts(id) on delete cascade,
  media_id uuid references public.media(id) on delete cascade,
  position integer not null default 0,
  primary key (post_id, media_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  body text not null,
  moderation_status moderation_status not null default 'pending',
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_one_target check ((post_id is not null)::int + (comment_id is not null)::int = 1)
);
create unique index likes_user_post_unique on public.likes (user_id, post_id) where post_id is not null;
create unique index likes_user_comment_unique on public.likes (user_id, comment_id) where comment_id is not null;

create table public.reposts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  quote_post_id uuid references public.posts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table public.bookmarks (
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  caption text,
  moderation_status moderation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create table public.story_views (
  story_id uuid references public.stories(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create table public.live_streams (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  status live_status not null default 'scheduled',
  ingest_url text,
  playback_url text,
  viewer_count integer not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  moderation_status moderation_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  is_group boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role conversation_member_role not null default 'member',
  last_read_at timestamptz,
  typing_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '',
  moderation_status moderation_status not null default 'pending',
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table public.message_media (
  message_id uuid references public.messages(id) on delete cascade,
  media_id uuid references public.media(id) on delete cascade,
  primary key (message_id, media_id)
);

create table public.message_reads (
  message_id uuid references public.messages(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type notification_type not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  email_sent_at timestamptz,
  push_sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);


create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('expo','apns','fcm')),
  token text not null,
  platform text check (platform in ('ios','android','web')),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  unique (provider, token)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','story','message','user','live_stream')),
  target_id uuid not null,
  reason text not null,
  details text,
  status report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  assignee_id uuid references public.profiles(id) on delete set null,
  subject text not null,
  message text not null,
  status ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  internal_note boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.moderation_queue (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post','comment','story','message','user','live_stream','live_chat')),
  target_id uuid not null,
  status moderation_status not null default 'pending',
  ai_score numeric check (ai_score between 0 and 1),
  ai_reason text,
  assigned_to uuid references public.profiles(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  banned_by uuid references public.profiles(id) on delete set null,
  reason text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  moderation_queue_id uuid references public.moderation_queue(id) on delete set null,
  ban_id uuid references public.bans(id) on delete set null,
  reason text not null,
  status appeal_status not null default 'open',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.blocks (
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

create table public.mutes (
  muter_id uuid references public.profiles(id) on delete cascade,
  muted_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id),
  constraint no_self_mute check (muter_id <> muted_id)
);

create materialized view public.trending_hashtags as
select lower(match[1]) as tag, count(*) as uses
from public.posts, regexp_matches(body, '#([A-Za-z0-9_]+)', 'g') as match
group by lower(match[1])
order by uses desc;


create view public.post_feed as
select
  p.id,
  p.author_id,
  p.body,
  p.post_type,
  p.visibility,
  p.quote_post_id,
  p.moderation_status,
  p.like_count,
  p.comment_count,
  p.repost_count,
  p.bookmark_count,
  p.created_at,
  pr.username,
  pr.display_name,
  pr.avatar_url,
  pr.banner_url,
  pr.bio,
  pr.verified,
  pr.followers_count,
  pr.following_count,
  pr.posts_count,
  coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'ownerId', m.owner_id, 'url', m.url, 'type', m.media_type, 'altText', m.alt_text, 'width', m.width, 'height', m.height, 'durationSeconds', m.duration_seconds) order by pm.position) filter (where m.id is not null), '[]'::jsonb) as media
from public.posts p
join public.profiles pr on pr.id = p.author_id
left join public.post_media pm on pm.post_id = p.id
left join public.media m on m.id = pm.media_id
group by p.id, pr.id;

create view public.story_feed as
select
  s.id,
  s.author_id,
  s.caption,
  s.moderation_status,
  s.expires_at,
  s.created_at,
  pr.username,
  pr.display_name,
  pr.avatar_url,
  pr.banner_url,
  pr.bio,
  pr.verified,
  pr.followers_count,
  pr.following_count,
  pr.posts_count,
  jsonb_build_object('id', m.id, 'ownerId', m.owner_id, 'url', m.url, 'type', m.media_type, 'altText', m.alt_text, 'width', m.width, 'height', m.height, 'durationSeconds', m.duration_seconds) as media,
  exists (select 1 from public.story_views sv where sv.story_id = s.id and sv.viewer_id = auth.uid()) as viewed
from public.stories s
join public.profiles pr on pr.id = s.author_id
join public.media m on m.id = s.media_id;

create view public.conversation_list as
select
  c.id,
  c.title,
  c.is_group,
  c.created_by,
  c.created_at,
  c.updated_at,
  coalesce(jsonb_agg(distinct jsonb_build_object('id', p.id, 'username', p.username, 'displayName', p.display_name, 'avatarUrl', p.avatar_url, 'verified', p.verified, 'followersCount', p.followers_count, 'followingCount', p.following_count, 'postsCount', p.posts_count)) filter (where p.id is not null), '[]'::jsonb) as participants,
  greatest(0, count(m.id) filter (where m.created_at > coalesce(me.last_read_at, 'epoch'::timestamptz) and m.sender_id <> auth.uid()))::int as unread_count,
  (select jsonb_build_object('id', lm.id, 'conversationId', lm.conversation_id, 'body', lm.body, 'createdAt', lm.created_at, 'readBy', '[]'::jsonb) from public.messages lm where lm.conversation_id = c.id order by lm.created_at desc limit 1) as last_message
from public.conversations c
join public.conversation_members me on me.conversation_id = c.id and me.user_id = auth.uid()
join public.conversation_members cm on cm.conversation_id = c.id
join public.profiles p on p.id = cm.user_id
left join public.messages m on m.conversation_id = c.id
group by c.id, me.last_read_at;

create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path = public as $$
declare
  desired_username text;
  desired_display_name text;
begin
  desired_username := coalesce(nullif(new.raw_user_meta_data->>'username', ''), 'user_' || substr(new.id::text, 1, 8));
  desired_display_name := coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1), desired_username);
  insert into public.users (id, email) values (new.id, new.email) on conflict (id) do nothing;
  insert into public.profiles (id, username, display_name)
  values (new.id, lower(regexp_replace(desired_username, '[^a-zA-Z0-9_]', '', 'g')), desired_display_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

create or replace function public.refresh_follow_counts() returns trigger language plpgsql as $$
begin
  update public.profiles p set
    followers_count = (select count(*) from public.follows f where f.following_id = p.id),
    following_count = (select count(*) from public.follows f where f.follower_id = p.id)
  where p.id in (coalesce(new.follower_id, old.follower_id), coalesce(new.following_id, old.following_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.refresh_profile_post_count() returns trigger language plpgsql as $$
begin
  update public.profiles p set posts_count = (select count(*) from public.posts po where po.author_id = p.id)
  where p.id = coalesce(new.author_id, old.author_id);
  return coalesce(new, old);
end;
$$;

create or replace function public.refresh_post_counts() returns trigger language plpgsql as $$
declare affected_post uuid;
begin
  affected_post := coalesce(new.post_id, old.post_id);
  if affected_post is not null then
    update public.posts p set
      like_count = (select count(*) from public.likes l where l.post_id = p.id),
      comment_count = (select count(*) from public.comments c where c.post_id = p.id),
      repost_count = (select count(*) from public.reposts r where r.post_id = p.id),
      bookmark_count = (select count(*) from public.bookmarks b where b.post_id = p.id)
    where p.id = affected_post;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger follows_refresh_counts after insert or delete on public.follows for each row execute function public.refresh_follow_counts();
create trigger posts_refresh_profile_counts after insert or delete on public.posts for each row execute function public.refresh_profile_post_count();
create trigger likes_refresh_post_counts after insert or delete on public.likes for each row execute function public.refresh_post_counts();
create trigger comments_refresh_post_counts after insert or delete on public.comments for each row execute function public.refresh_post_counts();
create trigger reposts_refresh_post_counts after insert or delete on public.reposts for each row execute function public.refresh_post_counts();
create trigger bookmarks_refresh_post_counts after insert or delete on public.bookmarks for each row execute function public.refresh_post_counts();

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role in ('owner','admin','moderator','support'));
$$;

create or replace function public.perform_admin_action(action_name text, target_type text, target_id uuid, metadata jsonb default '{}'::jsonb) returns uuid language plpgsql security definer as $$
declare action_id uuid;
begin
  if not public.is_staff() then
    raise exception 'Only staff can perform admin actions';
  end if;
  insert into public.admin_actions (actor_id, action, target_type, target_id, metadata)
  values (auth.uid(), action_name, target_type, target_id, metadata)
  returning id into action_id;
  if action_name = 'remove_content' and target_type = 'post' then
    update public.posts set moderation_status = 'rejected' where id = target_id;
  elsif action_name = 'ban_user' and target_type = 'user' then
    insert into public.bans (user_id, banned_by, reason) values (target_id, auth.uid(), coalesce(metadata->>'reason', 'Admin ban'));
  elsif action_name = 'suspend_user' and target_type = 'user' then
    update public.users set is_active = false where id = target_id;
  end if;
  return action_id;
end;
$$;

create index posts_author_created_idx on public.posts (author_id, created_at desc);
create index posts_visibility_created_idx on public.posts (visibility, created_at desc);
create index comments_post_created_idx on public.comments (post_id, created_at desc);
create index stories_author_expires_idx on public.stories (author_id, expires_at desc);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at desc);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index moderation_status_created_idx on public.moderation_queue (status, created_at desc);
create index reports_status_created_idx on public.reports (status, created_at desc);
create index follows_following_idx on public.follows (following_id, created_at desc);
create index device_tokens_user_idx on public.device_tokens (user_id);
create index support_ticket_messages_ticket_idx on public.support_ticket_messages (ticket_id, created_at);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_touch_updated before update on public.users for each row execute function public.touch_updated_at();
create trigger profiles_touch_updated before update on public.profiles for each row execute function public.touch_updated_at();
create trigger posts_touch_updated before update on public.posts for each row execute function public.touch_updated_at();
create trigger comments_touch_updated before update on public.comments for each row execute function public.touch_updated_at();
create trigger support_touch_updated before update on public.support_tickets for each row execute function public.touch_updated_at();

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.media enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.reposts enable row level security;
alter table public.bookmarks enable row level security;
alter table public.follows enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.live_streams enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_media enable row level security;
alter table public.message_reads enable row level security;
alter table public.notifications enable row level security;
alter table public.device_tokens enable row level security;
alter table public.reports enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.moderation_queue enable row level security;
alter table public.admin_actions enable row level security;
alter table public.bans enable row level security;
alter table public.appeals enable row level security;
alter table public.blocks enable row level security;
alter table public.mutes enable row level security;

create policy "Users read own auth row" on public.users for select using (id = auth.uid() or public.is_staff());
create policy "Users update own active metadata" on public.users for update using (id = auth.uid() or public.is_staff());
create policy "Public profiles are readable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid());
create policy "Public posts are readable" on public.posts for select using (visibility = 'public' or author_id = auth.uid() or public.is_staff());
create policy "Users create own posts" on public.posts for insert with check (author_id = auth.uid());
create policy "Users update own posts" on public.posts for update using (author_id = auth.uid());
create policy "Active stories are readable" on public.stories for select using (expires_at > now() or author_id = auth.uid() or public.is_staff());
create policy "Users create own stories" on public.stories for insert with check (author_id = auth.uid());
create policy "Conversation members read conversations" on public.conversation_members for select using (user_id = auth.uid() or public.is_staff());
create policy "Conversation members read messages" on public.messages for select using (exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()) or public.is_staff());
create policy "Conversation members send messages" on public.messages for insert with check (sender_id = auth.uid() and exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()));
create policy "Users read own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "Users create reports" on public.reports for insert with check (reporter_id = auth.uid());
create policy "Users read own reports" on public.reports for select using (reporter_id = auth.uid() or public.is_staff());
create policy "Users create support tickets" on public.support_tickets for insert with check (requester_id = auth.uid());
create policy "Users and support read tickets" on public.support_tickets for select using (requester_id = auth.uid() or public.is_staff());
create policy "Staff manage moderation" on public.moderation_queue for all using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage admin actions" on public.admin_actions for all using (public.is_staff()) with check (public.is_staff());
create policy "Users read own appeals" on public.appeals for select using (user_id = auth.uid() or public.is_staff());
create policy "Users create own appeals" on public.appeals for insert with check (user_id = auth.uid());


create policy "Users manage own media" on public.media for all using (owner_id = auth.uid() or public.is_staff()) with check (owner_id = auth.uid() or public.is_staff());
create policy "Public post media readable" on public.post_media for select using (true);
create policy "Users manage own comments" on public.comments for all using (author_id = auth.uid() or public.is_staff()) with check (author_id = auth.uid() or public.is_staff());
create policy "Users manage own likes" on public.likes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own reposts" on public.reposts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own bookmarks" on public.bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own follows" on public.follows for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());
create policy "Users manage own story views" on public.story_views for all using (viewer_id = auth.uid()) with check (viewer_id = auth.uid());
create policy "Live streams are readable" on public.live_streams for select using (status = 'live' or host_id = auth.uid() or public.is_staff());
create policy "Hosts manage own streams" on public.live_streams for all using (host_id = auth.uid() or public.is_staff()) with check (host_id = auth.uid() or public.is_staff());
create policy "Users manage own device tokens" on public.device_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Ticket participants read messages" on public.support_ticket_messages for select using (exists (select 1 from public.support_tickets st where st.id = support_ticket_messages.ticket_id and (st.requester_id = auth.uid() or public.is_staff())));
create policy "Ticket participants create messages" on public.support_ticket_messages for insert with check (sender_id = auth.uid() and exists (select 1 from public.support_tickets st where st.id = support_ticket_messages.ticket_id and (st.requester_id = auth.uid() or public.is_staff())));
create policy "Users manage blocks" on public.blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "Users manage mutes" on public.mutes for all using (muter_id = auth.uid()) with check (muter_id = auth.uid());

insert into public.media (id, owner_id, storage_path, url, media_type, alt_text)
select '00000000-0000-0000-0000-000000000101', id, 'seed/banner.jpg', 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200', 'image', 'Demo banner'
from public.profiles
where username = 'mediafounder'
on conflict do nothing;

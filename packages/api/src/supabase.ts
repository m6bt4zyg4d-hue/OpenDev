import { createClient } from '@supabase/supabase-js';
import type { Conversation, DashboardMetrics, FeedBundle, MediaAsset, Message, ModerationQueueItem, Notification, Post, Profile, Report, SponsoredPost, Story, SupportTicket } from '@opendev/types';

export interface MediaApiConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  options?: Parameters<typeof createClient>[2];
}

export function createMediaClient(config: MediaApiConfig): any {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    ...config.options
  });
}

export interface SignUpInput {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface ProfileUpdateInput {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export class MediaRepository {
  constructor(private readonly client: any) {}

  signUp(input: SignUpInput) {
    return this.client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { username: input.username, display_name: input.displayName } }
    });
  }

  signIn(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  resetPassword(email: string, redirectTo?: string) {
    return this.client.auth.resetPasswordForEmail(email, { redirectTo });
  }

  signOut() {
    return this.client.auth.signOut();
  }

  getSession() {
    return this.client.auth.getSession();
  }

  async getMyProfile(): Promise<Profile | null> {
    const { data: user } = await this.client.auth.getUser();
    if (!user.user) return null;
    const [{ data: profile }, { data: account }] = await Promise.all([
      this.client.from('profiles').select('*').eq('id', user.user.id).maybeSingle(),
      this.client.from('users').select('role').eq('id', user.user.id).maybeSingle()
    ]);
    return profile ? mapProfile({ ...profile, role: account?.role ?? 'user' }) : null;
  }

  async getProfile(username: string): Promise<Profile | null> {
    const { data } = await this.client.from('profiles').select('*').eq('username', username).maybeSingle();
    return data ? mapProfile(data) : null;
  }

  async searchProfiles(query: string): Promise<Profile[]> {
    if (!query.trim()) return [];
    const { data } = await this.client
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(20);
    return (data ?? []).map(mapProfile);
  }

  async searchPosts(query: string): Promise<Post[]> {
    if (!query.trim()) return [];
    const { data } = await this.client
      .from('post_feed')
      .select('*')
      .ilike('body', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(30);
    return (data ?? []).map(mapPostFeedRow);
  }

  async updateProfile(input: ProfileUpdateInput) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('profiles').update({
      username: input.username,
      display_name: input.displayName,
      avatar_url: input.avatarUrl,
      banner_url: input.bannerUrl,
      bio: input.bio,
      location: input.location,
      website: input.website
    }).eq('id', user.user?.id).select().single();
  }

  async getHomeFeed(): Promise<FeedBundle> {
    const [{ data: posts }, { data: stories }, { data: tags }] = await Promise.all([
      this.client.from('post_feed').select('*').order('created_at', { ascending: false }).limit(50),
      this.client.from('story_feed').select('*').gt('expires_at', new Date().toISOString()).limit(30),
      this.client.from('trending_hashtags').select('tag').limit(8)
    ]);

    return {
      posts: (posts ?? []).map(mapPostFeedRow),
      stories: (stories ?? []).map(mapStoryFeedRow),
      trendingHashtags: (tags ?? []).map((tag: any) => `#${tag.tag}`)
    };
  }


  async getFollowingFeed(): Promise<Post[]> {
    const { data: user } = await this.client.auth.getUser();
    if (!user.user) return [];
    const { data } = await this.client
      .from('following_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    return (data ?? []).map(mapPostFeedRow);
  }

  async getSuggestedProfiles(): Promise<Profile[]> {
    const { data } = await this.client.from('profiles').select('*').order('followers_count', { ascending: false }).limit(5);
    return (data ?? []).map(mapProfile);
  }

  async getProfileFeed(profileId: string): Promise<Post[]> {
    const { data } = await this.client.from('post_feed').select('*').eq('author_id', profileId).order('created_at', { ascending: false });
    return (data ?? []).map(mapPostFeedRow);
  }

  async createPost(input: { body: string; mediaIds?: string[]; quotePostId?: string; mediaType?: 'image' | 'video' | 'mixed' }) {
    const { data: user } = await this.client.auth.getUser();
    const { data, error } = await this.client.from('posts').insert({
      author_id: user.user?.id,
      body: input.body,
      quote_post_id: input.quotePostId,
      post_type: input.quotePostId ? 'quote' : input.mediaIds?.length ? input.mediaType ?? 'image' : 'text',
      moderation_status: 'pending'
    }).select().single();
    if (error || !data || !input.mediaIds?.length) return { data, error };
    await this.client.from('post_media').insert(input.mediaIds.map((mediaId, position) => ({ post_id: data.id, media_id: mediaId, position })));
    return { data, error };
  }

  async updateOwnPost(postId: string, body: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('posts').update({ body, updated_at: new Date().toISOString() }).eq('id', postId).eq('author_id', user.user?.id);
  }

  async uploadMedia(file: File, altText?: string): Promise<{ data: MediaAsset | null; error: { message: string } | null }> {
    const { data: user } = await this.client.auth.getUser();
    if (!user.user) return { data: null, error: { message: 'Log in to upload media.' } };
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    const extension = file.name.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'jpg');
    const storagePath = `${user.user.id}/${crypto.randomUUID()}.${extension}`;
    const uploaded = await this.client.storage.from('media').upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploaded.error) return { data: null, error: uploaded.error };
    const { data: publicUrl } = this.client.storage.from('media').getPublicUrl(storagePath);
    const inserted = await this.client.from('media').insert({ owner_id: user.user.id, storage_path: storagePath, url: publicUrl.publicUrl, media_type: mediaType, alt_text: altText }).select().single();
    if (inserted.error || !inserted.data) return { data: null, error: inserted.error };
    return { data: mapMedia(inserted.data), error: null };
  }

  async deleteOwnPost(postId: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('posts').delete().eq('id', postId).eq('author_id', user.user?.id);
  }

  async likePost(postId: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('likes').upsert({ user_id: user.user?.id, post_id: postId }, { onConflict: 'user_id,post_id' });
  }

  async unlikePost(postId: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('likes').delete().eq('user_id', user.user?.id).eq('post_id', postId);
  }

  async commentOnPost(postId: string, body: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('comments').insert({ post_id: postId, author_id: user.user?.id, body });
  }

  async repost(postId: string, quotePostId?: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('reposts').upsert({ user_id: user.user?.id, post_id: postId, quote_post_id: quotePostId }, { onConflict: 'user_id,post_id' });
  }

  async bookmark(postId: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('bookmarks').upsert({ user_id: user.user?.id, post_id: postId }, { onConflict: 'user_id,post_id' });
  }

  async unbookmark(postId: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('bookmarks').delete().eq('user_id', user.user?.id).eq('post_id', postId);
  }

  async getBookmarks(): Promise<Post[]> {
    const { data } = await this.client.from('bookmark_feed').select('*').order('created_at', { ascending: false }).limit(50);
    return (data ?? []).map(mapPostFeedRow);
  }

  async follow(profileId: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('follows').upsert({ follower_id: user.user?.id, following_id: profileId }, { onConflict: 'follower_id,following_id' });
  }

  async unfollow(profileId: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('follows').delete().eq('follower_id', user.user?.id).eq('following_id', profileId);
  }

  async createStory(input: { mediaId: string; caption?: string }) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('stories').insert({ author_id: user.user?.id, media_id: input.mediaId, caption: input.caption });
  }

  async viewStory(storyId: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('story_views').upsert({ story_id: storyId, viewer_id: user.user?.id }, { onConflict: 'story_id,viewer_id' });
  }


  async getModerationQueue(): Promise<ModerationQueueItem[]> {
    const { data } = await this.client.from('moderation_queue').select('*').order('created_at', { ascending: false }).limit(100);
    return (data ?? []).map(mapModerationQueueItem);
  }

  async reviewModerationItem(id: string, status: 'approved' | 'rejected' | 'escalated') {
    return this.client.from('moderation_queue').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    const { data } = await this.client.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(100);
    return (data ?? []).map(mapSupportTicket);
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const { data, error } = await this.client.rpc('get_admin_dashboard_metrics');
    if (error || !data) return { openReports: 0, activeBans: 0, pendingModeration: 0, activeAds: 0 };
    const row = Array.isArray(data) ? data[0] : data;
    return { openReports: row.open_reports ?? 0, activeBans: row.active_bans ?? 0, pendingModeration: row.pending_moderation ?? 0, activeAds: row.active_ads ?? 0 };
  }

  async getSponsoredPosts(): Promise<SponsoredPost[]> {
    const { data } = await this.client.from('sponsored_posts').select('*').order('created_at', { ascending: false }).limit(100);
    return (data ?? []).map(mapSponsoredPost);
  }

  async getConversations(): Promise<Conversation[]> {
    const { data } = await this.client.from('conversation_list').select('*').order('updated_at', { ascending: false });
    return (data ?? []).map(mapConversationRow);
  }

  async createConversation(participantIds: string[], title?: string) {
    const { data: user } = await this.client.auth.getUser();
    const { data, error } = await this.client.from('conversations').insert({ title, is_group: participantIds.length > 1, created_by: user.user?.id }).select().single();
    if (error || !data) return { data, error };
    await this.client.from('conversation_members').insert([user.user?.id, ...participantIds].filter(Boolean).map((userId) => ({ conversation_id: data.id, user_id: userId })));
    return { data, error };
  }

  async sendMessage(conversationId: string, body: string, mediaIds: string[] = []) {
    const { data: user } = await this.client.auth.getUser();
    const { data, error } = await this.client.from('messages').insert({ conversation_id: conversationId, sender_id: user.user?.id, body }).select().single();
    if (error || !data || mediaIds.length === 0) return { data, error };
    await this.client.from('message_media').insert(mediaIds.map((mediaId) => ({ message_id: data.id, media_id: mediaId })));
    return { data, error };
  }

  async markConversationRead(conversationId: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('conversation_members').update({ last_read_at: new Date().toISOString() }).eq('conversation_id', conversationId).eq('user_id', user.user?.id);
  }

  async setTyping(conversationId: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('conversation_members').update({ typing_at: new Date().toISOString() }).eq('conversation_id', conversationId).eq('user_id', user.user?.id);
  }

  async registerDeviceToken(input: { provider: 'expo' | 'apns' | 'fcm'; token: string; platform?: 'ios' | 'android' | 'web' }) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('device_tokens').upsert({ user_id: user.user?.id, provider: input.provider, token: input.token, platform: input.platform }, { onConflict: 'provider,token' });
  }

  async getNotifications(): Promise<Notification[]> {
    const { data } = await this.client.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
    return (data ?? []).map(mapNotification);
  }

  async report(input: Partial<Omit<Report, 'id' | 'createdAt' | 'status'>> & Pick<Report, 'targetType' | 'targetId' | 'reason'>) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('reports').insert({ reporter_id: input.reporterId ?? user.user?.id, target_type: input.targetType, target_id: input.targetId, reason: input.reason });
  }

  async blockUser(blockedId: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('blocks').insert({ blocker_id: user.user?.id, blocked_id: blockedId });
  }

  async muteUser(mutedId: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('mutes').insert({ muter_id: user.user?.id, muted_id: mutedId });
  }

  createSupportTicket(input: Pick<SupportTicket, 'requesterId' | 'subject' | 'message'>) {
    return this.client.from('support_tickets').insert({ requester_id: input.requesterId, subject: input.subject, message: input.message });
  }

  createAppeal(input: { userId: string; moderationQueueId?: string; banId?: string; reason: string }) {
    return this.client.from('appeals').insert({ user_id: input.userId, moderation_queue_id: input.moderationQueueId, ban_id: input.banId, reason: input.reason });
  }

  adminAction(input: { action: 'warn' | 'remove_content' | 'suspend_user' | 'ban_user'; targetType: string; targetId: string; metadata?: Record<string, unknown> }) {
    return this.client.rpc('perform_admin_action', { action_name: input.action, target_type: input.targetType, target_id: input.targetId, metadata: input.metadata ?? {} });
  }
}

function mapProfile(row: any): Profile {
  return { id: row.id, username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url, bannerUrl: row.banner_url, bio: row.bio, location: row.location, website: row.website, role: row.role ?? 'user', verified: row.verified, followersCount: row.followers_count ?? 0, followingCount: row.following_count ?? 0, postsCount: row.posts_count ?? 0 };
}

function mapMedia(row: any): MediaAsset {
  return { id: row.id, ownerId: row.owner_id, url: row.url, type: row.media_type, altText: row.alt_text, width: row.width, height: row.height, durationSeconds: row.duration_seconds };
}

function mapPostFeedRow(row: any): Post {
  const media = (row.media ?? []).map((item: any) => item.type ? item : { id: item.id, ownerId: item.owner_id, url: item.url, type: item.media_type, altText: item.alt_text });
  const hasImage = media.some((item: MediaAsset) => item.type === 'image');
  const hasVideo = media.some((item: MediaAsset) => item.type === 'video');
  return { id: row.id, author: mapProfile({ id: row.author_id, username: row.username, display_name: row.display_name, avatar_url: row.avatar_url, banner_url: row.banner_url, bio: row.bio, verified: row.verified, followers_count: row.followers_count, following_count: row.following_count, posts_count: row.posts_count }), type: hasImage && hasVideo ? 'mixed' : row.post_type, body: row.body, media, visibility: row.visibility, createdAt: row.created_at, likeCount: row.like_count ?? 0, commentCount: row.comment_count ?? 0, repostCount: row.repost_count ?? 0, bookmarkCount: row.bookmark_count ?? 0, moderationStatus: row.moderation_status };
}

function mapStoryFeedRow(row: any): Story {
  return { id: row.id, author: mapProfile({ id: row.author_id, username: row.username, display_name: row.display_name, avatar_url: row.avatar_url, banner_url: row.banner_url, bio: row.bio, verified: row.verified, followers_count: row.followers_count, following_count: row.following_count, posts_count: row.posts_count }), media: row.media, caption: row.caption, expiresAt: row.expires_at, viewed: Boolean(row.viewed) };
}

function mapConversationRow(row: any): Conversation {
  return { id: row.id, title: row.title, isGroup: row.is_group, participants: row.participants ?? [], unreadCount: row.unread_count ?? 0, lastMessage: row.last_message as Message | undefined };
}

function mapNotification(row: any): Notification {
  return { id: row.id, userId: row.user_id, type: row.type, title: row.title, body: row.body, readAt: row.read_at, createdAt: row.created_at };
}

function mapModerationQueueItem(row: any): ModerationQueueItem {
  return { id: row.id, targetType: row.target_type, targetId: row.target_id, status: row.status, aiScore: row.ai_score, aiReason: row.ai_reason, assignedTo: row.assigned_to, createdAt: row.created_at };
}

function mapSupportTicket(row: any): SupportTicket {
  return { id: row.id, requesterId: row.requester_id, subject: row.subject, message: row.message, status: row.status, assigneeId: row.assignee_id, createdAt: row.created_at };
}

function mapSponsoredPost(row: any): SponsoredPost {
  return { id: row.id, postId: row.post_id, sponsorName: row.sponsor_name, status: row.status, startsAt: row.starts_at, endsAt: row.ends_at, pinned: row.pinned, budgetCents: row.budget_cents ?? 0 };
}

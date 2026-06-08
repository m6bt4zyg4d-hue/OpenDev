import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Conversation, FeedBundle, Message, Notification, Post, Profile, Report, Story, SupportTicket } from '@media/types';

export interface MediaApiConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  options?: Parameters<typeof createClient>[2];
}

export function createMediaClient(config: MediaApiConfig): SupabaseClient {
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
  constructor(private readonly client: SupabaseClient) {}

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
    const { data } = await this.client.from('profiles').select('*').eq('id', user.user.id).maybeSingle();
    return data ? mapProfile(data) : null;
  }

  async getProfile(username: string): Promise<Profile | null> {
    const { data } = await this.client.from('profiles').select('*').eq('username', username).maybeSingle();
    return data ? mapProfile(data) : null;
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

  async getProfileFeed(profileId: string): Promise<Post[]> {
    const { data } = await this.client.from('post_feed').select('*').eq('author_id', profileId).order('created_at', { ascending: false });
    return (data ?? []).map(mapPostFeedRow);
  }

  async createPost(input: { body: string; mediaIds?: string[]; quotePostId?: string }) {
    const { data: user } = await this.client.auth.getUser();
    const { data, error } = await this.client.from('posts').insert({
      author_id: user.user?.id,
      body: input.body,
      quote_post_id: input.quotePostId,
      post_type: input.quotePostId ? 'quote' : input.mediaIds?.length ? 'image' : 'text',
      moderation_status: 'pending'
    }).select().single();
    if (error || !data || !input.mediaIds?.length) return { data, error };
    await this.client.from('post_media').insert(input.mediaIds.map((mediaId, position) => ({ post_id: data.id, media_id: mediaId, position })));
    return { data, error };
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

  async follow(profileId: string) {
    const { data: user } = await this.client.auth.getUser();
    return this.client.from('follows').insert({ follower_id: user.user?.id, following_id: profileId });
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

  report(input: Omit<Report, 'id' | 'createdAt' | 'status'>) {
    return this.client.from('reports').insert({ reporter_id: input.reporterId, target_type: input.targetType, target_id: input.targetId, reason: input.reason });
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
  return { id: row.id, username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url, bannerUrl: row.banner_url, bio: row.bio, verified: row.verified, followersCount: row.followers_count ?? 0, followingCount: row.following_count ?? 0, postsCount: row.posts_count ?? 0 };
}

function mapPostFeedRow(row: any): Post {
  return { id: row.id, author: mapProfile({ id: row.author_id, username: row.username, display_name: row.display_name, avatar_url: row.avatar_url, banner_url: row.banner_url, bio: row.bio, verified: row.verified, followers_count: row.followers_count, following_count: row.following_count, posts_count: row.posts_count }), type: row.post_type, body: row.body, media: row.media ?? [], visibility: row.visibility, createdAt: row.created_at, likeCount: row.like_count ?? 0, commentCount: row.comment_count ?? 0, repostCount: row.repost_count ?? 0, bookmarkCount: row.bookmark_count ?? 0, moderationStatus: row.moderation_status };
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

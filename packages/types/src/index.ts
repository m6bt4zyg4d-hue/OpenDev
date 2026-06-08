export type Role = 'owner' | 'admin' | 'moderator' | 'support' | 'user';
export type Visibility = 'public' | 'followers' | 'private';
export type PostType = 'text' | 'image' | 'video' | 'quote';
export type MediaType = 'image' | 'video' | 'audio';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'escalated';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type NotificationType = 'like' | 'comment' | 'follow' | 'repost' | 'mention' | 'message' | 'system' | 'moderation';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

export interface MediaAsset {
  id: string;
  ownerId: string;
  url: string;
  type: MediaType;
  altText?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

export interface Post {
  id: string;
  author: Profile;
  type: PostType;
  body: string;
  media: MediaAsset[];
  quotedPost?: Post;
  visibility: Visibility;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  bookmarkCount: number;
  moderationStatus: ModerationStatus;
}

export interface Story {
  id: string;
  author: Profile;
  media: MediaAsset;
  caption?: string;
  expiresAt: string;
  viewed: boolean;
}

export interface Conversation {
  id: string;
  title?: string;
  isGroup: boolean;
  participants: Profile[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: Profile;
  body: string;
  media?: MediaAsset[];
  createdAt: string;
  readBy: string[];
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'post' | 'comment' | 'story' | 'message' | 'user' | 'live_stream';
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  requesterId: string;
  subject: string;
  message: string;
  status: TicketStatus;
  assigneeId?: string;
  createdAt: string;
}

export interface ModerationQueueItem {
  id: string;
  targetType: Report['targetType'] | 'live_chat';
  targetId: string;
  status: ModerationStatus;
  aiScore?: number;
  aiReason?: string;
  assignedTo?: string;
  createdAt: string;
}


export interface DeviceToken {
  id: string;
  userId: string;
  provider: 'expo' | 'apns' | 'fcm';
  token: string;
  platform?: 'ios' | 'android' | 'web';
  createdAt: string;
}

export interface AdminAction {
  id: string;
  actorId: string;
  action: 'warn' | 'remove_content' | 'suspend_user' | 'ban_user';
  targetType: string;
  targetId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Appeal {
  id: string;
  userId: string;
  moderationQueueId?: string;
  banId?: string;
  reason: string;
  status: 'open' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface LiveStream {
  id: string;
  host: Profile;
  title: string;
  status: 'scheduled' | 'live' | 'ended';
  playbackUrl?: string;
  viewerCount: number;
}

export interface FeedBundle {
  stories: Story[];
  posts: Post[];
  trendingHashtags: string[];
}

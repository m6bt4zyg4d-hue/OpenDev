import type { Conversation, FeedBundle, LiveStream, ModerationQueueItem, Notification, Profile, SupportTicket } from '@media/types';

export const currentProfile: Profile = {
  id: 'user-1',
  username: 'mediafounder',
  displayName: 'Media Founder',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  bannerUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200',
  bio: 'Building the public square for creators, communities, and live moments.',
  verified: true,
  followersCount: 128400,
  followingCount: 412,
  postsCount: 238
};

const creators: Profile[] = [
  currentProfile,
  { id: 'user-2', username: 'designlab', displayName: 'Design Lab', verified: true, followersCount: 85400, followingCount: 180, postsCount: 932, bio: 'Interface ideas daily.' },
  { id: 'user-3', username: 'streamteam', displayName: 'Stream Team', verified: false, followersCount: 9200, followingCount: 344, postsCount: 188, bio: 'Live now, clip later.' }
];

export const demoFeed: FeedBundle = {
  trendingHashtags: ['#MediaLaunch', '#CreatorTools', '#GoLive', '#OpenSocial', '#DesignSystems'],
  stories: creators.map((author, index) => ({
    id: `story-${index}`,
    author,
    caption: index === 0 ? '24h launch diary' : 'Behind the scenes',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    viewed: index > 1,
    media: { id: `story-media-${index}`, ownerId: author.id, url: author.bannerUrl ?? '', type: 'image' }
  })),
  posts: [
    {
      id: 'post-1',
      author: currentProfile,
      type: 'text',
      body: 'Media MVP is live: feed, stories, DMs, notifications, reports, support, and moderation queue are all connected through a shared API layer.',
      media: [],
      visibility: 'public',
      createdAt: new Date().toISOString(),
      likeCount: 4820,
      commentCount: 284,
      repostCount: 901,
      bookmarkCount: 640,
      moderationStatus: 'approved'
    },
    {
      id: 'post-2',
      author: creators[1],
      type: 'image',
      body: 'The desktop layout keeps navigation, feed, and discovery visible at once.',
      media: [{ id: 'media-2', ownerId: 'user-2', url: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=1200', type: 'image', altText: 'Dashboard mockup' }],
      visibility: 'public',
      createdAt: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
      likeCount: 1290,
      commentCount: 78,
      repostCount: 211,
      bookmarkCount: 302,
      moderationStatus: 'approved'
    }
  ]
};

export const demoConversations: Conversation[] = [
  { id: 'dm-1', isGroup: false, participants: [currentProfile, creators[1]], unreadCount: 2, lastMessage: { id: 'm1', conversationId: 'dm-1', sender: creators[1], body: 'The moderation review cards are ready.', createdAt: new Date().toISOString(), readBy: ['user-2'] } },
  { id: 'dm-2', title: 'Launch Room', isGroup: true, participants: creators, unreadCount: 0, lastMessage: { id: 'm2', conversationId: 'dm-2', sender: creators[2], body: 'Going live in 10 minutes.', createdAt: new Date().toISOString(), readBy: ['user-1', 'user-2', 'user-3'] } }
];

export const demoNotifications: Notification[] = [
  { id: 'n1', userId: 'user-1', type: 'follow', title: 'New follower', body: '@designlab followed you', createdAt: new Date().toISOString() },
  { id: 'n2', userId: 'user-1', type: 'moderation', title: 'Appeal updated', body: 'A moderator approved your appeal.', createdAt: new Date().toISOString(), readAt: new Date().toISOString() }
];

export const demoLiveStreams: LiveStream[] = [
  { id: 'live-1', host: creators[2], title: 'Media launch walkthrough', status: 'live', playbackUrl: 'https://live.placeholder.media/playback.m3u8', viewerCount: 18342 }
];

export const demoModerationQueue: ModerationQueueItem[] = [
  { id: 'mq-1', targetType: 'post', targetId: 'post-7', status: 'escalated', aiScore: 0.91, aiReason: 'Potential harassment detected by placeholder AI.', createdAt: new Date().toISOString() },
  { id: 'mq-2', targetType: 'message', targetId: 'msg-44', status: 'pending', aiScore: 0.67, aiReason: 'Needs human review for scam indicators.', createdAt: new Date().toISOString(), assignedTo: 'mod-1' }
];

export const demoSupportTickets: SupportTicket[] = [
  { id: 'ticket-1', requesterId: 'user-3', subject: 'Can’t upload banner', message: 'Upload stalls after cropping.', status: 'open', createdAt: new Date().toISOString() },
  { id: 'ticket-2', requesterId: 'user-2', subject: 'Verification request', message: 'Submitting creator verification documents.', status: 'pending', assigneeId: 'support-1', createdAt: new Date().toISOString() }
];

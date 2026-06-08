import type { ModerationQueueItem, Notification } from '@media/types';

export interface PushPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const pushNotifications = {
  async registerDevice(userId: string, expoPushToken: string) {
    return { userId, expoPushToken, provider: 'expo', registered: true };
  },
  async send(payload: PushPayload) {
    console.info('Push placeholder: wire Expo/FCM/APNs provider here', payload);
    return { id: crypto.randomUUID(), status: 'queued' as const };
  }
};

export const emailNotifications = {
  async send(notification: Notification & { email: string }) {
    console.info('Email placeholder: wire transactional email provider here', notification);
    return { id: crypto.randomUUID(), status: 'queued' as const };
  }
};

export const aiModeration = {
  async reviewText(targetType: ModerationQueueItem['targetType'], targetId: string, text: string) {
    const riskWords = ['spam', 'abuse', 'scam'];
    const score = riskWords.some((word) => text.toLowerCase().includes(word)) ? 0.86 : 0.08;
    return {
      targetType,
      targetId,
      status: score > 0.8 ? 'escalated' : 'approved',
      aiScore: score,
      aiReason: score > 0.8 ? 'Placeholder model detected risky language.' : 'Placeholder model found low risk.'
    } satisfies Partial<ModerationQueueItem>;
  }
};

export const liveStreaming = {
  async createStream(hostId: string, title: string) {
    return {
      id: crypto.randomUUID(),
      hostId,
      title,
      ingestUrl: 'rtmps://live.placeholder.media/app',
      streamKey: `placeholder-${crypto.randomUUID()}`,
      playbackUrl: 'https://live.placeholder.media/playback.m3u8'
    };
  },
  async endStream(streamId: string) {
    return { streamId, status: 'ended' as const };
  }
};

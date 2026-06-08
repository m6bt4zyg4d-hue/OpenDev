import type { ModerationQueueItem, Notification } from '@media/types';

export interface PushPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

function requireEndpoint(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for this production integration.`);
  return value;
}

export const pushNotifications = {
  async registerDevice(userId: string, expoPushToken: string) {
    return { userId, expoPushToken, provider: 'expo', registered: true };
  },
  async send(payload: PushPayload) {
    const endpoint = requireEndpoint('MEDIA_PUSH_WEBHOOK_URL');
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`Push provider failed with ${response.status}`);
    return response.json();
  }
};

export const emailNotifications = {
  async send(notification: Notification & { email: string }) {
    const endpoint = requireEndpoint('MEDIA_EMAIL_WEBHOOK_URL');
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(notification) });
    if (!response.ok) throw new Error(`Email provider failed with ${response.status}`);
    return response.json();
  }
};

export const aiModeration = {
  async reviewText(targetType: ModerationQueueItem['targetType'], targetId: string, text: string) {
    const endpoint = process.env.MEDIA_AI_MODERATION_URL;
    if (endpoint) {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ targetType, targetId, text }) });
      if (!response.ok) throw new Error(`AI moderation provider failed with ${response.status}`);
      return response.json() as Promise<Partial<ModerationQueueItem>>;
    }
    const riskWords = ['spam', 'abuse', 'scam', 'nsfw', 'hate'];
    const score = riskWords.some((word) => text.toLowerCase().includes(word)) ? 0.86 : 0.08;
    return {
      targetType,
      targetId,
      status: score > 0.8 ? 'escalated' : 'approved',
      aiScore: score,
      aiReason: score > 0.8 ? 'Heuristic moderation detected risky language.' : 'Heuristic moderation found low risk.'
    } satisfies Partial<ModerationQueueItem>;
  }
};

export const liveStreaming = {
  async createStream(hostId: string, title: string) {
    const endpoint = requireEndpoint('MEDIA_LIVE_STREAM_WEBHOOK_URL');
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hostId, title }) });
    if (!response.ok) throw new Error(`Live streaming provider failed with ${response.status}`);
    return response.json();
  },
  async endStream(streamId: string) {
    const endpoint = requireEndpoint('MEDIA_LIVE_STREAM_WEBHOOK_URL');
    const response = await fetch(`${endpoint}/${streamId}/end`, { method: 'POST' });
    if (!response.ok) throw new Error(`Live streaming provider failed with ${response.status}`);
    return response.json();
  }
};

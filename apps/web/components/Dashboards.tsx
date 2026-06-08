'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Conversation, DashboardMetrics, ModerationQueueItem, Notification, SponsoredPost, SupportTicket } from '@media/types';
import { mediaRepository } from '../lib/supabase';

function ActionButton({ children, onClick }: { children: React.ReactNode; onClick?: () => Promise<void> | void }) {
  const [message, setMessage] = useState('');
  return <span><button className="ghost" onClick={async () => { await onClick?.(); setMessage('Saved.'); }}>{children}</button>{message && <span className="muted"> {message}</span>}</span>;
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({ openReports: 0, activeBans: 0, pendingModeration: 0, activeAds: 0 });
  const [ads, setAds] = useState<SponsoredPost[]>([]);
  const [message, setMessage] = useState('Loading admin data…');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');

  async function load() {
    setMetrics(await mediaRepository.getDashboardMetrics());
    setAds(await mediaRepository.getSponsoredPosts());
    setMessage('');
  }
  useEffect(() => { void load(); }, []);

  async function suspend(event: FormEvent) {
    event.preventDefault();
    const { error } = await mediaRepository.adminAction({ action: 'suspend_user', targetType: 'user', targetId, metadata: { reason } });
    setMessage(error ? error.message : 'User suspension recorded.');
    if (!error) void load();
  }

  return <div className="stack" style={{ padding: 20 }}>
    <div className="dashboard-grid"><Metric label="Open reports" value={String(metrics.openReports)} /><Metric label="Active bans" value={String(metrics.activeBans)} /><Metric label="Pending moderation" value={String(metrics.pendingModeration)} /><Metric label="Active ads" value={String(metrics.activeAds)} /></div>
    <section className="panel"><h2>User management</h2><form className="stack" onSubmit={suspend}><input className="search" placeholder="Target user UUID" value={targetId} onChange={(event) => setTargetId(event.target.value)} required /><input className="search" placeholder="Reason" value={reason} onChange={(event) => setReason(event.target.value)} required /><button className="primary" type="submit">Suspend user</button></form>{message && <p className="muted">{message}</p>}</section>
    <section className="panel"><h2>Promoted content</h2>{ads.length === 0 ? <p className="muted">No sponsored posts configured.</p> : ads.map((ad) => <article className="card" key={ad.id}><div className="row space"><strong>{ad.sponsorName}</strong><span className="tab">{ad.status}{ad.pinned ? ' · pinned' : ''}</span></div><p className="muted">Post {ad.postId} · Budget ${(ad.budgetCents / 100).toLocaleString()}</p></article>)}</section>
  </div>;
}

export function ModerationDashboard() {
  const [items, setItems] = useState<ModerationQueueItem[]>([]);
  const [message, setMessage] = useState('Loading moderation queue…');
  async function load() { setItems(await mediaRepository.getModerationQueue()); setMessage(''); }
  useEffect(() => { void load(); }, []);
  if (message) return <section className="panel state-panel"><p className="muted">{message}</p></section>;
  return <div className="stack" style={{ padding: 20 }}>{items.length === 0 ? <p className="muted">No moderation items waiting.</p> : items.map((item) => <article className="card" key={item.id} style={{ border: '1px solid var(--border)', borderRadius: 20 }}><div className="row space"><strong>{item.targetType} · {item.targetId}</strong><span className="tab">{item.status}</span></div><p>{item.aiReason ?? 'No automated reason recorded.'}</p><p className="muted">AI score: {item.aiScore ?? 'n/a'}</p><div className="tabs"><ActionButton onClick={async () => { await mediaRepository.reviewModerationItem(item.id, 'approved'); await load(); }}>Approve</ActionButton><ActionButton onClick={async () => { await mediaRepository.reviewModerationItem(item.id, 'rejected'); await load(); }}>Remove</ActionButton><ActionButton onClick={async () => { await mediaRepository.reviewModerationItem(item.id, 'escalated'); await load(); }}>Escalate</ActionButton></div></article>)}</div>;
}

export function SupportDashboard() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  useEffect(() => { void mediaRepository.getSupportTickets().then(setTickets); }, []);
  return <div className="stack" style={{ padding: 20 }}>{tickets.length === 0 ? <p className="muted">No support tickets.</p> : tickets.map((ticket) => <article className="card" key={ticket.id} style={{ border: '1px solid var(--border)', borderRadius: 20 }}><div className="row space"><strong>{ticket.subject}</strong><span className="tab">{ticket.status}</span></div><p>{ticket.message}</p><ActionButton>Assign / reply</ActionButton></article>)}</div>;
}

export function MessagesPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  useEffect(() => { void mediaRepository.getConversations().then(setConversations); }, []);
  return <div className="stack" style={{ padding: 20 }}>{conversations.length === 0 ? <p className="muted">No direct messages yet.</p> : conversations.map((dm) => <article className="card" key={dm.id}><div className="row space"><strong>{dm.title ?? dm.participants[0]?.displayName ?? 'Conversation'}</strong><span className="tab">{dm.isGroup ? 'Group' : '1:1'} · {dm.unreadCount} unread</span></div><p>{dm.lastMessage?.body}</p><p className="muted">Read receipts · typing indicators · media attachments</p></article>)}</div>;
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  useEffect(() => { void mediaRepository.getNotifications().then(setNotifications); }, []);
  return <div className="stack" style={{ padding: 20 }}>{notifications.length === 0 ? <p className="muted">No notifications yet.</p> : notifications.map((n) => <article className="card" key={n.id}><strong>{n.title}</strong><p>{n.body}</p><p className="muted">{n.type} · {n.readAt ? 'Read' : 'Unread'}</p></article>)}</div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span className="muted">{label}</span><strong>{value}</strong></div>; }

import { demoConversations, demoLiveStreams, demoModerationQueue, demoNotifications, demoSupportTickets } from '@media/api';

export function AdminDashboard() {
  return <><div className="dashboard-grid"><Metric label="Open reports" value="128" /><Metric label="Active bans" value="43" /><Metric label="Live streams" value={String(demoLiveStreams.length)} /></div><section className="panel"><h2>Role management</h2><div className="tabs"><span className="tab">owner</span><span className="tab">admin</span><span className="tab">moderator</span><span className="tab">support</span></div><p className="muted">Admins can assign roles, audit actions, review bans, and respond to appeals.</p></section></>;
}
export function ModerationDashboard() {
  return <div className="stack" style={{ padding: 20 }}>{demoModerationQueue.map((item) => <article className="card" key={item.id} style={{ border: '1px solid var(--border)', borderRadius: 20 }}><div className="row space"><strong>{item.targetType} · {item.targetId}</strong><span className="tab">{item.status}</span></div><p>{item.aiReason}</p><p className="muted">AI score: {item.aiScore}</p><div className="tabs"><button className="ghost">Approve</button><button className="ghost">Remove</button><button className="ghost">Escalate</button><button className="ghost">Open appeal</button></div></article>)}</div>;
}
export function SupportDashboard() {
  return <div className="stack" style={{ padding: 20 }}>{demoSupportTickets.map((ticket) => <article className="card" key={ticket.id} style={{ border: '1px solid var(--border)', borderRadius: 20 }}><div className="row space"><strong>{ticket.subject}</strong><span className="tab">{ticket.status}</span></div><p>{ticket.message}</p><button className="ghost">Assign / reply</button></article>)}</div>;
}
export function MessagesPanel() { return <div className="stack" style={{ padding: 20 }}>{demoConversations.map((dm) => <article className="card" key={dm.id}><div className="row space"><strong>{dm.title ?? dm.participants.find((p) => p.id !== 'user-1')?.displayName}</strong><span className="tab">{dm.isGroup ? 'Group' : '1:1'}</span></div><p>{dm.lastMessage?.body}</p><p className="muted">Read receipts · typing indicators · media attachments</p></article>)}</div>; }
export function NotificationsPanel() { return <div className="stack" style={{ padding: 20 }}>{demoNotifications.map((n) => <article className="card" key={n.id}><strong>{n.title}</strong><p>{n.body}</p><p className="muted">{n.type} · {n.readAt ? 'Read' : 'Unread'}</p></article>)}</div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span className="muted">{label}</span><strong>{value}</strong></div>; }

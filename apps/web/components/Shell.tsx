import Link from 'next/link';
import { demoFeed, currentProfile } from '@media/api';
import { AccountMenu } from './AccountMenu';

export function Shell({ children, title = 'Home' }: { children: React.ReactNode; title?: string }) {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="logo"><span className="logo-mark">M</span><span className="logo-text">Media</span></div>
        <nav className="nav" aria-label="Main navigation">
          {['Home', 'Explore', 'Notifications', 'Messages', 'Bookmarks', 'Profile', 'Auth'].map((item) => <Link key={item} href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}><span>{iconFor(item)}</span> <span className="nav-label">{item}</span></Link>)}
          <Link href="/admin"><span>🛡️</span> <span className="nav-label">Admin</span></Link>
          <Link href="/moderation"><span>⚖️</span> <span className="nav-label">Moderation</span></Link>
          <Link href="/support"><span>🎧</span> <span className="nav-label">Support</span></Link>
        </nav>
        <button className="primary" style={{ width: '100%', marginTop: 20 }}>Post</button><AccountMenu />
      </aside>
      <section className="feed" aria-label={title}>{children}</section>
      <aside className="rightbar">
        <div className="stack">
          <input className="search" placeholder="Search Media" />
          <section className="panel" style={{ borderRadius: 24, border: '1px solid var(--border)' }}>
            <h2>Trending</h2>
            {demoFeed.trendingHashtags.map((tag, index) => <p key={tag}><span className="muted">#{index + 1}</span><br /><strong>{tag}</strong></p>)}
          </section>
          <section className="panel" style={{ borderRadius: 24, border: '1px solid var(--border)' }}>
            <h2>Who to follow</h2>
            <div className="row space"><div className="row"><img className="avatar" src={currentProfile.avatarUrl} alt="" /><div><strong>{currentProfile.displayName}</strong><div className="muted">@{currentProfile.username}</div></div></div><button className="ghost">Follow</button></div>
          </section>
        </div>
      </aside>
    </main>
  );
}
function iconFor(item: string) { return ({ Home: '🏠', Explore: '🔎', Notifications: '🔔', Messages: '✉️', Bookmarks: '🔖', Profile: '👤', Auth: '🔐' } as Record<string, string>)[item]; }

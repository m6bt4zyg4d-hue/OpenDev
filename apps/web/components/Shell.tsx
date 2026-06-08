'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, Bookmark, CircleEllipsis, Compass, Feather, Home, Mail, Search, Settings, ShieldCheck, User, Users, Wrench, Zap } from 'lucide-react';
import type { Profile } from '@media/types';
import { mediaRepository } from '../lib/supabase';
import { AccountMenu } from './AccountMenu';
import { useAuth } from './AuthProvider';

const primaryNav = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Explore', href: '/explore', icon: Search },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Messages', href: '/messages', icon: Mail },
  { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings }
];

const staffNav = [
  { label: 'Admin', href: '/admin', icon: ShieldCheck, roles: ['owner', 'admin'] },
  { label: 'Moderation', href: '/moderation', icon: Wrench, roles: ['owner', 'admin', 'moderator'] }
] as const;

export function Shell({ children, title = 'Timeline' }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [trends, setTrends] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const role = profile?.role ?? 'user';

  useEffect(() => {
    void mediaRepository.getHomeFeed().then((feed) => setTrends(feed.trendingHashtags)).catch(() => setTrends([]));
    void mediaRepository.getSuggestedProfiles().then(setSuggestions).catch(() => setSuggestions([]));
  }, []);
  const visibleStaffNav = staffNav.filter((item) => item.roles.includes(role as never));

  return (
    <main className="x-app-shell">
      <aside className="x-left-rail" aria-label="Primary">
        <div className="x-left-inner">
          <Link className="x-logo" href="/" aria-label="Media home"><Zap size={30} /></Link>
          <nav className="x-nav" aria-label="Main navigation">
            {primaryNav.map(({ label, href, icon: Icon }) => (
              <Link key={href} className={pathname === href ? 'is-active' : ''} href={href}>
                <Icon size={25} strokeWidth={pathname === href ? 2.6 : 2} />
                <span>{label}</span>
              </Link>
            ))}
            {visibleStaffNav.map(({ label, href, icon: Icon }) => (
              <Link key={href} className={pathname === href ? 'is-active staff' : 'staff'} href={href}>
                <Icon size={25} /><span>{label}</span>
              </Link>
            ))}
            <Link href="/support"><CircleEllipsis size={25} /><span>More</span></Link>
          </nav>
          <a className="x-post-button" href="/#compose"><Feather size={22} /><span>Post</span></a>
          <AccountMenu />
        </div>
      </aside>

      <section className="x-main-column" aria-label={title}>{children}</section>

      <aside className="x-right-rail" aria-label="Discovery">
        <div className="x-right-inner">
          <label className="x-search"><Search size={19} /><input placeholder="Search" /></label>
          <section className="x-card x-premium-card">
            <h2>Subscribe to Premium</h2>
            <p>Unlock creator tools, longer uploads, prioritized discovery, and deeper analytics.</p>
            <Link className="x-small-button" href="/settings">Subscribe</Link>
          </section>
          <section className="x-card">
            <h2>What’s happening</h2>
            {trends.slice(0, 5).map((tag) => (
              <Link className="x-trend" key={tag} href={`/explore?q=${encodeURIComponent(tag)}`}>
                <span>Trending in Media</span>
                <strong>{tag}</strong>
              </Link>
            ))}
            {trends.length === 0 && <p className="muted">Trends appear as people post hashtags.</p>}
          </section>
          <section className="x-card">
            <h2>Who to follow</h2>
            {suggestions.slice(0, 3).map((person) => (
              <div className="x-follow-row" key={person.id}>
                {person.avatarUrl ? <img className="x-avatar" src={person.avatarUrl} alt="" /> : <span className="x-avatar" />}
                <div>
                  <strong>{person.displayName}</strong>
                  <span>@{person.username}</span>
                </div>
                <Link className="x-follow-button" href={`/u/${person.username}`}>Follow</Link>
              </div>
            ))}
          {suggestions.length === 0 && <p className="muted">Follow suggestions appear after users join.</p>}
          </section>
          <footer className="x-rail-footer">
            <Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/support">Support</Link>
          </footer>
        </div>
      </aside>

      <nav className="x-mobile-nav" aria-label="Mobile navigation">
        {primaryNav.slice(0, 5).map(({ label, href, icon: Icon }) => (
          <Link key={href} className={pathname === href ? 'is-active' : ''} href={href} aria-label={label}><Icon size={24} /></Link>
        ))}
      </nav>
      <a className="x-mobile-compose" href="/#compose" aria-label="Compose post"><Feather size={25} /></a>
    </main>
  );
}

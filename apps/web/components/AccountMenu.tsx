'use client';

import { useAuth } from './AuthProvider';

export function AccountMenu() {
  const { profile, session, signOut } = useAuth();
  if (!session) return <a className="primary" href="/auth" style={{ display: 'block', textAlign: 'center', marginTop: 20 }}>Log in</a>;
  return <div className="panel" style={{ borderRadius: 20, marginTop: 20 }}><strong>{profile?.displayName ?? session.user.email}</strong><p className="muted">@{profile?.username ?? 'profile'}</p><button className="ghost" onClick={() => void signOut()}>Log out</button></div>;
}

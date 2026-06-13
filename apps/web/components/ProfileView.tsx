'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Flag, Link as LinkIcon, MapPin, MoreHorizontal, VolumeX } from 'lucide-react';
import type { Profile } from '@opendev/types';
import { mediaRepository } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { PostList } from './Feed';

export function MyProfileView() {
  const { profile } = useAuth();
  if (!profile) return <section className="panel state-panel"><p className="muted">Loading profile…</p></section>;
  return <ProfileHeader profile={profile} ownProfile />;
}

export function PublicProfileView({ username }: { username: string }) {
  const { profile: me } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState('Loading profile…');
  useEffect(() => { void mediaRepository.getProfile(username).then((data) => { setProfile(data); setMessage(data ? '' : 'Profile not found.'); }); }, [username]);
  if (!profile) return <section className="panel state-panel"><p className="muted">{message}</p></section>;
  const isMe = me?.id === profile.id;
  async function follow() {
    if (!profile) return;
    const { error } = await mediaRepository.follow(profile.id);
    setMessage(error ? error.message : 'Following.');
  }
  return <ProfileHeader profile={profile} ownProfile={isMe} onFollow={follow} message={message} />;
}

function ProfileHeader({ profile, ownProfile, onFollow, message }: { profile: Profile; ownProfile?: boolean; onFollow?: () => void; message?: string }) {
  return (
    <>
      <header className="x-sticky-header"><h1>{profile.displayName}</h1><p>{profile.postsCount.toLocaleString()} posts</p></header>
      <section className="x-profile">
        <div className="x-profile-banner" style={profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : undefined} />
        <div className="x-profile-body">
          <div className="x-profile-topline">
            {profile.avatarUrl ? <img className="x-profile-avatar" src={profile.avatarUrl} alt="" /> : <span className="x-profile-avatar" />}
            {ownProfile ? <a className="x-outline-button" href="/settings">Edit profile</a> : <div className="x-profile-actions"><button className="x-round-button"><MoreHorizontal size={20} /></button><button className="x-round-button" onClick={() => void mediaRepository.muteUser(profile.id)}><VolumeX size={20} /></button><button className="x-round-button" onClick={() => void mediaRepository.report({ reporterId: '', targetType: 'user', targetId: profile.id, reason: 'profile_report' })}><Flag size={20} /></button><button className="x-follow-cta" onClick={onFollow}>Follow</button></div>}
          </div>
          <h2>{profile.displayName} {profile.verified && <span className="x-verified">✓</span>}</h2>
          <p className="x-handle">@{profile.username}</p>
          <p className="x-bio">{profile.bio}</p>
          <div className="x-profile-meta">{profile.location && <span><MapPin size={16} /> {profile.location}</span>}{profile.website && <span><LinkIcon size={16} /> {profile.website}</span>}<span><CalendarDays size={16} /> Joined OpenDev</span></div>
          <div className="x-profile-stats"><a><strong>{profile.followingCount.toLocaleString()}</strong> Following</a><a><strong>{profile.followersCount.toLocaleString()}</strong> Followers</a></div>
          {message && <p className="muted">{message}</p>}
        </div>
        <nav className="x-profile-tabs"><a className="is-selected" href="#posts">Posts</a><a href="#replies">Replies</a><a href="#highlights">Highlights</a><a href="#media">Media</a><a href="#likes">Likes</a></nav>
      </section>
      <PostList mode="profile" profileId={profile.id} />
    </>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { mediaRepository } from '../lib/supabase';
import { useAuth } from './AuthProvider';

export function EditProfileForm() {
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '');
    setUsername(profile?.username ?? '');
    setBio(profile?.bio ?? '');
    setAvatarUrl(profile?.avatarUrl ?? '');
    setBannerUrl(profile?.bannerUrl ?? '');
  }, [profile]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const { error } = await mediaRepository.updateProfile({ displayName, username, bio, avatarUrl, bannerUrl });
    if (error) setMessage(error.message);
    else {
      await refreshProfile();
      setMessage('Profile updated.');
    }
  }

  return <section className="panel"><form className="stack" onSubmit={submit}><input className="search" placeholder="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /><input className="search" placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} /><input className="search" placeholder="Avatar URL" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} /><input className="search" placeholder="Banner URL" value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value)} /><textarea className="search" placeholder="Bio" value={bio} onChange={(event) => setBio(event.target.value)} /><button className="primary" type="submit">Save profile</button>{message && <p className="muted">{message}</p>}</form></section>;
}

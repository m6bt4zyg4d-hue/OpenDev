'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@opendev/types';
import { mediaRepository, supabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp(input: { email: string; password: string; username: string; displayName: string }): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    const nextProfile = await mediaRepository.getMyProfile();
    setProfile(nextProfile);
  }

  useEffect(() => {
    mediaRepository.getSession().then(async ({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      if (data.session) await refreshProfile();
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event: string, nextSession: Session | null) => {
      setSession(nextSession);
      if (nextSession) await refreshProfile();
      else setProfile(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    profile,
    loading,
    async signUp(input) {
      const { error } = await mediaRepository.signUp(input);
      if (error) throw error;
    },
    async signIn(email, password) {
      const { error } = await mediaRepository.signIn(email, password);
      if (error) throw error;
      await refreshProfile();
    },
    async resetPassword(email) {
      const { error } = await mediaRepository.resetPassword(email, `${window.location.origin}/auth`);
      if (error) throw error;
    },
    async signOut() {
      await mediaRepository.signOut();
      setSession(null);
      setProfile(null);
    },
    refreshProfile
  }), [session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

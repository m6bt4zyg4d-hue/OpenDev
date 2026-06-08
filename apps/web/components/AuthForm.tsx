'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('Working…');
    try {
      if (mode === 'signup') {
        await signUp({ email, password, username, displayName });
        setMessage('Account created. Check your email if confirmations are enabled, then log in.');
      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage('Password reset email sent.');
      } else {
        await signIn(email, password);
        router.replace(next);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    }
  }

  return (
    <section className="panel">
      <form className="stack" onSubmit={submit}>
        <div className="tabs">
          <button className="ghost" type="button" onClick={() => setMode('login')}>Log in</button>
          <button className="ghost" type="button" onClick={() => setMode('signup')}>Sign up</button>
          <button className="ghost" type="button" onClick={() => setMode('reset')}>Reset password</button>
        </div>
        <input className="search" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        {mode !== 'reset' && <input className="search" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />}
        {mode === 'signup' && <><input className="search" placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} required /><input className="search" placeholder="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></>}
        <button className="primary" type="submit">{mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset email' : 'Log in'}</button>
        {message && <p className="muted">{message}</p>}
      </form>
    </section>
  );
}

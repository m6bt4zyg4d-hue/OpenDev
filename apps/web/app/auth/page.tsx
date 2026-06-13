import { Suspense } from 'react';
import { AuthForm } from '../../components/AuthForm';
import { Shell } from '../../components/Shell';

export default function AuthPage() {
  return (
    <Shell title="Sign in">
      <header className="x-sticky-header"><h1>Sign in to OpenDev</h1><p>Join the conversation.</p></header>
      <div className="x-auth-frame"><Suspense fallback={<section className="x-card"><p>Loading authentication…</p></section>}><AuthForm /></Suspense></div>
    </Shell>
  );
}

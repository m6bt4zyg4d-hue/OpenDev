'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { Role } from '@opendev/types';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session) router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
  }, [loading, session, pathname, router]);

  if (loading) return <section className="panel state-panel"><p className="muted">Checking secure session…</p></section>;
  if (!session) return <section className="panel state-panel"><p className="muted">Redirecting to login…</p></section>;
  if (roles?.length && !roles.includes(profile?.role ?? 'user')) {
    return <section className="panel state-panel"><ShieldAlert size={32} /><h2>Restricted area</h2><p className="muted">This route is only available to authorized staff.</p></section>;
  }
  return <>{children}</>;
}

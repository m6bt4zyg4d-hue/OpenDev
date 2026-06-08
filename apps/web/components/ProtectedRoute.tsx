'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session) router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
  }, [loading, session, pathname, router]);

  if (loading) return <section className="panel"><p className="muted">Checking session…</p></section>;
  if (!session) return <section className="panel"><p className="muted">Redirecting to login…</p></section>;
  return <>{children}</>;
}

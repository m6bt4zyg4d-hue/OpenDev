import { AuthForm } from '../../components/AuthForm';
import { Shell } from '../../components/Shell';

export default function AuthPage() {
  return <Shell title="Auth"><header className="topbar"><h1>Signup / login</h1><p className="muted">Supabase email/password auth with password reset, persisted sessions, and automatic profile creation.</p></header><AuthForm /></Shell>;
}

import { ModerationDashboard } from '../../components/Dashboards';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Shell } from '../../components/Shell';
export default function ModerationPage() { return <Shell title="Moderation"><header className="topbar"><h1>Moderation queue</h1><p className="muted">AI auto-moderation handoff for posts, comments, stories, DMs, live chat, and appeals.</p></header><ProtectedRoute><ModerationDashboard /></ProtectedRoute></Shell>; }

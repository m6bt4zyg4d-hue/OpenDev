import { NotificationsPanel } from '../../components/Dashboards';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Shell } from '../../components/Shell';
export default function NotificationsPage() { return <Shell title="Notifications"><header className="topbar"><h1>Notifications</h1><p className="muted">Push, email, and in-app notification center.</p></header><ProtectedRoute><NotificationsPanel /></ProtectedRoute></Shell>; }

import { AdminDashboard } from '../../components/Dashboards';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Shell } from '../../components/Shell';
export default function AdminPage() { return <Shell title="Admin"><header className="topbar"><h1>Admin dashboard</h1><p className="muted">Owner/admin controls, audit trails, bans, appeals, and platform health.</p></header><ProtectedRoute><AdminDashboard /></ProtectedRoute></Shell>; }

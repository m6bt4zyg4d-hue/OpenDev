import { SupportDashboard } from '../../components/Dashboards';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Shell } from '../../components/Shell';
export default function SupportPage() { return <Shell title="Support"><header className="topbar"><h1>Support tickets</h1><p className="muted">In-app ticket queue for creator and user support.</p></header><ProtectedRoute><SupportDashboard /></ProtectedRoute></Shell>; }

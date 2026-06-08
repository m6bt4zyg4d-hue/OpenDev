import { MessagesPanel } from '../../components/Dashboards';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Shell } from '../../components/Shell';
export default function MessagesPage() { return <Shell title="Messages"><header className="topbar"><h1>Direct messages</h1><p className="muted">1-on-1 and group chats with read receipts and typing indicators.</p></header><ProtectedRoute><MessagesPanel /></ProtectedRoute></Shell>; }

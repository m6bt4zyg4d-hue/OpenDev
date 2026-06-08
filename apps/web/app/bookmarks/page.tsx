import { PostList } from '../../components/Feed';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Shell } from '../../components/Shell';
export default function BookmarksPage() { return <Shell title="Bookmarks"><header className="topbar"><h1>Bookmarks</h1><p className="muted">Saved posts and private collections.</p></header><ProtectedRoute><PostList /></ProtectedRoute></Shell>; }

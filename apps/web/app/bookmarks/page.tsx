import { PostList } from '../../components/Feed';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Shell } from '../../components/Shell';
export default function BookmarksPage() { return <Shell title="Bookmarks"><header className="x-sticky-header"><h1>Bookmarks</h1><p>@saved</p></header><ProtectedRoute><PostList mode="bookmarks" /></ProtectedRoute></Shell>; }

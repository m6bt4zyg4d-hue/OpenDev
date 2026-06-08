import { PostList } from '../../components/Feed';
import { Shell } from '../../components/Shell';
export default function ExplorePage() { return <Shell title="Explore"><header className="topbar"><h1>Explore</h1><input className="search" placeholder="Search people, posts, and hashtags" /></header><PostList /></Shell>; }

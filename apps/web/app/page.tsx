import { Composer, PostList, StoryRail } from '../components/Feed';
import { Shell } from '../components/Shell';

export default function HomePage() {
  return <Shell title="Home"><header className="topbar"><h1>Home</h1><p className="muted">For you · Following · Live</p></header><StoryRail /><Composer /><PostList /></Shell>;
}

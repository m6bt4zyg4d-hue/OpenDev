import { Composer, PostList, TimelineTabs } from '../components/Feed';
import { Shell } from '../components/Shell';

export default function HomePage({ searchParams }: { searchParams?: { feed?: string } }) {
  const mode = searchParams?.feed === 'following' ? 'following' : 'home';
  return (
    <Shell title="Home timeline">
      <header className="x-sticky-header"><h1>Home</h1></header>
      <TimelineTabs selected={mode} />
      <Composer />
      <PostList mode={mode} />
    </Shell>
  );
}

import { ExploreClient } from '../../components/ExploreClient';
import { Shell } from '../../components/Shell';

export default function ExplorePage({ searchParams }: { searchParams?: { q?: string } }) {
  return <Shell title="Explore"><ExploreClient query={searchParams?.q ?? ''} /></Shell>;
}

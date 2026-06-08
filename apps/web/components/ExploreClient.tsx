'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { FeedBundle, Profile } from '@media/types';
import { mediaRepository } from '../lib/supabase';
import { PostList } from './Feed';

export function ExploreClient({ query }: { query: string }) {
  const [trends, setTrends] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  useEffect(() => { void mediaRepository.getHomeFeed().then((feed: FeedBundle) => setTrends(feed.trendingHashtags)); }, []);
  useEffect(() => { if (query) void mediaRepository.searchProfiles(query.replace(/^#/, '')).then(setProfiles); }, [query]);
  return (
    <>
      <header className="x-sticky-header x-search-header"><form className="x-search in-main" action="/explore"><Search size={19} /><input name="q" placeholder="Search" defaultValue={query} /></form></header>
      <section className="x-section-block">
        <h2>{query ? `Search results for ${query}` : 'Trends for you'}</h2>
        {!query && trends.map((tag) => <a className="x-trend-row" href={`/explore?q=${encodeURIComponent(tag)}`} key={tag}><span>Trending · Social</span><strong>{tag}</strong></a>)}
        {query && profiles.map((profile) => <a className="x-trend-row" href={`/u/${profile.username}`} key={profile.id}><span>User</span><strong>{profile.displayName} {profile.verified ? '✓' : ''}</strong><small>@{profile.username}</small></a>)}
      </section>
      <PostList mode={query ? 'search' : 'home'} query={query.replace(/^#/, '')} />
    </>
  );
}

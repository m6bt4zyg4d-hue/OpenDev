'use client';

import { useCallback, useEffect, useState } from 'react';
import { Image as ImageIcon, MoreHorizontal } from 'lucide-react';
import type { FeedBundle, MediaAsset, Post } from '@media/types';
import { mediaRepository } from '../lib/supabase';
import { CreatePostForm, PostActions } from './SocialActions';

export function TimelineTabs({ selected = 'home' }: { selected?: 'home' | 'following' }) {
  return (
    <div className="x-timeline-tabs" role="tablist" aria-label="Timeline filters">
      <a className={selected === 'home' ? 'is-selected' : ''} href="/">For you</a>
      <a className={selected === 'following' ? 'is-selected' : ''} href="/?feed=following">Following</a>
    </div>
  );
}

export function StoryRail({ stories = [] }: { stories?: FeedBundle['stories'] }) {
  if (stories.length === 0) return null;
  return (
    <section className="x-story-rail" aria-label="Stories">
      {stories.map((story) => (
        <a className="x-story" href={`/u/${story.author.username}`} key={story.id}>
          {story.author.avatarUrl ? <img className="x-avatar" src={story.author.avatarUrl} alt="" /> : <span className="x-avatar" />}
          <span>{story.author.displayName}</span>
        </a>
      ))}
    </section>
  );
}

export function Composer({ onPosted }: { onPosted?: () => void }) {
  return <CreatePostForm onPosted={onPosted} />;
}

function MediaTile({ media }: { media: MediaAsset }) {
  if (media.type === 'video') return <video className="x-post-media" src={media.url} controls playsInline preload="metadata" />;
  return <a href={media.url} target="_blank" rel="noreferrer"><img className="x-post-media" src={media.url} alt={media.altText ?? ''} /></a>;
}

function PostCard({ post, onChanged }: { post: Post; onChanged?: () => void }) {
  return (
    <article className="x-post" id={`post-${post.id}`}>
      <a href={`/u/${post.author.username}`} className="x-post-avatar-link" aria-label={`${post.author.displayName} profile`}>
        {post.author.avatarUrl ? <img className="x-avatar" src={post.author.avatarUrl} alt="" /> : <span className="x-avatar" />}
      </a>
      <div className="x-post-content">
        <header className="x-post-header">
          <div className="x-post-byline">
            <a href={`/u/${post.author.username}`}><strong>{post.author.displayName}</strong></a>
            {post.author.verified && <span className="x-verified">✓</span>}
            <span>@{post.author.username}</span>
            <span>·</span>
            <time>{new Date(post.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time>
          </div>
          <button className="x-icon-button" aria-label="More post actions"><MoreHorizontal size={19} /></button>
        </header>
        {post.body && <p className="x-post-text">{post.body}</p>}
        {post.media.length > 0 && (
          <div className={post.media.length > 1 ? 'x-media-grid' : 'x-media-single'}>
            {post.media.map((media) => <MediaTile key={media.id} media={media} />)}
          </div>
        )}
        {post.media.length === 0 && post.type !== 'text' && <div className="x-empty-media"><ImageIcon size={20} /> Media unavailable</div>}
        <PostActions post={post} onChanged={onChanged} />
      </div>
    </article>
  );
}

export function PostList({ mode = 'home', profileId, query }: { mode?: 'home' | 'following' | 'bookmarks' | 'profile' | 'search'; profileId?: string; query?: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<FeedBundle['stories']>([]);
  const [status, setStatus] = useState('Loading posts…');

  const load = useCallback(async () => {
    setStatus('Loading posts…');
    try {
      if (mode === 'bookmarks') setPosts(await mediaRepository.getBookmarks());
      else if (mode === 'following') setPosts(await mediaRepository.getFollowingFeed());
      else if (mode === 'profile' && profileId) setPosts(await mediaRepository.getProfileFeed(profileId));
      else if (mode === 'search' && query) setPosts(await mediaRepository.searchPosts(query));
      else {
        const feed = await mediaRepository.getHomeFeed();
        setPosts(feed.posts);
        setStories(feed.stories);
      }
      setStatus('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load posts.');
    }
  }, [mode, profileId, query]);

  useEffect(() => { void load(); }, [load]);

  if (status) return <section className="panel state-panel"><p className="muted">{status}</p></section>;
  if (posts.length === 0) return <section className="panel state-panel"><p className="muted">No posts to show yet.</p></section>;
  return <><StoryRail stories={stories} />{posts.map((post) => <PostCard key={post.id} post={post} onChanged={load} />)}</>;
}

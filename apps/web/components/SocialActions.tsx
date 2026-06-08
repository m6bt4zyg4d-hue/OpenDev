'use client';

import { FormEvent, useState } from 'react';
import type { Post } from '@media/types';
import { mediaRepository } from '../lib/supabase';
import { useAuth } from './AuthProvider';

export function CreatePostForm() {
  const { session } = useAuth();
  const [body, setBody] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!session) return setMessage('Log in to publish.');
    const { error } = await mediaRepository.createPost({ body });
    setMessage(error ? error.message : 'Post submitted for AI/human moderation.');
    if (!error) setBody('');
  }

  return <form className="composer" onSubmit={submit}><div className="row"><div className="avatar" /><textarea placeholder="What’s happening on Media?" value={body} onChange={(event) => setBody(event.target.value)} /></div><div className="row space"><div className="tabs"><span className="tab">📷 Image/video placeholder</span><span className="tab">🎥 Go Live</span><span className="tab">✨ AI check</span></div><button className="primary" type="submit">Publish</button></div>{message && <p className="muted">{message}</p>}</form>;
}

export function PostActions({ post }: { post: Post }) {
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  async function run(action: () => Promise<{ error: { message: string } | null }>) {
    const { error } = await action();
    setMessage(error ? error.message : 'Action saved.');
  }

  return <div><div className="actions"><button className="ghost" onClick={() => setComment(comment ? '' : ' ')}>💬 {post.commentCount}</button><button className="ghost" onClick={() => void run(() => mediaRepository.repost(post.id))}>🔁 {post.repostCount}</button><button className="ghost" onClick={() => void run(() => mediaRepository.likePost(post.id))}>♥ {post.likeCount}</button><button className="ghost" onClick={() => void run(() => mediaRepository.bookmark(post.id))}>🔖 {post.bookmarkCount}</button><button className="ghost">↗ Share</button></div>{comment && <form className="row" onSubmit={(event) => { event.preventDefault(); void run(() => mediaRepository.commentOnPost(post.id, comment)); setComment(''); }}><input className="search" placeholder="Write a comment" value={comment.trimStart()} onChange={(event) => setComment(event.target.value)} /><button className="primary" type="submit">Reply</button></form>}{message && <p className="muted">{message}</p>}</div>;
}

export function SafetyMenu({ targetType, targetId, reporterId }: { targetType: 'post' | 'comment' | 'story' | 'message' | 'user'; targetId: string; reporterId?: string }) {
  const [message, setMessage] = useState('');
  async function report() {
    if (!reporterId) return setMessage('Log in to report content.');
    const { error } = await mediaRepository.report({ reporterId, targetType, targetId, reason: 'User report from web UI' });
    setMessage(error ? error.message : 'Report sent to moderation.');
  }
  return <span><button className="ghost" onClick={() => void report()}>Report</button>{message && <span className="muted"> {message}</span>}</span>;
}

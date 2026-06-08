'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { BarChart3, Bookmark, Heart, Image as ImageIcon, MessageCircle, Repeat2, Send, Share, Smile, Trash2, X } from 'lucide-react';
import type { MediaAsset, Post } from '@media/types';
import { mediaRepository } from '../lib/supabase';
import { useAuth } from './AuthProvider';

export function CreatePostForm({ onPosted }: { onPosted?: () => void }) {
  const { session, profile } = useAuth();
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file), type: file.type.startsWith('video/') ? 'video' : 'image' })), [files]);
  const remaining = 280 - body.length;

  function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []).slice(0, 4));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!session) return setMessage('Log in to post.');
    if (!body.trim() && files.length === 0) return setMessage('Write something or attach media.');
    if (remaining < 0) return setMessage('Posts are limited to 280 characters for this composer.');

    setMessage('Posting…');
    const uploaded: MediaAsset[] = [];
    for (const file of files) {
      const { data, error } = await mediaRepository.uploadMedia(file);
      if (error) return setMessage(error.message);
      if (data) uploaded.push(data);
    }
    const hasVideo = uploaded.some((item) => item.type === 'video');
    const hasImage = uploaded.some((item) => item.type === 'image');
    const { error } = await mediaRepository.createPost({ body, mediaIds: uploaded.map((item) => item.id), mediaType: hasVideo && hasImage ? 'mixed' : hasVideo ? 'video' : 'image' });
    setMessage(error ? error.message : 'Posted.');
    if (!error) {
      setBody('');
      setFiles([]);
      onPosted?.();
    }
  }

  return (
    <form id="compose" className="x-composer" onSubmit={submit}>
      {profile?.avatarUrl ? <img className="x-avatar" src={profile.avatarUrl} alt="" /> : <span className="x-avatar" />}
      <div className="x-composer-body">
        <textarea maxLength={320} placeholder="What is happening?!" value={body} onChange={(event) => setBody(event.target.value)} />
        {previews.length > 0 && (
          <div className={previews.length > 1 ? 'x-media-grid x-preview-grid' : 'x-media-single x-preview-grid'}>
            {previews.map((preview) => (
              <div className="x-preview-tile" key={preview.url}>
                <button type="button" onClick={() => setFiles((items) => items.filter((item) => item !== preview.file))} aria-label="Remove media"><X size={16} /></button>
                {preview.type === 'video' ? <video src={preview.url} controls muted /> : <img src={preview.url} alt="Upload preview" />}
              </div>
            ))}
          </div>
        )}
        <div className="x-composer-footer">
          <div className="x-composer-tools">
            <label aria-label="Attach media"><ImageIcon size={20} /><input type="file" accept="image/*,video/*" multiple onChange={onFilesSelected} /></label>
            <button type="button" aria-label="Add emoji"><Smile size={20} /></button>
          </div>
          <div className="x-post-submit-row">
            <span className={remaining < 0 ? 'x-count is-over' : 'x-count'}>{remaining}</span>
            <button className="x-submit-post" type="submit"><Send size={17} /> Post</button>
          </div>
        </div>
        {message && <p className="x-form-message">{message}</p>}
      </div>
    </form>
  );
}

export function PostActions({ post, onChanged }: { post: Post; onChanged?: () => void }) {
  const { profile } = useAuth();
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.body);
  const [message, setMessage] = useState('');
  const isOwner = profile?.id === post.author.id;

  async function run(action: () => Promise<{ error: { message: string } | null }>, success = 'Saved.') {
    const { error } = await action();
    setMessage(error ? error.message : success);
    if (!error) onChanged?.();
  }

  return (
    <div className="x-post-actions-wrap">
      {editing && (
        <form className="x-inline-edit" onSubmit={(event) => { event.preventDefault(); void run(() => mediaRepository.updateOwnPost(post.id, draft), 'Post updated.'); setEditing(false); }}>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
          <button type="submit">Save</button>
        </form>
      )}
      <div className="x-post-actions">
        <button className="reply" onClick={() => setComment(comment ? '' : ' ')}><MessageCircle size={18} /><span>{post.commentCount}</span></button>
        <button className="repost" onClick={() => void run(() => mediaRepository.repost(post.id), 'Reposted.')}><Repeat2 size={18} /><span>{post.repostCount}</span></button>
        <button className="like" onClick={() => void run(() => mediaRepository.likePost(post.id), 'Liked.')}><Heart size={18} /><span>{post.likeCount}</span></button>
        <button className="bookmark" onClick={() => void run(() => mediaRepository.bookmark(post.id), 'Bookmarked.')}><Bookmark size={18} /><span>{post.bookmarkCount}</span></button>
        <button onClick={() => navigator.share?.({ title: 'Media post', text: post.body, url: window.location.href })}><Share size={18} /></button>
        <span className="x-analytics"><BarChart3 size={18} /> {Math.max(post.likeCount * 3, 1200).toLocaleString()}</span>
        {isOwner && <button onClick={() => setEditing((value) => !value)}>Edit</button>}
        {isOwner && <button className="delete" onClick={() => void run(() => mediaRepository.deleteOwnPost(post.id), 'Deleted.')}><Trash2 size={18} /></button>}
      </div>
      {comment && (
        <form className="x-reply-box" onSubmit={(event) => { event.preventDefault(); void run(() => mediaRepository.commentOnPost(post.id, comment.trim()), 'Reply sent.'); setComment(''); }}>
          <input placeholder="Post your reply" value={comment.trimStart()} onChange={(event) => setComment(event.target.value)} />
          <button type="submit">Reply</button>
        </form>
      )}
      {message && <p className="x-form-message">{message}</p>}
    </div>
  );
}

export function SafetyMenu() {
  return null;
}

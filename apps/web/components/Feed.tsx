import { demoFeed } from '@media/api';
import { CreatePostForm, PostActions, SafetyMenu } from './SocialActions';

export function StoryRail() {
  return <div className="stories">{demoFeed.stories.map((story) => <article className="story" key={story.id}><div className="story-ring">{story.author.avatarUrl ? <img src={story.author.avatarUrl} alt="" /> : <div />}</div><small>{story.author.username}</small></article>)}</div>;
}

export function Composer() {
  return <CreatePostForm />;
}


export function PostList() {
  return <>{demoFeed.posts.map((post) => <article className="post" key={post.id}><div className="row space"><div className="row"><div className="avatar" /><div><strong>{post.author.displayName} {post.author.verified && <span className="badge">✓</span>}</strong><div className="muted">@{post.author.username} · {new Date(post.createdAt).toLocaleTimeString()}</div></div></div><SafetyMenu targetType="post" targetId={post.id} reporterId="user-1" /></div><p>{post.body}</p>{post.media.map((media) => <img key={media.id} className="post-media" src={media.url} alt={media.altText ?? ''} />)}<PostActions post={post} /></article>)}</>;
}

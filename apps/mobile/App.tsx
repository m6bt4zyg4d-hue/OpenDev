import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, RefreshControl, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@media/design-system';
import type { Conversation, FeedBundle, MediaAsset, Notification, Post, Profile } from '@media/types';
import { mobileRepository, supabase } from './src/lib/supabase';

type Tab = 'home' | 'search' | 'create' | 'activity' | 'profile';
type SessionLike = { user?: { id?: string; email?: string } } | null;
type LoadState = 'idle' | 'loading' | 'refreshing' | 'error';
type FeedMode = 'forYou' | 'following';
type PickedAsset = ImagePicker.ImagePickerAsset & { uploaded?: MediaAsset };

const emptyFeed: FeedBundle = { stories: [], posts: [], trendingHashtags: [] };

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [session, setSession] = useState<SessionLike>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  const refreshProfile = useCallback(async () => {
    const nextProfile = await mobileRepository.getMyProfile();
    setProfile(nextProfile);
  }, []);

  const applyAuthenticatedSession = useCallback(async (candidateSession: SessionLike) => {
    if (!candidateSession) {
      setSession(null);
      setProfile(null);
      return;
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      setSession(null);
      setProfile(null);
      await mobileRepository.signOut().catch(() => undefined);
      return;
    }

    setSession({ ...candidateSession, user: { ...candidateSession.user, id: data.user.id, email: data.user.email ?? candidateSession.user?.email } });
    await refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    mobileRepository.getSession().then(async ({ data }: { data: { session: SessionLike } }) => {
      await applyAuthenticatedSession(data.session);
      setAuthLoading(false);
    }).catch(() => {
      setSession(null);
      setProfile(null);
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      await applyAuthenticatedSession(nextSession as SessionLike);
    });
    return () => data.subscription.unsubscribe();
  }, [applyAuthenticatedSession]);

  const screen = useMemo(() => {
    if (!session) return <AuthScreen loading={authLoading} />;
    if (tab === 'search') return <ExploreScreen />;
    if (tab === 'create') return <ComposerScreen onPosted={() => { setFeedRefreshKey((value) => value + 1); setTab('home'); }} />;
    if (tab === 'activity') return <ActivityScreen />;
    if (tab === 'profile') return <ProfileScreen profile={profile} onProfileChanged={refreshProfile} />;
    return <HomeScreen currentProfile={profile} refreshKey={feedRefreshKey} onCompose={() => setTab('create')} />;
  }, [authLoading, feedRefreshKey, profile, refreshProfile, session, tab]);

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.logo}>Media</Text>
        {session ? <TouchableOpacity onPress={() => void mobileRepository.signOut()}><Text style={styles.headerAction}>Log out</Text></TouchableOpacity> : null}
      </View>
      <View style={styles.content}>{screen}</View>
      {session ? <BottomNav selected={tab} onSelect={setTab} /> : null}
    </SafeAreaView>
  );
}

function AuthScreen({ loading }: { loading: boolean }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('Sign in with your Media account to continue.');
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    if (!email.trim() || !email.includes('@')) return 'Enter a valid email address.';
    if (mode !== 'reset' && password.length < 6) return 'Password must be at least 6 characters.';
    if (mode === 'signup' && !/^[a-z0-9_]{3,30}$/i.test(username.trim())) return 'Username must be 3–30 letters, numbers, or underscores.';
    if (mode === 'signup' && displayName.trim().length < 2) return 'Enter a display name.';
    return null;
  }

  async function submit() {
    const validation = validate();
    if (validation) return setMessage(validation);
    setSubmitting(true);
    setMessage('Working…');
    try {
      if (mode === 'login') await assertNoError(mobileRepository.signIn(email.trim(), password));
      if (mode === 'signup') {
        const normalizedUsername = username.trim().toLowerCase();
        if (!await mobileRepository.isUsernameAvailable(normalizedUsername)) throw new Error('Username is already taken. Choose another username.');
        await assertNoError(mobileRepository.signUp({ email: email.trim(), password, username: normalizedUsername, displayName: displayName.trim() }));
      }
      if (mode === 'reset') await assertNoError(mobileRepository.resetPassword(email.trim()));
      setMessage(mode === 'signup' ? 'Account created. Confirm your email if required, then log in.' : mode === 'reset' ? 'Password reset email sent.' : 'Signed in.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <StateView title="Checking session…" loading />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.authTitle}>Welcome back</Text>
        <Text style={styles.authCopy}>A real Supabase session is required before you can view feeds, post, search, message, or manage your profile.</Text>
        <View style={styles.segmented}>
          {(['login', 'signup', 'reset'] as const).map((item) => <TouchableOpacity key={item} style={[styles.segment, mode === item && styles.segmentActive]} onPress={() => setMode(item)}><Text style={[styles.segmentText, mode === item && styles.segmentTextActive]}>{item === 'login' ? 'Log in' : item === 'signup' ? 'Sign up' : 'Reset'}</Text></TouchableOpacity>)}
        </View>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
        {mode !== 'reset' ? <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} secureTextEntry textContentType="password" /> : null}
        {mode === 'signup' ? <><TextInput style={styles.input} placeholder="Username" placeholderTextColor={colors.muted} value={username} onChangeText={setUsername} autoCapitalize="none" /><TextInput style={styles.input} placeholder="Display name" placeholderTextColor={colors.muted} value={displayName} onChangeText={setDisplayName} /></> : null}
        <PrimaryButton label={submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset email'} onPress={() => void submit()} disabled={submitting} />
        <Text style={styles.statusText}>{message}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function HomeScreen({ currentProfile, refreshKey, onCompose }: { currentProfile: Profile | null; refreshKey: number; onCompose: () => void }) {
  const [feed, setFeed] = useState<FeedBundle>(emptyFeed);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [mode, setMode] = useState<FeedMode>('forYou');
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    setState(refresh ? 'refreshing' : 'loading');
    setError('');
    try {
      if (mode === 'following') {
        setFollowingPosts(await mobileRepository.getFollowingFeed());
      } else {
        setFeed(await mobileRepository.getHomeFeed());
      }
      setState('idle');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load feed.');
      setState('error');
    }
  }, [mode]);

  useEffect(() => { void load(); }, [load, refreshKey]);

  if (state === 'loading') return <StateView title="Loading your feed…" loading />;
  if (state === 'error') return <StateView title="Feed unavailable" message={error} actionLabel="Try again" onAction={() => void load()} />;

  const posts = mode === 'following' ? followingPosts : feed.posts;

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} onChanged={() => void load(true)} />}
      ListHeaderComponent={<><ComposerPrompt profile={currentProfile} onPress={onCompose} /><FeedTabs selected={mode} onSelect={setMode} />{mode === 'forYou' ? <TrendingStrip tags={feed.trendingHashtags} /> : null}</>}
      ListEmptyComponent={<StateView title={mode === 'following' ? 'No following posts yet' : 'No posts yet'} message={mode === 'following' ? 'Posts from people you follow will appear here.' : 'Create the first post in your community.'} />}
      refreshControl={<RefreshControl refreshing={state === 'refreshing'} onRefresh={() => void load(true)} tintColor={colors.primary} />}
      contentContainerStyle={posts.length === 0 ? styles.listEmpty : undefined}
    />
  );
}

function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [feed, setFeed] = useState<FeedBundle>(emptyFeed);
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setState('loading');
      setError('');
      try {
        if (query.trim()) {
          const [nextUsers, nextPosts] = await Promise.all([mobileRepository.searchProfiles(query.trim().replace(/^#/, '')), mobileRepository.searchPosts(query.trim().replace(/^#/, ''))]);
          if (!active) return;
          setUsers(nextUsers);
          setPosts(nextPosts);
        } else {
          const nextFeed = await mobileRepository.getHomeFeed();
          if (!active) return;
          setFeed(nextFeed);
          setUsers([]);
          setPosts(nextFeed.posts);
        }
        setState('idle');
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'Search failed.');
        setState('error');
      }
    }
    const timer = setTimeout(() => void load(), query.trim() ? 300 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} />}
      ListHeaderComponent={<View><TextInput style={styles.search} placeholder="Search users and posts" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} autoCapitalize="none" />{state === 'loading' ? <InlineLoading label="Searching…" /> : null}{state === 'error' ? <InlineError message={error} /> : null}{!query.trim() ? <TrendingStrip tags={feed.trendingHashtags} /> : null}{users.map((user) => <UserRow key={user.id} profile={user} />)}</View>}
      ListEmptyComponent={state === 'idle' ? <StateView title={query.trim() ? 'No results' : 'No trending posts yet'} message={query.trim() ? 'Try another search term.' : 'Trending topics appear when people use hashtags in posts.'} /> : null}
    />
  );
}

function ComposerScreen({ onPosted }: { onPosted: () => void }) {
  return <ScrollView keyboardShouldPersistTaps="handled"><PostComposer expanded onPosted={onPosted} /></ScrollView>;
}

function ActivityScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    setError('');
    try {
      const [nextNotifications, nextConversations] = await Promise.all([mobileRepository.getNotifications(), mobileRepository.getConversations()]);
      setNotifications(nextNotifications);
      setConversations(nextConversations);
      setState('idle');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load activity.');
      setState('error');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (state === 'loading') return <StateView title="Loading activity…" loading />;
  if (state === 'error') return <StateView title="Activity unavailable" message={error} actionLabel="Try again" onAction={() => void load()} />;

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} tintColor={colors.primary} />}>
      <SectionTitle title="Notifications" />
      {notifications.length === 0 ? <EmptyCard title="No notifications yet" message="Likes, follows, replies, reposts, and moderation updates will appear here." /> : notifications.map((item) => <NotificationCard key={item.id} notification={item} />)}
      <SectionTitle title="Messages" />
      {conversations.length === 0 ? <EmptyCard title="No conversations yet" message="Direct messages will appear here after you start or receive a conversation." /> : conversations.map((item) => <ConversationCard key={item.id} conversation={item} />)}
    </ScrollView>
  );
}

function ProfileScreen({ profile, onProfileChanged }: { profile: Profile | null; onProfileChanged: () => Promise<void> }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!profile) return;
    setState('loading');
    setError('');
    try {
      setPosts(await mobileRepository.getProfileFeed(profile.id));
      setState('idle');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load profile posts.');
      setState('error');
    }
  }, [profile]);

  useEffect(() => { void load(); }, [load]);

  if (!profile) return <StateView title="Loading profile…" loading />;

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} onChanged={() => void load()} />}
      ListHeaderComponent={<ProfileHeader profile={profile} onProfileChanged={onProfileChanged} />}
      ListEmptyComponent={state === 'loading' ? <InlineLoading label="Loading posts…" /> : state === 'error' ? <InlineError message={error} /> : <StateView title="No posts yet" message="Your posts will appear here." />}
    />
  );
}

function ProfileHeader({ profile, onProfileChanged }: { profile: Profile; onProfileChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);

  return (
    <View>
      <View style={styles.banner}>{profile.bannerUrl ? <Image source={{ uri: profile.bannerUrl }} style={styles.bannerImage} /> : null}</View>
      <Card compact>
        <View style={styles.profileTop}>
          <Avatar profile={profile} size={76} />
        </View>
        <Text style={styles.profileName}>{profile.displayName} {profile.verified ? '✓' : ''}</Text>
        <Text style={styles.muted}>@{profile.username}</Text>
        {profile.bio ? <Text style={styles.body}>{profile.bio}</Text> : null}
        <View style={styles.row}><Text style={styles.statText}><Text style={styles.statNumber}>{profile.followingCount.toLocaleString()}</Text> Following</Text><Text style={styles.statText}><Text style={styles.statNumber}>{profile.followersCount.toLocaleString()}</Text> Followers</Text></View>
        <Chip label="Edit profile" onPress={() => setEditing((value) => !value)} />
      </Card>
      {editing ? <EditProfileForm profile={profile} onSaved={() => { setEditing(false); void onProfileChanged(); }} /> : null}
    </View>
  );
}

function EditProfileForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '');
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const usernameChanged = username.trim().toLowerCase() !== profile.username.toLowerCase();
  const nextUsernameDate = profile.usernameLastChangedAt ? new Date(new Date(profile.usernameLastChangedAt).getTime() + 30 * 24 * 60 * 60 * 1000) : null;
  const usernameLocked = Boolean(usernameChanged && nextUsernameDate && nextUsernameDate > new Date());

  async function save() {
    const normalizedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) return setMessage('Username must be 3–30 letters, numbers, or underscores.');
    if (displayName.trim().length < 2) return setMessage('Display name must be at least 2 characters.');
    if (usernameLocked) return setMessage(`You can change your username again on ${nextUsernameDate?.toLocaleDateString()}.`);
    setSaving(true);
    setMessage('Saving…');
    try {
      if (usernameChanged && !await mobileRepository.isUsernameAvailable(normalizedUsername)) throw new Error('Username is already taken.');
      await assertNoError(mobileRepository.updateProfile({ username: normalizedUsername, displayName, bio, avatarUrl, bannerUrl }));
      setMessage('Profile saved.');
      onSaved();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  return <Card compact><Text style={styles.title}>Edit profile</Text><TextInput style={styles.input} placeholder="Username" placeholderTextColor={colors.muted} value={username} onChangeText={setUsername} autoCapitalize="none" /><TextInput style={styles.input} placeholder="Display name" placeholderTextColor={colors.muted} value={displayName} onChangeText={setDisplayName} /><TextInput style={styles.input} placeholder="Bio" placeholderTextColor={colors.muted} value={bio} onChangeText={setBio} multiline maxLength={160} /><TextInput style={styles.input} placeholder="Avatar image URL" placeholderTextColor={colors.muted} value={avatarUrl} onChangeText={setAvatarUrl} autoCapitalize="none" /><TextInput style={styles.input} placeholder="Banner image URL" placeholderTextColor={colors.muted} value={bannerUrl} onChangeText={setBannerUrl} autoCapitalize="none" />{usernameLocked ? <Text style={styles.statusText}>Username changes are limited to once every 30 days. You can change it again on {nextUsernameDate?.toLocaleDateString()}.</Text> : null}<PrimaryButton label={saving ? 'Saving…' : 'Save profile'} onPress={() => void save()} disabled={saving} />{message ? <Text style={styles.statusText}>{message}</Text> : null}</Card>;
}

function ComposerPrompt({ profile, onPress }: { profile: Profile | null; onPress: () => void }) {
  return <TouchableOpacity style={styles.prompt} onPress={onPress} accessibilityRole="button"><Avatar profile={profile} size={40} /><Text style={styles.promptText}>What’s happening?</Text></TouchableOpacity>;
}

function PostComposer({ expanded, onPosted }: { expanded?: boolean; onPosted?: () => void }) {
  const [body, setBody] = useState('');
  const [assets, setAssets] = useState<PickedAsset[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function pickMedia() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return setMessage('Media library permission is required to attach photos or videos.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: true, quality: 0.88, selectionLimit: 4 });
    if (!result.canceled) setAssets(result.assets.slice(0, 4));
  }

  async function publish() {
    if (!body.trim() && assets.length === 0) return setMessage('Write text or attach media before posting.');
    if (body.length > 500) return setMessage('Posts are limited to 500 characters on mobile.');
    setSubmitting(true);
    setMessage('Publishing…');
    try {
      const uploaded: MediaAsset[] = [];
      for (const asset of assets) uploaded.push(await uploadPickedAsset(asset));
      const hasVideo = uploaded.some((item) => item.type === 'video');
      const hasImage = uploaded.some((item) => item.type === 'image');
      await assertNoError(mobileRepository.createPost({ body: body.trim(), mediaIds: uploaded.map((item) => item.id), mediaType: hasVideo && hasImage ? 'mixed' : hasVideo ? 'video' : hasImage ? 'image' : undefined }));
      setBody('');
      setAssets([]);
      setMessage('Posted.');
      onPosted?.();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to publish post.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <Text style={styles.title}>Create post</Text>
      <TextInput style={[styles.input, expanded && styles.composerInput]} multiline placeholder="What’s happening?" placeholderTextColor={colors.muted} value={body} onChangeText={setBody} maxLength={500} />
      {assets.length ? <View style={styles.previewGrid}>{assets.map((asset) => <View key={asset.assetId ?? asset.uri} style={styles.previewTile}>{asset.type === 'video' ? <Text style={styles.previewText}>Video attached</Text> : <Image source={{ uri: asset.uri }} style={styles.previewImage} />}</View>)}</View> : null}
      <View style={styles.row}><Chip label="Add media" onPress={() => void pickMedia()} /><Chip label={submitting ? 'Posting…' : 'Post'} primary onPress={() => void publish()} disabled={submitting || (!body.trim() && assets.length === 0)} /></View>
      {message ? <Text style={styles.statusText}>{message}</Text> : null}
    </Card>
  );
}

function PostCard({ post, onChanged }: { post: Post; onChanged?: () => void }) {
  const [reply, setReply] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [reposted, setReposted] = useState(Boolean(post.repostedByMe));
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [repostCount, setRepostCount] = useState(post.repostCount);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage('');
    try {
      await assertNoError(action());
      setMessage(success);
      onChanged?.();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleLike() {
    await run(async () => {
      if (liked) {
        await assertNoError(mobileRepository.unlikePost(post.id));
        setLiked(false);
        setLikeCount((value) => Math.max(0, value - 1));
      } else {
        await assertNoError(mobileRepository.likePost(post.id));
        setLiked(true);
        setLikeCount((value) => value + 1);
      }
    }, liked ? 'Like removed.' : 'Liked.');
  }

  async function toggleRepost() {
    await run(async () => {
      if (reposted) {
        await assertNoError(mobileRepository.unrepost(post.id));
        setReposted(false);
        setRepostCount((value) => Math.max(0, value - 1));
      } else {
        await assertNoError(mobileRepository.repost(post.id));
        setReposted(true);
        setRepostCount((value) => value + 1);
      }
    }, reposted ? 'Repost removed.' : 'Reposted.');
  }

  async function sharePost() {
    setBusy(true);
    setMessage('');
    try {
      await Share.share({ message: `${post.author.displayName}: ${post.body}`.trim() || 'Media post' });
    } catch {
      setMessage('Unable to open the share sheet.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <View style={styles.postHeader}><Avatar profile={post.author} size={44} /><View style={styles.flex}><Text style={styles.postName}>{post.author.displayName} {post.author.verified ? '✓' : ''}</Text><Text style={styles.muted}>@{post.author.username} · {formatDate(post.createdAt)}</Text></View></View>
      {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
      {post.media.length ? <MediaGrid media={post.media} /> : null}
      <View style={styles.actions}>
        <ActionText label={`💬 ${post.commentCount}`} onPress={() => setReply((value) => value ? '' : ' ')} disabled={busy} />
        <ActionText label={`${reposted ? '↻' : '↺'} ${repostCount}`} onPress={() => void toggleRepost()} disabled={busy} />
        <ActionText label={`${liked ? '♥' : '♡'} ${likeCount}`} onPress={() => void toggleLike()} disabled={busy} />
        <ActionText label="↗" onPress={() => void sharePost()} disabled={busy} />
      </View>
      {reply ? <View style={styles.replyBox}><TextInput style={styles.replyInput} placeholder="Write a reply" placeholderTextColor={colors.muted} value={reply.trimStart()} onChangeText={setReply} /><Chip label="Reply" primary onPress={() => void run(() => mobileRepository.commentOnPost(post.id, reply.trim()), 'Reply posted.')} disabled={!reply.trim() || busy} /></View> : null}
      {message ? <Text style={styles.statusText}>{message}</Text> : null}
    </Card>
  );
}

function MediaGrid({ media }: { media: MediaAsset[] }) {
  return <View style={media.length > 1 ? styles.mediaGrid : undefined}>{media.map((item) => item.type === 'video' ? <View key={item.id} style={styles.videoTile}><Text style={styles.previewText}>Video</Text></View> : <Image key={item.id} source={{ uri: item.url }} style={media.length > 1 ? styles.mediaTile : styles.mediaSingle} />)}</View>;
}

function FeedTabs({ selected, onSelect }: { selected: FeedMode; onSelect: (mode: FeedMode) => void }) {
  return <View style={styles.feedTabs}><TouchableOpacity style={[styles.feedTab, selected === 'forYou' && styles.feedTabActive]} onPress={() => onSelect('forYou')}><Text style={[styles.feedTabText, selected === 'forYou' && styles.feedTabTextActive]}>For You</Text></TouchableOpacity><TouchableOpacity style={[styles.feedTab, selected === 'following' && styles.feedTabActive]} onPress={() => onSelect('following')}><Text style={[styles.feedTabText, selected === 'following' && styles.feedTabTextActive]}>Following</Text></TouchableOpacity></View>;
}

function TrendingStrip({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trends}>{tags.map((tag) => <View key={tag} style={styles.trendPill}><Text style={styles.trendText}>{tag}</Text></View>)}</ScrollView>;
}

function UserRow({ profile }: { profile: Profile }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [isMe, setIsMe] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadRelationship() {
      const [me, relationship] = await Promise.all([mobileRepository.getMyProfile(), mobileRepository.isFollowing(profile.id)]);
      if (!active) return;
      setIsMe(me?.id === profile.id);
      setFollowing(relationship);
    }
    void loadRelationship();
    return () => { active = false; };
  }, [profile.id]);

  async function toggleFollow() {
    setBusy(true);
    setMessage('');
    try {
      if (following) {
        await assertNoError(mobileRepository.unfollow(profile.id));
        setFollowing(false);
        setMessage('Unfollowed.');
      } else {
        await assertNoError(mobileRepository.follow(profile.id));
        setFollowing(true);
        setMessage('Following.');
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to update follow.');
    } finally {
      setBusy(false);
    }
  }

  return <Card compact><View style={styles.userRow}><Avatar profile={profile} size={48} /><View style={styles.flex}><Text style={styles.postName}>{profile.displayName} {profile.verified ? '✓' : ''}</Text><Text style={styles.muted}>@{profile.username}</Text><Text style={styles.muted}>{profile.followersCount.toLocaleString()} followers</Text>{message ? <Text style={styles.statusText}>{message}</Text> : null}</View>{isMe ? null : <Chip label={following ? 'Following' : 'Follow'} primary={!following} onPress={() => void toggleFollow()} disabled={busy} />}</View></Card>;
}

function NotificationCard({ notification }: { notification: Notification }) {
  return <Card compact><Text style={styles.postName}>{notification.title}</Text><Text style={styles.body}>{notification.body}</Text><Text style={styles.muted}>{notification.type} · {formatDate(notification.createdAt)}</Text></Card>;
}

function ConversationCard({ conversation }: { conversation: Conversation }) {
  const participantNames = conversation.participants.map((person) => person.displayName).join(', ');
  const title = conversation.title ?? (participantNames || 'Conversation');
  return <Card compact><Text style={styles.postName}>{title}</Text><Text style={styles.body}>{conversation.lastMessage?.body ?? 'No messages yet.'}</Text><Text style={styles.muted}>{conversation.isGroup ? 'Group' : 'Direct message'} · {conversation.unreadCount} unread</Text></Card>;
}

function BottomNav({ selected, onSelect }: { selected: Tab; onSelect: (tab: Tab) => void }) {
  const items: Array<{ key: Tab; label: string }> = [
    { key: 'home', label: 'Home' },
    { key: 'search', label: 'Search' },
    { key: 'create', label: 'Create' },
    { key: 'activity', label: 'Activity' },
    { key: 'profile', label: 'Profile' }
  ];
  return <View style={styles.tabbar}>{items.map((item) => <TouchableOpacity key={item.key} onPress={() => onSelect(item.key)} style={styles.tab}><Text style={[styles.tabText, selected === item.key && styles.activeTabText]}>{item.label}</Text></TouchableOpacity>)}</View>;
}

function Avatar({ profile, size = 44 }: { profile?: Profile | null; size?: number }) {
  return profile?.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} /> : <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}><Text style={styles.avatarText}>{profile?.displayName?.[0]?.toUpperCase() ?? 'M'}</Text></View>;
}

function SectionTitle({ title }: { title: string }) { return <Text style={styles.sectionTitle}>{title}</Text>; }
function InlineLoading({ label }: { label: string }) { return <View style={styles.inlineState}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>{label}</Text></View>; }
function InlineError({ message }: { message: string }) { return <Text style={styles.errorText}>{message}</Text>; }
function EmptyCard({ title, message }: { title: string; message: string }) { return <Card compact><Text style={styles.postName}>{title}</Text><Text style={styles.muted}>{message}</Text></Card>; }

function StateView({ title, message, loading, actionLabel, onAction }: { title: string; message?: string; loading?: boolean; actionLabel?: string; onAction?: () => void }) {
  return <View style={styles.stateView}>{loading ? <ActivityIndicator color={colors.primary} size="large" /> : null}<Text style={styles.title}>{title}</Text>{message ? <Text style={styles.mutedCenter}>{message}</Text> : null}{actionLabel && onAction ? <Chip label={actionLabel} primary onPress={onAction} /> : null}</View>;
}

function Card({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) { return <View style={[styles.card, compact && styles.cardCompact]}>{children}</View>; }
function Chip({ label, primary = false, disabled = false, onPress }: { label: string; primary?: boolean; disabled?: boolean; onPress?: () => void }) { return <TouchableOpacity disabled={disabled} style={[styles.chip, primary && styles.primaryChip, disabled && styles.disabled]} onPress={onPress}><Text style={primary ? styles.primaryChipText : styles.chipText}>{label}</Text></TouchableOpacity>; }
function PrimaryButton({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) { return <TouchableOpacity disabled={disabled} style={[styles.primaryButton, disabled && styles.disabled]} onPress={onPress}><Text style={styles.primaryButtonText}>{label}</Text></TouchableOpacity>; }
function ActionText({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) { return <TouchableOpacity disabled={disabled} onPress={onPress}><Text style={[styles.actionText, disabled && styles.disabledText]}>{label}</Text></TouchableOpacity>; }

async function assertNoError<T>(promise: Promise<T> | T): Promise<T> {
  const result = await promise as T & { error?: { message?: string } | null };
  if (result?.error) throw new Error(result.error.message ?? 'Request failed.');
  return result;
}

async function uploadPickedAsset(asset: PickedAsset): Promise<MediaAsset> {
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const fileName = asset.fileName ?? `${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`;
  const file = Object.assign(blob, { name: fileName, type: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg') }) as File;
  const { data, error } = await mobileRepository.uploadMedia(file, fileName);
  if (error || !data) throw new Error(error?.message ?? 'Media upload failed.');
  return data;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flex: 1 },
  header: { paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  logo: { color: colors.text, fontSize: 28, fontWeight: '900' },
  headerAction: { color: colors.primary, fontWeight: '800' },
  authContainer: { padding: 20, gap: 14 },
  authTitle: { color: colors.text, fontSize: 34, fontWeight: '900' },
  authCopy: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  segmented: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 999, borderWidth: 1, borderColor: colors.border, padding: 4 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.muted, fontWeight: '800' },
  segmentTextActive: { color: colors.text },
  input: { color: colors.text, minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, textAlignVertical: 'top', backgroundColor: colors.surface },
  composerInput: { minHeight: 150 },
  search: { margin: 12, padding: 14, borderRadius: 999, color: colors.text, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  card: { marginHorizontal: 12, marginVertical: 7, padding: 16, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 10 },
  cardCompact: { marginVertical: 5, padding: 14 },
  title: { color: colors.text, fontSize: 19, fontWeight: '800' },
  body: { color: colors.text, fontSize: 16, lineHeight: 23 },
  muted: { color: colors.muted },
  mutedCenter: { color: colors.muted, textAlign: 'center', lineHeight: 22 },
  statusText: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  errorText: { color: colors.danger, marginHorizontal: 14, marginVertical: 8 },
  postHeader: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  postName: { color: colors.text, fontWeight: '800', fontSize: 16 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  actionText: { color: colors.muted, fontWeight: '800', paddingVertical: 6 },
  disabledText: { opacity: 0.45 },
  replyBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyInput: { flex: 1, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  prompt: { margin: 12, padding: 14, borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10 },
  promptText: { color: colors.muted, fontSize: 16 },
  feedTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 8 },
  feedTab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  feedTabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  feedTabText: { color: colors.muted, fontWeight: '900' },
  feedTabTextActive: { color: colors.text },
  trends: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  trendPill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.surface },
  trendText: { color: colors.text, fontWeight: '800' },
  userRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatar: { backgroundColor: colors.border },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.text, fontWeight: '900' },
  mediaSingle: { width: '100%', height: 280, borderRadius: 18, backgroundColor: colors.border },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mediaTile: { width: '48.5%', height: 160, borderRadius: 16, backgroundColor: colors.border },
  videoTile: { height: 160, borderRadius: 16, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', padding: 16 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewTile: { width: '48%', height: 130, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '100%' },
  previewText: { color: colors.muted, fontWeight: '800' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  primaryChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '800' },
  primaryChipText: { color: colors.text, fontWeight: '900' },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: colors.text, fontWeight: '900', fontSize: 16 },
  disabled: { opacity: 0.55 },
  tabbar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background, paddingVertical: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  activeTabText: { color: colors.primary },
  sectionTitle: { color: colors.text, fontWeight: '900', fontSize: 20, marginHorizontal: 14, marginTop: 16, marginBottom: 6 },
  inlineState: { flexDirection: 'row', gap: 8, alignItems: 'center', marginHorizontal: 14, marginVertical: 8 },
  stateView: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  listEmpty: { flexGrow: 1 },
  banner: { height: 150, margin: 12, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.primary },
  bannerImage: { width: '100%', height: '100%' },
  profileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  profileName: { color: colors.text, fontSize: 24, fontWeight: '900' },
  statText: { color: colors.muted },
  statNumber: { color: colors.text, fontWeight: '900' }
});

import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@media/design-system';
import { currentProfile, demoConversations, demoFeed, demoModerationQueue, demoNotifications, demoSupportTickets } from '@media/api';
import { mobileRepository, supabase } from './src/lib/supabase';

type Tab = 'Auth' | 'Home' | 'Explore' | 'Post' | 'Stories' | 'DMs' | 'Alerts' | 'Profile' | 'Admin';

export default function App() {
  const [tab, setTab] = useState<Tab>('Home');
  const [hasSession, setHasSession] = useState(false);
  const protectedTabs: Tab[] = ['Post', 'Stories', 'DMs', 'Alerts', 'Profile', 'Admin'];
  useEffect(() => {
    mobileRepository.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setHasSession(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);
  const content = useMemo(() => {
    if (!hasSession && protectedTabs.includes(tab)) return <AuthScreen />;
    switch (tab) {
      case 'Auth': return <AuthScreen />;
      case 'Post': return <ComposerScreen />;
      case 'Stories': return <StoriesScreen />;
      case 'DMs': return <MessagesScreen />;
      case 'Alerts': return <NotificationsScreen />;
      case 'Profile': return <ProfileScreen />;
      case 'Admin': return <AdminScreen />;
      case 'Explore': return <ExploreScreen />;
      default: return <HomeScreen />;
    }
  }, [tab, hasSession]);
  return <SafeAreaView style={styles.app}><StatusBar style="light" /><View style={styles.header}><Text style={styles.logo}>Media</Text><TouchableOpacity style={styles.liveButton}><Text style={styles.liveText}>Go Live</Text></TouchableOpacity></View>{content}<View style={styles.tabbar}>{(['Auth','Home','Explore','Post','Stories','DMs','Alerts','Profile','Admin'] as Tab[]).map((item) => <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}><Text style={styles.tabText}>{item}</Text></TouchableOpacity>)}</View></SafeAreaView>;
}


function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('Protected screens require login.');
  async function run(action: 'login' | 'signup' | 'reset' | 'logout') {
    try {
      if (action === 'login') await mobileRepository.signIn(email, password);
      if (action === 'signup') await mobileRepository.signUp({ email, password, username, displayName });
      if (action === 'reset') await mobileRepository.resetPassword(email);
      if (action === 'logout') await mobileRepository.signOut();
      setMessage(action === 'signup' ? 'Account created. Confirm email if required, then log in.' : 'Done.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    }
  }
  return <ScrollView><Card><Text style={styles.title}>Signup / login</Text><TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} autoCapitalize="none" /><TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry value={password} onChangeText={setPassword} /><TextInput style={styles.input} placeholder="Username for signup" placeholderTextColor={colors.muted} value={username} onChangeText={setUsername} autoCapitalize="none" /><TextInput style={styles.input} placeholder="Display name" placeholderTextColor={colors.muted} value={displayName} onChangeText={setDisplayName} /><View style={styles.row}><Chip label="Create account" primary onPress={() => void run('signup')} /><Chip label="Log in" onPress={() => void run('login')} /><Chip label="Reset password" onPress={() => void run('reset')} /><Chip label="Log out" onPress={() => void run('logout')} /></View><Text style={styles.muted}>{message}</Text></Card></ScrollView>;
}

function HomeScreen() { return <ScrollView><StoryRail /><ComposerCard /><PostCards /></ScrollView>; }
function ExploreScreen() { return <ScrollView><TextInput style={styles.search} placeholder="Search people, posts, and hashtags" placeholderTextColor={colors.muted} />{demoFeed.trendingHashtags.map((tag) => <Card key={tag}><Text style={styles.title}>{tag}</Text><Text style={styles.muted}>Trending now across Media</Text></Card>)}<PostCards /></ScrollView>; }
function ComposerScreen() { return <ScrollView><ComposerCard expanded /><Card><Text style={styles.title}>Camera & media picker</Text><Text style={styles.muted}>Use Expo Camera and ImagePicker permissions configured in app.json to capture images, videos, stories, and live previews.</Text><View style={styles.row}><Chip label="Open camera" /><Chip label="Pick media" /><Chip label="AI pre-check" /></View></Card></ScrollView>; }
function StoriesScreen() { return <ScrollView><StoryRail large /><Card><Text style={styles.title}>Create story</Text><Text style={styles.muted}>Stories expire after 24 hours and track story views.</Text><Chip label="Add photo/video story" /></Card></ScrollView>; }
function MessagesScreen() { return <ScrollView>{demoConversations.map((dm) => <Card key={dm.id}><Text style={styles.title}>{dm.title ?? dm.participants[1]?.displayName}</Text><Text>{dm.lastMessage?.body}</Text><Text style={styles.muted}>{dm.isGroup ? 'Group chat' : '1-on-1'} · read receipts · typing indicators</Text></Card>)}</ScrollView>; }
function NotificationsScreen() { return <ScrollView>{demoNotifications.map((n) => <Card key={n.id}><Text style={styles.title}>{n.title}</Text><Text>{n.body}</Text><Text style={styles.muted}>Push · email · in-app</Text></Card>)}</ScrollView>; }
function ProfileScreen() { return <ScrollView><View style={styles.banner} /><Card><Text style={styles.title}>{currentProfile.displayName} ✓</Text><Text style={styles.muted}>@{currentProfile.username}</Text><Text>{currentProfile.bio}</Text><Text style={styles.muted}>{currentProfile.followersCount.toLocaleString()} followers · {currentProfile.followingCount.toLocaleString()} following</Text><View style={styles.row}><Chip label="Edit profile" /><Chip label="Privacy" /><Chip label="Delete account" /></View></Card><PostCards /></ScrollView>; }
function AdminScreen() { return <ScrollView><Card><Text style={styles.title}>Admin dashboard</Text><Text style={styles.muted}>Roles: owner, admin, moderator, support</Text><View style={styles.row}><Chip label="Reports" /><Chip label="Bans" /><Chip label="Appeals" /></View></Card>{demoModerationQueue.map((item) => <Card key={item.id}><Text style={styles.title}>{item.targetType} · {item.status}</Text><Text>{item.aiReason}</Text><Text style={styles.muted}>Human review queue · AI score {item.aiScore}</Text></Card>)}{demoSupportTickets.map((ticket) => <Card key={ticket.id}><Text style={styles.title}>{ticket.subject}</Text><Text>{ticket.message}</Text><Text style={styles.muted}>Support status: {ticket.status}</Text></Card>)}</ScrollView>; }

function StoryRail({ large = false }: { large?: boolean }) { return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>{demoFeed.stories.map((story) => <View key={story.id} style={styles.story}><View style={[styles.storyRing, large && styles.storyRingLarge]}><Text style={styles.storyInitial}>{story.author.displayName[0]}</Text></View><Text style={styles.muted} numberOfLines={1}>{story.author.username}</Text></View>)}</ScrollView>; }
function ComposerCard({ expanded = false }: { expanded?: boolean }) { return <Card><Text style={styles.title}>What’s happening?</Text><TextInput style={[styles.input, expanded && { minHeight: 140 }]} multiline placeholder="Post text, images, videos, quote posts, or start a live moment." placeholderTextColor={colors.muted} /><View style={styles.row}><Chip label="Photo" /><Chip label="Video" /><Chip label="Quote" /><Chip label="Publish" primary /></View></Card>; }
function PostCards() { return <>{demoFeed.posts.map((post) => <Card key={post.id}><Text style={styles.title}>{post.author.displayName} {post.author.verified ? '✓' : ''}</Text><Text style={styles.muted}>@{post.author.username}</Text><Text style={styles.body}>{post.body}</Text><View style={styles.actions}><Text>💬 {post.commentCount}</Text><Text>🔁 {post.repostCount}</Text><Text>♥ {post.likeCount}</Text><Text>🔖 {post.bookmarkCount}</Text><Text>↗</Text></View><Chip label="Report" /></Card>)}</>; }
function Card({ children }: { children: React.ReactNode }) { return <View style={styles.card}>{children}</View>; }
function Chip({ label, primary = false, onPress }: { label: string; primary?: boolean; onPress?: () => void }) { return <TouchableOpacity style={[styles.chip, primary && styles.primaryChip]} onPress={onPress}><Text style={primary ? styles.primaryChipText : styles.chipText}>{label}</Text></TouchableOpacity>; }

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  logo: { color: colors.text, fontSize: 28, fontWeight: '900' },
  liveButton: { backgroundColor: colors.danger, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  liveText: { color: colors.text, fontWeight: '800' },
  tabbar: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: colors.border, padding: 8, gap: 6 },
  tab: { paddingHorizontal: 9, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface },
  activeTab: { backgroundColor: colors.primary },
  tabText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  card: { margin: 12, padding: 16, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 8 },
  title: { color: colors.text, fontSize: 19, fontWeight: '800' },
  body: { color: colors.text, fontSize: 16, lineHeight: 23 },
  muted: { color: colors.muted },
  stories: { padding: 12, gap: 12 },
  story: { width: 86, alignItems: 'center', gap: 6 },
  storyRing: { width: 66, height: 66, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.warning },
  storyRingLarge: { width: 110, height: 110 },
  storyInitial: { color: colors.text, fontWeight: '900', fontSize: 24 },
  input: { color: colors.text, minHeight: 86, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 12, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  primaryChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '700' },
  primaryChipText: { color: colors.text, fontWeight: '900' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  search: { margin: 12, padding: 14, borderRadius: 999, color: colors.text, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  banner: { height: 150, margin: 12, borderRadius: 24, backgroundColor: colors.primary },
});

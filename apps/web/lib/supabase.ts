import { createMediaClient, MediaRepository } from '@media/api';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'local-anon-key';

export const supabase = createMediaClient({ supabaseUrl, supabaseAnonKey });
export const mediaRepository = new MediaRepository(supabase);
export const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

import { createClient } from '@supabase/supabase-js';
import { getDeviceInfo, getOrCreateSessionToken } from './deviceDetection';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// Normalize URL to base origin (strips accidental /rest/v1 or trailing slashes)
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '')
  .trim()
  .replace(/\.your-anon-key-here$/, '');

// Validate whether real credentials have been provided
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-key-here')
);


// Fallback dummy URL to prevent createClient from crashing if unconfigured
const clientUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const clientKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Register or update the current device session in the database.
 * If this is an unrecognized device/token, triggers an in-account security alert!
 */
export async function registerCurrentSession(userId: string) {
  if (!isSupabaseConfigured) return;

  const sessionToken = getOrCreateSessionToken();
  const deviceInfo = getDeviceInfo();

  try {
    // 1. Check if this device session already exists
    const { data: existingSession, error: checkError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_token', sessionToken)
      .maybeSingle();

    if (checkError) {
      console.warn('Error checking existing session:', checkError.message);
    }

    if (existingSession) {
      // Re-activate and update last_active_at
      await supabase
        .from('user_sessions')
        .update({
          is_active: true,
          revoked_at: null,
          last_active_at: new Date().toISOString(),
          device_name: deviceInfo.deviceName,
        })
        .eq('id', existingSession.id);
    } else {
      // 2. Newly detected device!
      // Insert session record
      const { error: insertError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          device_name: deviceInfo.deviceName,
          device_type: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          is_active: true,
          last_active_at: new Date().toISOString(),
        });

      if (!insertError) {
        // 3. Instagram-style in-account security alert!
        await supabase.from('security_events').insert({
          user_id: userId,
          event_type: 'new_device_login',
          title: 'New login detected',
          message: `Sign-in detected from a new device: ${deviceInfo.deviceName}. If this wasn't you, review your active sessions immediately.`,
          device_info: {
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            device_name: deviceInfo.deviceName,
            time: new Date().toISOString(),
          },
          severity: 'warning',
          is_read: false,
        });
      }
    }
  } catch (err) {
    console.error('Session registration error:', err);
  }
}

/**
 * Checks if the current session on this device is still active.
 * Returns false if revoked by another device.
 */
export async function isCurrentSessionValid(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  const sessionToken = getOrCreateSessionToken();

  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('is_active')
      .eq('user_id', userId)
      .eq('session_token', sessionToken)
      .maybeSingle();

    if (error || !data) {
      // If no session row found yet, we assume valid until registered
      return true;
    }

    return Boolean(data.is_active);
  } catch {
    return true;
  }
}

/**
 * Track failed secret code attempt for brute-force protection
 */
export async function recordFailedLogin(email: string) {
  if (!isSupabaseConfigured) return;

  const deviceInfo = getDeviceInfo();
  try {
    await supabase.from('failed_login_logs').insert({
      email,
      device_info: {
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device_name: deviceInfo.deviceName,
      },
    });
  } catch (err) {
    console.error('Failed to log login attempt:', err);
  }
}

/**
 * Check recent failed attempts within last 15 minutes
 */
export async function getRecentFailedAttemptsCount(email: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  try {
    // 1. Try secure RPC function
    const { data: rpcCount, error: rpcError } = await supabase.rpc('get_recent_failed_attempts', {
      check_email: email,
    });
    if (!rpcError && typeof rpcCount === 'number') {
      return rpcCount;
    }

    // 2. Fallback direct count query
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from('failed_login_logs')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', fifteenMinutesAgo);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}


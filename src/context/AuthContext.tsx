import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  registerCurrentSession,
  isCurrentSessionValid,
  recordFailedLogin,
  getRecentFailedAttemptsCount,
} from '../lib/supabase';
import type { UserProfile } from '../types';
import { getOrCreateSessionToken, resetSessionToken } from '../lib/deviceDetection';
import { authenticateWithPasskey, registerDevicePasskey } from '../lib/webauthn';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  revocationMessage: string | null;
  clearRevocationMessage: () => void;
  signInWithSecretCode: (email: string, secretCode: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithSecretCode: (email: string, secretCode: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithPasskey: (email: string) => Promise<{ success: boolean; error?: string }>;
  registerPasskeyForCurrentDevice: () => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateSecretCode: (newCode: string) => Promise<{ success: boolean; error?: string }>;
  updateDisplayName: (name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [revocationMessage, setRevocationMessage] = useState<string | null>(null);

  const clearRevocationMessage = () => setRevocationMessage(null);

  // Fetch or create profile
  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Could not load profile:', error.message);
        return;
      }

      if (data) {
        setProfile(data as UserProfile);
      } else if (email) {
        const newProfile = {
          id: userId,
          email,
          display_name: email.split('@')[0],
          secret_code_enabled: true,
          passkey_enabled: false,
        };
        const { data: created } = await supabase.from('profiles').insert(newProfile).select().single();
        if (created) setProfile(created as UserProfile);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  }, []);

  // Initialize auth
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let initialised = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      initialised = true;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
        registerCurrentSession(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // During the very first INITIAL_SESSION event, getSession() above may already
      // be handling setup.  After that, every event (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED,
      // etc.) should update state and clear the loading spinner so ProtectedRoute
      // sees the new user before it decides to redirect.
      if (!initialised && _event === 'INITIAL_SESSION') {
        // getSession promise will handle this – skip to avoid double-update
        return;
      }
      // For SIGNED_IN and every subsequent event, set loading true momentarily
      // so ProtectedRoute holds while state updates propagate.
      setLoading(true);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
        registerCurrentSession(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Real-time Session Revocation Enforcement & Heartbeat
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    const currentToken = getOrCreateSessionToken();

    const interval = setInterval(async () => {
      const valid = await isCurrentSessionValid(user.id);
      if (!valid) {
        setRevocationMessage('Your session on this device was terminated remotely from another device.');
        resetSessionToken();
        await supabase.auth.signOut();
      }
    }, 15000);

    const channel = supabase
      .channel(`public:user_sessions:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          const updated = payload.new as { session_token: string; is_active: boolean };
          if (updated && updated.session_token === currentToken && !updated.is_active) {
            setRevocationMessage('This device session was just revoked by you from another device.');
            resetSessionToken();
            supabase.auth.signOut();
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Sign in with Secret Code
  const signInWithSecretCode = async (email: string, secretCode: string) => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase credentials are not configured yet. Please configure your .env file.',
      };
    }

    const recentAttempts = await getRecentFailedAttemptsCount(email);
    if (recentAttempts >= 5) {
      return {
        success: false,
        error: 'Too many incorrect attempts detected. For your security, this account is temporarily locked for 15 minutes. Try again later or use account recovery.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: secretCode,
      });

      if (error) {
        await recordFailedLogin(email);
        return { success: false, error: error.message };
      }

      if (data.user) {
        await registerCurrentSession(data.user.id);
      }

      return { success: true };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  // Sign up with Secret Code
  const signUpWithSecretCode = async (email: string, secretCode: string, displayName?: string) => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase credentials are not configured yet. Please configure your .env file.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: secretCode,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await registerCurrentSession(data.user.id);
      }

      return { success: true };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  // Sign in with Passkey (WebAuthn)
  const signInWithPasskey = async (email: string) => {
    const res = await authenticateWithPasskey(email);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    return {
      success: true,
    };
  };

  // Register Passkey
  const registerPasskeyForCurrentDevice = async () => {
    if (!user) return { success: false, error: 'Must be logged in to register passkey' };
    const res = await registerDevicePasskey(user.email || '', user.id);
    if (res.success && isSupabaseConfigured) {
      await supabase
        .from('profiles')
        .update({ passkey_enabled: true })
        .eq('id', user.id);
      await fetchProfile(user.id);
    }
    return res;
  };

  // Request Password Reset / Recovery
  const requestPasswordReset = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured yet.' };
    }
    try {
      const redirectTo = `${window.location.origin}/recovery`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message };
    }
  };

  // Update Secret Code
  const updateSecretCode = async (newCode: string) => {
    if (!isSupabaseConfigured) return { success: false, error: 'Supabase is not configured' };
    try {
      const { error } = await supabase.auth.updateUser({ password: newCode });
      if (error) return { success: false, error: error.message };

      if (user) {
        await supabase.from('security_events').insert({
          user_id: user.id,
          event_type: 'password_changed',
          title: 'Secret Code Changed',
          message: 'The secret code for your My Photos vault was updated successfully.',
          severity: 'info',
        });
      }
      return { success: true };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message };
    }
  };

  // Update Display Name
  const updateDisplayName = async (name: string) => {
    if (!user || !isSupabaseConfigured) return { success: false, error: 'Not authenticated' };
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: name, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) return { success: false, error: error.message };
      await fetchProfile(user.id);
      return { success: true };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message };
    }
  };

  // Sign out
  const signOut = async () => {
    resetSessionToken();
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // Delete account completely
  const deleteAccount = async () => {
    if (!user || !isSupabaseConfigured) return { success: false, error: 'Not authenticated' };
    try {
      await supabase.from('photos').delete().eq('user_id', user.id);
      await supabase.from('albums').delete().eq('user_id', user.id);
      await supabase.from('user_sessions').delete().eq('user_id', user.id);
      await supabase.from('security_events').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      await signOut();
      return { success: true };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        revocationMessage,
        clearRevocationMessage,
        signInWithSecretCode,
        signUpWithSecretCode,
        signInWithPasskey,
        registerPasskeyForCurrentDevice,
        requestPasswordReset,
        updateSecretCode,
        updateDisplayName,
        signOut,
        deleteAccount,
        refreshProfile: () => (user ? fetchProfile(user.id) : Promise.resolve()),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SecurityEvent } from '../types';
import { useAuth } from './AuthContext';

interface AlertsContextType {
  alerts: SecurityEvent[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  refreshAlerts: () => Promise<void>;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const AlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setAlerts([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.warn('Error fetching alerts:', error.message);
        return;
      }

      if (data) {
        setAlerts(data as SecurityEvent[]);
      }
    } catch (err) {
      console.error('Failed to load security alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();

    if (!user || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`public:security_events:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          const newAlert = payload.new as SecurityEvent;
          setAlerts(prev => [newAlert, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAlerts]);

  const markAsRead = async (id: string) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, is_read: true } : a)));
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('security_events').update({ is_read: true }).eq('id', id);
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const markAllAsRead = async () => {
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    if (!user || !isSupabaseConfigured) return;
    try {
      await supabase
        .from('security_events')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    } catch (err) {
      console.error('Error marking all alerts as read:', err);
    }
  };

  const deleteAlert = async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('security_events').delete().eq('id', id);
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteAlert,
        refreshAlerts: fetchAlerts,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) throw new Error('useAlerts must be used within an AlertsProvider');
  return context;
};

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  LogOut,
  Trash2,
  RefreshCw,
  CheckCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertsContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserSession } from '../types';
import { getOrCreateSessionToken } from '../lib/deviceDetection';

export const SecurityDevicesPage: React.FC = () => {
  const { user } = useAuth();
  const { alerts, markAsRead, markAllAsRead, deleteAlert, refreshAlerts } = useAlerts();

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [failedAttemptsCount, setFailedAttemptsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [confirmRevokeSession, setConfirmRevokeSession] = useState<UserSession | null>(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const currentToken = getOrCreateSessionToken();

  const fetchSessions = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const enriched: UserSession[] = data.map((s) => ({
          ...s,
          is_current: s.session_token === currentToken,
        }));
        setSessions(enriched);
      }

      if (user.email) {
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from('failed_login_logs')
          .select('*', { count: 'exact', head: true })
          .eq('email', user.email)
          .gte('created_at', fifteenMinsAgo);

        setFailedAttemptsCount(count || 0);
      }
    } catch (err) {
      console.error('Error fetching security sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentToken]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSingle = async (sessionToRevoke: UserSession) => {
    if (!user || !isSupabaseConfigured) return;

    try {
      setRevokingSessionId(sessionToRevoke.id);
      
      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
        })
        .eq('id', sessionToRevoke.id)
        .eq('user_id', user.id);

      if (error) throw error;

      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'session_revoked',
        title: 'Device Access Revoked',
        message: `Access was revoked for ${sessionToRevoke.device_name}. That device will be forced to re-authenticate immediately.`,
        severity: 'info',
        device_info: {
          device_name: sessionToRevoke.device_name,
          browser: sessionToRevoke.browser,
          os: sessionToRevoke.os,
        },
      });

      setActionSuccess(`Access revoked for ${sessionToRevoke.device_name}`);
      setConfirmRevokeSession(null);
      await fetchSessions();
      await refreshAlerts();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Could not revoke session: ${error.message}`);
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleSignOutAllOthers = async () => {
    if (!user || !isSupabaseConfigured) return;

    try {
      setIsRevokingAll(true);

      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .neq('session_token', currentToken)
        .eq('is_active', true);

      if (error) throw error;

      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'session_revoked',
        title: 'Signed Out All Other Devices',
        message: 'All other active sessions on other phones and computers have been invalidated.',
        severity: 'info',
      });

      setActionSuccess('All other devices have been disconnected.');
      setConfirmRevokeAll(false);
      await fetchSessions();
      await refreshAlerts();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Could not sign out devices: ${error.message}`);
    } finally {
      setIsRevokingAll(false);
    }
  };

  const currentSession = sessions.find((s) => s.is_current);
  const otherActiveSessions = sessions.filter((s) => !s.is_current && s.is_active);
  const revokedSessions = sessions.filter((s) => !s.is_active);

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType === 'mobile') return <Smartphone className="w-5 h-5 text-caramel-600" />;
    if (deviceType === 'tablet') return <Smartphone className="w-5 h-5 text-caramel-600" />;
    return <Laptop className="w-5 h-5 text-caramel-600" />;
  };

  return (
    <div className="flex-1 bg-cream-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="bg-cream-card rounded-2xl shadow-sm border border-cream-300 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-brand-900 text-caramel-400 flex items-center justify-center shadow-md border border-caramel-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950">
                Security & Devices
              </h1>
              <p className="text-xs text-brand-600">
                Instagram-style in-account audit, active sessions, and instant device revocation.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              fetchSessions();
              refreshAlerts();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cream-100 hover:bg-cream-200 text-brand-900 border border-cream-300 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit</span>
          </button>
        </div>

        {/* Action feedback message */}
        {actionSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-xs font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Brute-Force & Rate Limiting Status Bar */}
        {failedAttemptsCount > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-amber-900">
                Recent Failed Login Attempts Detected ({failedAttemptsCount})
              </span>
              <p className="text-amber-800 mt-0.5">
                We observed {failedAttemptsCount} incorrect secret-code attempt(s) in the last 15 minutes. Brute-force protection is active. If 5 consecutive failures occur, login is temporarily locked.
              </p>
            </div>
          </div>
        )}

        {/* Section 1: In-Account Security Alerts (Instagram-style) */}
        <div className="bg-cream-card rounded-2xl border border-cream-300 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-cream-200 bg-cream-100/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-caramel-600" />
              <h2 className="font-serif font-bold text-base text-brand-950">
                In-Account Security Events
              </h2>
            </div>
            {alerts.some((a) => !a.is_read) && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-caramel-600 hover:text-caramel-700 flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-cream-100 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-brand-600">
                No security alerts recorded. Your account has no suspicious activity.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    !alert.is_read ? 'bg-amber-50/70 border-l-4 border-caramel-500' : 'hover:bg-cream-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center shrink-0 mt-0.5">
                      {alert.event_type === 'new_device_login' ? (
                        <Smartphone className="w-4 h-4 text-caramel-700" />
                      ) : alert.severity === 'critical' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Shield className="w-4 h-4 text-brand-700" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-brand-950">{alert.title}</span>
                        {!alert.is_read && (
                          <span className="bg-caramel-500 text-cream-50 text-[10px] px-1.5 py-0.2 rounded font-bold">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-700 mt-0.5 leading-relaxed">
                        {alert.message}
                      </p>
                      <span className="text-[10px] text-brand-500 block mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {!alert.is_read && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="text-xs text-brand-600 hover:text-brand-950 font-medium px-2 py-1 rounded hover:bg-cream-200 transition cursor-pointer"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-1.5 text-brand-400 hover:text-rose-600 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 2: Current Device Session */}
        <div className="bg-cream-card rounded-2xl border border-cream-300 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-base text-brand-950 flex items-center gap-2">
              <span>This Device</span>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Now (Current Session)</span>
              </span>
            </h2>
          </div>

          {currentSession ? (
            <div className="flex items-center justify-between p-4 bg-cream-100/70 rounded-xl border border-cream-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-caramel-100 text-caramel-700 flex items-center justify-center">
                  {getDeviceIcon(currentSession.device_type)}
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-brand-950">
                    {currentSession.device_name}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-brand-600 mt-0.5">
                    <span>OS: {currentSession.os || 'Current System'}</span>
                    <span>•</span>
                    <span>Browser: {currentSession.browser || 'Web Browser'}</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-brand-500 font-mono hidden sm:inline">
                Token: ...{currentSession.session_token.slice(-8)}
              </span>
            </div>
          ) : (
            <p className="text-xs text-brand-600">
              Current device session is active.
            </p>
          )}
        </div>

        {/* Section 3: Other Active Sessions & Revocation */}
        <div className="bg-cream-card rounded-2xl border border-cream-300 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif font-bold text-base text-brand-950">
                Other Active Sessions
              </h2>
              <p className="text-xs text-brand-600">
                Phones, tablets, or computers currently signed into your My Photos vault.
              </p>
            </div>

            {otherActiveSessions.length > 0 && (
              <button
                onClick={() => setConfirmRevokeAll(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Sign Out All Other Devices</span>
              </button>
            )}
          </div>

          {otherActiveSessions.length === 0 ? (
            <div className="p-8 text-center bg-cream-100/50 rounded-xl border border-cream-200 text-xs text-brand-600 space-y-1">
              <CheckCircle2 className="w-6 h-6 text-caramel-600 mx-auto mb-1.5" />
              <p className="font-semibold text-brand-900">No other devices are currently signed in.</p>
              <p className="text-brand-500">Only this current device has access to your photo vault.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {otherActiveSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 bg-cream-100/70 rounded-xl border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cream-200 text-caramel-700 flex items-center justify-center shrink-0">
                      {getDeviceIcon(session.device_type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-brand-950">
                        {session.device_name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-brand-600 mt-0.5">
                        <span>{session.browser}</span>
                        <span>•</span>
                        <span>{session.os}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-caramel-500" />
                          Last active: {new Date(session.last_active_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setConfirmRevokeSession(session)}
                    disabled={revokingSessionId === session.id}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cream-50 hover:bg-rose-50 hover:text-rose-700 text-brand-800 border border-cream-300 transition flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
                  >
                    {revokingSessionId === session.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-caramel-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>Revoke Access</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Previously Revoked Sessions History */}
        {revokedSessions.length > 0 && (
          <div className="bg-cream-card rounded-2xl border border-cream-300 shadow-sm p-6 space-y-4">
            <h3 className="font-serif font-bold text-sm text-brand-900">
              Revoked Sessions History
            </h3>
            <div className="space-y-2">
              {revokedSessions.slice(0, 5).map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 bg-cream-100/40 rounded-lg border border-cream-200 text-xs flex items-center justify-between text-brand-600"
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-brand-400" />
                    <span className="font-medium text-brand-800">{rev.device_name}</span>
                  </div>
                  <span className="text-[11px] text-brand-500">
                    Revoked: {rev.revoked_at ? new Date(rev.revoked_at).toLocaleDateString() : 'Previously'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {confirmRevokeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-cream-50 text-brand-950 p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-cream-300">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <LogOut className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-base text-brand-950 mb-1">
              Revoke Access for Device?
            </h4>
            <p className="text-xs text-brand-700 leading-relaxed mb-5">
              Revoking access for <strong>{confirmRevokeSession.device_name}</strong> will terminate its active session immediately. The user on that device will be forced to authenticate again.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmRevokeSession(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-brand-800 hover:bg-cream-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevokeSingle(confirmRevokeSession)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
              >
                Yes, Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRevokeAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-cream-50 text-brand-950 p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-cream-300">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-base text-brand-950 mb-1">
              Sign Out All Other Devices?
            </h4>
            <p className="text-xs text-brand-700 leading-relaxed mb-5">
              All other phones, tablets, and computers connected to your vault will be immediately signed out. Only this current device will stay logged in.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmRevokeAll(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-brand-800 hover:bg-cream-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOutAllOthers}
                disabled={isRevokingAll}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                {isRevokingAll ? 'Signing Out...' : 'Sign Out All Others'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

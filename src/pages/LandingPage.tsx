import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  ShieldCheck,
  Smartphone,
  EyeOff,
  KeyRound,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onOpenAuth: (tab: 'signin' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-cream-50">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-cream-200">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-caramel-200/30 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-caramel-100/80 border border-caramel-300/60 text-caramel-800 text-xs font-semibold tracking-wide uppercase shadow-xs">
            <Lock className="w-3.5 h-3.5 text-caramel-600" />
            <span>Private Personal Photo Vault</span>
          </div>

          <div className="space-y-1">
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-brand-950 leading-tight">
              My Photos
            </h1>
            <p className="font-sans text-sm sm:text-base tracking-[0.3em] uppercase font-semibold text-caramel-600">
              Hidden Pics
            </p>
          </div>

          <p className="text-lg sm:text-xl text-brand-700 max-w-2xl mx-auto font-normal leading-relaxed pt-2">
            “Your private space for precious memories.”
          </p>

          <p className="text-sm text-brand-600 max-w-xl mx-auto">
            A zero-compromise personal sanctuary designed with strict per-user database isolation, in-account device notifications, and zero public photo links.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/vault')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold bg-brand-900 hover:bg-brand-850 text-cream-50 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <span>Enter Your Photo Vault</span>
                <ArrowRight className="w-4 h-4 text-caramel-400" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-brand-900 to-brand-800 hover:from-brand-850 hover:to-brand-750 text-cream-50 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer border border-brand-700"
                >
                  <span>Create Private Vault</span>
                  <ArrowRight className="w-4 h-4 text-caramel-400" />
                </button>
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold bg-cream-100 hover:bg-cream-200 text-brand-950 border border-cream-300 transition-all text-sm cursor-pointer"
                >
                  Unlock with Secret Code
                </button>
              </>
            )}
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-brand-600">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-caramel-600" />
              <span>Multi-User RLS Isolation</span>
            </span>
            <span className="flex items-center gap-1.5">
              <EyeOff className="w-4 h-4 text-caramel-600" />
              <span>No Public Photo URLs</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-caramel-600" />
              <span>In-Account Login Alerts</span>
            </span>
          </div>

        </div>
      </section>

      {/* Website Design Preview (Artistic Mockup, Strictly No User Photos) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center mb-10 space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950">
            Designed for Serenity & Discretion
          </h2>
          <p className="text-xs sm:text-sm text-brand-600 max-w-md mx-auto">
            Experience an interface crafted in warm cream and chocolate tones, free from clutter and social noise.
          </p>
        </div>

        <div className="bg-cream-card rounded-2xl sm:rounded-3xl shadow-xl border border-cream-300 overflow-hidden">
          <div className="bg-brand-900 px-4 py-3 flex items-center justify-between border-b border-brand-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="bg-brand-950/70 text-cream-300 text-[11px] font-mono px-6 py-1 rounded-full border border-caramel-500/30 flex items-center gap-2">
              <Lock className="w-3 h-3 text-caramel-400" />
              <span>myphotos.vault/protected-session</span>
            </div>
            <div className="w-12" />
          </div>

          <div className="p-6 sm:p-8 bg-cream-50 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
              <div>
                <h3 className="font-serif font-bold text-xl text-brand-950">Protected Vault</h3>
                <p className="text-xs text-brand-600">Showing 4 encrypted albums • 0 shared links</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-caramel-100 text-caramel-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-caramel-300/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-caramel-600" />
                  <span>Session Protected</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'Family Holidays', count: '42 photos', gradient: 'from-amber-800 to-amber-950' },
                { title: 'Personal Projects', count: '18 photos', gradient: 'from-stone-800 to-stone-950' },
                { title: 'Travel 2024', count: '65 photos', gradient: 'from-yellow-900 to-stone-900' },
                { title: 'Private Notes', count: '9 items', gradient: 'from-stone-900 to-neutral-950' },
              ].map((album, idx) => (
                <div
                  key={idx}
                  className="bg-cream-100 rounded-xl p-3 border border-cream-200 shadow-xs flex flex-col justify-between h-40 group cursor-default"
                >
                  <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${album.gradient} flex items-center justify-center text-cream-200/40 relative overflow-hidden`}>
                    <Lock className="w-6 h-6" />
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <div>
                    <h4 className="font-serif font-semibold text-xs text-brand-950 truncate">{album.title}</h4>
                    <p className="text-[10px] text-brand-500">{album.count}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-amber-50/80 border border-caramel-400/40 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-caramel-100 text-caramel-700 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-brand-950">In-Account Security Alert</span>
                  <span className="text-[10px] text-brand-500">Active protection</span>
                </div>
                <p className="text-brand-700 mt-0.5">
                  “New login detected from Safari on iPhone 15.” Manage sessions instantly without relying on external emails.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-16 bg-cream-100 border-t border-cream-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950">
              Security Built Like a Real Safe
            </h2>
            <p className="text-xs sm:text-sm text-brand-600">
              Every detail is engineered to protect your personal life from prying eyes and unauthorized devices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-cream-50 border border-cream-300 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-caramel-100 text-caramel-700 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-brand-950">
                Secret-Code & Passkeys
              </h3>
              <p className="text-xs text-brand-700 leading-relaxed">
                Sign in with a robust hashed secret code or passwordless WebAuthn biometric passkeys. Plain text is never stored or exposed anywhere in frontend code.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cream-50 border border-cream-300 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-caramel-100 text-caramel-700 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-brand-950">
                Instagram-Style Device Alerts
              </h3>
              <p className="text-xs text-brand-700 leading-relaxed">
                Alerts appear directly inside your account when a new device connects. Instantly view active devices and revoke unauthorized sessions with a single tap.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cream-50 border border-cream-300 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-caramel-100 text-caramel-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-brand-950">
                Multi-User RLS Isolation
              </h3>
              <p className="text-xs text-brand-700 leading-relaxed">
                Every photo belongs strictly to its owner. Even if a user alters a URL or API parameter, Supabase Row-Level Security refuses access automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

import React from 'react';
import { Lock, ShieldCheck, Key, EyeOff } from 'lucide-react';

const currentYear = 2026;

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-950 text-cream-200 border-t border-brand-900 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-brand-900/80">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-caramel-500 flex items-center justify-center text-brand-950 font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-xl font-bold text-cream-50 block leading-tight">My Photos</span>
                <span className="text-[10px] tracking-[0.2em] uppercase font-sans font-semibold text-caramel-400">Hidden Pics</span>
              </div>
            </div>
            <p className="text-xs text-cream-300 max-w-sm leading-relaxed">
              Your private space for precious memories. Built with modern cryptographic guarantees, per-user isolation, and in-account device security.
            </p>
          </div>

          {/* Privacy & Security Architecture */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-caramel-400 mb-3">
              Privacy Guarantees
            </h4>
            <ul className="space-y-2 text-xs text-cream-300">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-caramel-400" />
                <span>Row Level Security (RLS)</span>
              </li>
              <li className="flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-caramel-400" />
                <span>Private Storage Buckets</span>
              </li>
              <li className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-caramel-400" />
                <span>Zero Public URL Exposure</span>
              </li>
            </ul>
          </div>

          {/* Account Security */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-caramel-400 mb-3">
              Account Defense
            </h4>
            <ul className="space-y-2 text-xs text-cream-300">
              <li>In-Account Device Alerts</li>
              <li>Selective Session Revocation</li>
              <li>Brute-Force Rate Limiting</li>
              <li>WebAuthn Passkey Ready</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-cream-400 gap-4">
          <p>© {currentYear} My Photos — Hidden Pics. All photos are private and user-isolated.</p>
          <div className="flex items-center gap-4 text-[11px] text-cream-400">
            <span>Encrypted at Rest</span>
            <span>•</span>
            <span>Single-User Vaults</span>
            <span>•</span>
            <span>Zero Tracking</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export const ConfigBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isSupabaseConfigured) return null;

  const copyEnv = () => {
    navigator.clipboard.writeText(`VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-brand-900 via-brand-850 to-brand-900 text-cream-100 border-b border-caramel-500/30 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-caramel-400 shrink-0" />
          <span>
            <strong className="text-caramel-300 font-semibold">Backend Setup Notice:</strong> Supabase credentials are not connected yet. Add your project credentials to <code className="bg-brand-950/70 px-1.5 py-0.5 rounded text-caramel-200 border border-caramel-500/20">.env</code> to enable live photo storage & real-time sessions.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-caramel-400 hover:text-caramel-300 transition-colors font-medium cursor-pointer"
          >
            <span>{expanded ? 'Hide Setup Guide' : 'Setup Guide (3 Steps)'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto px-4 py-3 border-t border-caramel-500/20 bg-brand-950/90 text-cream-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-brand-900/60 border border-caramel-500/20">
              <span className="font-semibold text-caramel-400 block mb-1">Step 1: Create Supabase Project</span>
              <p className="text-cream-300 mb-2">Create a free database project on Supabase and navigate to Project Settings &rarr; API.</p>
              <a
                href="https://database.new"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-caramel-300 hover:underline"
              >
                Go to Supabase <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3 rounded-lg bg-brand-900/60 border border-caramel-500/20">
              <span className="font-semibold text-caramel-400 block mb-1">Step 2: Run SQL Migration</span>
              <p className="text-cream-300 mb-2">Open Supabase SQL Editor and execute the script inside:</p>
              <code className="bg-brand-950 px-2 py-1 rounded text-caramel-200 block text-[11px] truncate">
                supabase/migrations/001_initial_schema.sql
              </code>
            </div>

            <div className="p-3 rounded-lg bg-brand-900/60 border border-caramel-500/20">
              <span className="font-semibold text-caramel-400 block mb-1">Step 3: Set Your .env File</span>
              <p className="text-cream-300 mb-2">Copy <code className="text-caramel-300">.env.example</code> to <code className="text-caramel-300">.env</code> and paste your Project URL and Anon Key.</p>
              <button
                onClick={copyEnv}
                className="inline-flex items-center gap-1 bg-caramel-500/20 hover:bg-caramel-500/30 text-caramel-300 px-2 py-1 rounded text-xs transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy env format'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

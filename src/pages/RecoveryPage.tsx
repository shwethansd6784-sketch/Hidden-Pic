import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RecoveryPage: React.FC = () => {
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { updateSecretCode } = useAuth();
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCode.length < 6) {
      setErrorMessage('Secret code must be at least 6 characters long.');
      return;
    }
    if (newCode !== confirmCode) {
      setErrorMessage('Secret codes do not match.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await updateSecretCode(newCode);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update secret code.');
      }
      setSuccess(true);
      setTimeout(() => {
        navigate('/vault');
      }, 2000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cream-50">
      <div className="max-w-md w-full space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-brand-900 text-caramel-400 flex items-center justify-center mx-auto shadow-xl border border-caramel-500/30">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-950">
            Reset Secret Code
          </h2>
          <p className="text-xs text-brand-600 max-w-xs mx-auto">
            Choose a new secret code for your My Photos vault. All your existing private photos will remain safe and intact.
          </p>
        </div>

        <div className="bg-cream-card rounded-2xl shadow-xl border border-cream-300 p-6 sm:p-8 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {success ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-semibold text-sm">Secret Code Updated Successfully!</p>
              <p className="text-brand-600">Redirecting to your private vault...</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-900 mb-1">
                  New Secret Code <span className="text-caramel-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCode ? 'text' : 'password'}
                    required
                    placeholder="Min. 6 alphanumeric characters"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-cream-100/60 border border-cream-300 rounded-xl text-sm text-brand-950 focus:bg-cream-50 focus:ring-2 focus:ring-caramel-500 focus:outline-none transition font-mono"
                  />
                  <KeyRound className="w-4 h-4 text-brand-500 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-3 top-3 text-brand-500 hover:text-brand-800 transition"
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-900 mb-1">
                  Confirm New Secret Code <span className="text-caramel-600">*</span>
                </label>
                <input
                  type={showCode ? 'text' : 'password'}
                  required
                  placeholder="Re-enter your new secret code"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream-100/60 border border-cream-300 rounded-xl text-sm text-brand-950 focus:bg-cream-50 focus:ring-2 focus:ring-caramel-500 focus:outline-none transition font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-semibold bg-brand-900 hover:bg-brand-850 text-cream-50 shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-caramel-400" />
                    <span>Updating code...</span>
                  </>
                ) : (
                  <span>Save New Secret Code</span>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

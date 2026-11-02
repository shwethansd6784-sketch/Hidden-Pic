import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  KeyRound,
  Fingerprint,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isWebAuthnSupported, isPlatformAuthenticatorAvailable } from '../lib/webauthn';

interface AuthPageProps {
  initialTab?: 'signin' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialTab = 'signin' }) => {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>(initialTab);
  const [authMethod, setAuthMethod] = useState<'secret_code' | 'passkey'>('secret_code');
  const [email, setEmail] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passkeySupported, setPasskeySupported] = useState<boolean | null>(null);

  const { signInWithSecretCode, signUpWithSecretCode, signInWithPasskey, requestPasswordReset, user } = useAuth();
  const navigate = useNavigate();

  // Navigate to vault as soon as the auth state confirms a logged-in user.
  // This fires whether the user was already logged in OR just signed in.
  useEffect(() => {
    if (user) {
      navigate('/vault', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    async function checkSupport() {
      const supported = await isWebAuthnSupported();
      const platformAvail = await isPlatformAuthenticatorAvailable();
      setPasskeySupported(supported && platformAvail);
    }
    checkSupport();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (tab === 'forgot') {
        const res = await requestPasswordReset(email.trim());
        if (!res.success) {
          throw new Error(res.error || 'Failed to send recovery link.');
        }
        setSuccessMessage('Recovery link has been sent to your email. Check your inbox to set a new secret code.');
        setIsLoading(false);
        return;
      }

      if (authMethod === 'passkey') {
        const res = await signInWithPasskey(email.trim());
        if (!res.success) {
          throw new Error(res.error || 'Passkey verification failed.');
        }
        // Vault navigation happens automatically via the useEffect watching `user`
        setSuccessMessage('Passkey verified! Opening your vault…');
      } else {
        if (tab === 'signin') {
          const res = await signInWithSecretCode(email.trim(), secretCode);
          if (!res.success) {
            throw new Error(res.error || 'Incorrect email or secret code.');
          }
          // Do NOT navigate here — wait for onAuthStateChange to set `user`,
          // then the useEffect above will navigate automatically.
          setSuccessMessage('Credentials accepted! Opening your vault…');
        } else {
          if (secretCode.length < 6) {
            throw new Error('Secret code must be at least 6 characters for security.');
          }
          const res = await signUpWithSecretCode(email.trim(), secretCode, displayName.trim());
          if (!res.success) {
            throw new Error(res.error || 'Registration failed.');
          }
          // Same — let onAuthStateChange → useEffect handle navigation
          setSuccessMessage('Vault created! Signing you in…');
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message);
      setIsLoading(false);
    }
    // Note: setIsLoading(false) is intentionally NOT called here on success —
    // the spinner stays while we wait for auth state to propagate and navigate.
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cream-50">
      <div className="max-w-md w-full space-y-6">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-900 to-brand-800 text-caramel-400 flex items-center justify-center mx-auto shadow-xl border border-caramel-500/30">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-950">
              My Photos
            </h2>
            <p className="text-xs font-sans font-semibold tracking-[0.25em] uppercase text-caramel-600">
              Hidden Pics
            </p>
          </div>
          <p className="text-xs text-brand-600 max-w-xs mx-auto">
            {tab === 'signin' && 'Enter your private credentials to access your photo vault.'}
            {tab === 'signup' && 'Create your independent private photo sanctuary.'}
            {tab === 'forgot' && 'Enter your registered email to receive an account recovery link.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-cream-card rounded-2xl shadow-xl border border-cream-300 p-6 sm:p-8 space-y-5">
          
          {tab !== 'forgot' && (
            <div className="grid grid-cols-2 p-1 bg-cream-100 rounded-xl border border-cream-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setTab('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  tab === 'signin'
                    ? 'bg-cream-50 text-brand-950 shadow-xs'
                    : 'text-brand-600 hover:text-brand-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  tab === 'signup'
                    ? 'bg-cream-50 text-brand-950 shadow-xs'
                    : 'text-brand-600 hover:text-brand-900'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {tab !== 'forgot' && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-brand-700 uppercase tracking-wider block">
                Sign-In Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMethod('secret_code')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    authMethod === 'secret_code'
                      ? 'border-caramel-500 bg-caramel-50/70 text-brand-950 shadow-xs'
                      : 'border-cream-300 bg-cream-50 text-brand-600 hover:bg-cream-100'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-caramel-600" />
                  <span>Secret Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMethod('passkey')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    authMethod === 'passkey'
                      ? 'border-caramel-500 bg-caramel-50/70 text-brand-950 shadow-xs'
                      : 'border-cream-300 bg-cream-50 text-brand-600 hover:bg-cream-100'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5 text-caramel-600" />
                  <span>Passkey (Biometric)</span>
                </button>
              </div>

              {authMethod === 'passkey' && (
                <div className="p-3 bg-cream-100/80 rounded-xl border border-cream-200 text-xs text-brand-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-brand-900">
                    <Sparkles className="w-3.5 h-3.5 text-caramel-600" />
                    <span>Hardware Passkey (WebAuthn)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Uses Face ID, Touch ID, or Windows Hello. Raw biometric data never leaves your hardware device.
                  </p>
                  {passkeySupported === false && (
                    <p className="text-[11px] text-amber-700 font-medium">
                      Note: Your current browser does not have a registered platform authenticator available.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-brand-900 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream-100/60 border border-cream-300 rounded-xl text-sm text-brand-950 focus:bg-cream-50 focus:ring-2 focus:ring-caramel-500 focus:outline-none transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-brand-900 mb-1">
                Verified Email Address <span className="text-caramel-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-cream-100/60 border border-cream-300 rounded-xl text-sm text-brand-950 focus:bg-cream-50 focus:ring-2 focus:ring-caramel-500 focus:outline-none transition"
                />
                <Mail className="w-4 h-4 text-brand-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {authMethod === 'secret_code' && tab !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-brand-900">
                    Secret Code <span className="text-caramel-600">*</span>
                  </label>
                  {tab === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('forgot');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-caramel-600 hover:text-caramel-700 font-medium cursor-pointer"
                    >
                      Forgot secret code?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showCode ? 'text' : 'password'}
                    required
                    placeholder={tab === 'signup' ? 'Min. 6 alphanumeric characters' : 'Enter your secret code'}
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
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
                <p className="text-[10px] text-brand-500 mt-1">
                  Never stored in plain text. Protected against brute-force attacks.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-brand-900 hover:bg-brand-850 text-cream-50 shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-caramel-400" />
                  <span>
                    {successMessage ? 'Opening your vault…' : 'Verifying credentials…'}
                  </span>
                </>
              ) : tab === 'forgot' ? (
                <>
                  <span>Send Recovery Link</span>
                  <ArrowRight className="w-4 h-4 text-caramel-400" />
                </>
              ) : tab === 'signup' ? (
                <>
                  <span>Create Protected Vault</span>
                  <ArrowRight className="w-4 h-4 text-caramel-400" />
                </>
              ) : authMethod === 'passkey' ? (
                <>
                  <Fingerprint className="w-4 h-4 text-caramel-400" />
                  <span>Verify Passkey & Enter</span>
                </>
              ) : (
                <>
                  <span>Unlock Photo Vault</span>
                  <ArrowRight className="w-4 h-4 text-caramel-400" />
                </>
              )}
            </button>
          </form>

          {tab === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setTab('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-caramel-600 hover:underline font-semibold cursor-pointer"
              >
                &larr; Back to Sign In
              </button>
            </div>
          )}

        </div>

        <p className="text-center text-[11px] text-brand-500">
          Tip: You can also reach this vault gate via the alternate path <code className="bg-cream-200 px-1 py-0.5 rounded text-brand-800">/a7k9m2x8</code>.
        </p>

      </div>
    </div>
  );
};

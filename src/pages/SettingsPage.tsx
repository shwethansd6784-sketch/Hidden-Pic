import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  KeyRound,
  Fingerprint,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isWebAuthnSupported, isPlatformAuthenticatorAvailable } from '../lib/webauthn';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const SettingsPage: React.FC = () => {
  const {
    user,
    profile,
    updateSecretCode,
    updateDisplayName,
    registerPasskeyForCurrentDevice,
    signOut,
    deleteAccount,
  } = useAuth();
  const navigate = useNavigate();

  // Name edit state
  const [displayName, setDisplayName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Secret code change state
  const [newCode, setNewCode] = useState('');
  const [confirmNewCode, setConfirmNewCode] = useState('');
  const [showCodes, setShowCodes] = useState(false);
  const [isUpdatingCode, setIsUpdatingCode] = useState(false);
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Passkey state
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [passkeyMessage, setPasskeyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Login methods toggles
  const [secretCodeEnabled, setSecretCodeEnabled] = useState(true);
  const [passkeyEnabled, setPasskeyEnabled] = useState(false);

  // Account deletion modal
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setSecretCodeEnabled(profile.secret_code_enabled ?? true);
      setPasskeyEnabled(profile.passkey_enabled ?? false);
    }
  }, [profile]);

  useEffect(() => {
    async function checkWebAuthn() {
      const supported = await isWebAuthnSupported();
      const platformAvail = await isPlatformAuthenticatorAvailable();
      setPasskeySupported(supported && platformAvail);
    }
    checkWebAuthn();
  }, []);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingName(true);
      const res = await updateDisplayName(displayName.trim());
      if (!res.success) throw new Error(res.error || 'Failed to update name');
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 2500);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);

    if (newCode.length < 6) {
      setCodeError('New secret code must be at least 6 characters.');
      return;
    }
    if (newCode !== confirmNewCode) {
      setCodeError('New secret codes do not match.');
      return;
    }

    try {
      setIsUpdatingCode(true);
      const res = await updateSecretCode(newCode);
      if (!res.success) throw new Error(res.error || 'Failed to update code.');
      setCodeSuccess(true);
      setNewCode('');
      setConfirmNewCode('');
      setTimeout(() => setCodeSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setCodeError(error.message);
    } finally {
      setIsUpdatingCode(false);
    }
  };

  const handleRegisterPasskey = async () => {
    try {
      setIsRegisteringPasskey(true);
      setPasskeyMessage(null);
      const res = await registerPasskeyForCurrentDevice();
      if (!res.success) {
        setPasskeyMessage({ type: 'error', text: res.error || 'Passkey setup could not be completed.' });
      } else {
        setPasskeyMessage({ type: 'success', text: 'Passkey registered for this device! You can now use biometric sign-in.' });
        setPasskeyEnabled(true);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setPasskeyMessage({ type: 'error', text: error.message });
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleToggleMethod = async (method: 'secret_code' | 'passkey') => {
    if (!user || !isSupabaseConfigured) return;

    let newSecret = secretCodeEnabled;
    let newPass = passkeyEnabled;

    if (method === 'secret_code') {
      newSecret = !secretCodeEnabled;
    } else {
      newPass = !passkeyEnabled;
    }

    if (!newSecret && !newPass) {
      alert('You must have at least one active login method enabled.');
      return;
    }

    setSecretCodeEnabled(newSecret);
    setPasskeyEnabled(newPass);

    try {
      await supabase
        .from('profiles')
        .update({
          secret_code_enabled: newSecret,
          passkey_enabled: newPass,
        })
        .eq('id', user.id);
    } catch (err) {
      console.error('Failed to update login methods:', err);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') {
      alert('Please type DELETE to confirm account removal.');
      return;
    }

    try {
      setIsDeletingAccount(true);
      const res = await deleteAccount();
      if (!res.success) throw new Error(res.error || 'Failed to delete account.');
      navigate('/');
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Deletion error: ${error.message}`);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="flex-1 bg-cream-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-cream-card rounded-2xl shadow-sm border border-cream-300 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-900 text-caramel-400 flex items-center justify-center shadow-md border border-caramel-500/20">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950">
                Profile & Settings
              </h1>
              <p className="text-xs text-brand-600">
                Manage your credentials, login methods, and account security.
              </p>
            </div>
          </div>

          <Link
            to="/vault/security"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cream-100 hover:bg-cream-200 text-brand-900 border border-cream-300 transition flex items-center gap-1.5"
          >
            <Shield className="w-4 h-4 text-caramel-600" />
            <span className="hidden sm:inline">Devices & Alerts</span>
          </Link>
        </div>

        {/* Section 1: User Profile Info */}
        <div className="bg-cream-card rounded-2xl border border-cream-300 shadow-sm p-6 space-y-5">
          <h2 className="font-serif font-bold text-base text-brand-950">
            Account Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-900 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-brand-700 font-mono cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-brand-500 absolute left-3 top-3" />
              </div>
              <p className="text-[10px] text-brand-500 mt-1">
                Your email is used exclusively for account recovery links.
              </p>
            </div>

            <form onSubmit={handleSaveName}>
              <label className="block text-xs font-semibold text-brand-900 mb-1">
                Display Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-cream-100/70 border border-cream-300 rounded-xl text-xs text-brand-950 focus:bg-cream-50 focus:ring-2 focus:ring-caramel-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isUpdatingName}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-900 hover:bg-brand-850 text-cream-50 transition cursor-pointer"
                >
                  {isUpdatingName ? 'Saving...' : nameSuccess ? 'Saved!' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Section 2: Manage Login Methods */}
        <div className="bg-cream-card rounded-2xl border border-cream-300 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="font-serif font-bold text-base text-brand-950">
              Active Login Methods
            </h2>
            <p className="text-xs text-brand-600">
              You can enable Secret Code, Passkey, or both. If both are enabled, either one is sufficient to sign in.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border transition-all ${
              secretCodeEnabled
                ? 'bg-cream-100/60 border-caramel-500/50'
                : 'bg-cream-100/30 border-cream-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-caramel-600" />
                  <span className="font-semibold text-xs text-brand-950">Secret Code</span>
                </div>
                <input
                  type="checkbox"
                  checked={secretCodeEnabled}
                  onChange={() => handleToggleMethod('secret_code')}
                  className="rounded text-caramel-600 focus:ring-caramel-500 w-4 h-4 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-brand-600 leading-relaxed">
                Hashed authentication code. Never stored in plain text or exposed in frontend code.
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${
              passkeyEnabled
                ? 'bg-cream-100/60 border-caramel-500/50'
                : 'bg-cream-100/30 border-cream-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-caramel-600" />
                  <span className="font-semibold text-xs text-brand-950">Biometric Passkey</span>
                </div>
                <input
                  type="checkbox"
                  checked={passkeyEnabled}
                  onChange={() => handleToggleMethod('passkey')}
                  className="rounded text-caramel-600 focus:ring-caramel-500 w-4 h-4 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-brand-600 leading-relaxed">
                Hardware-backed WebAuthn authentication via Face ID, Touch ID, or Windows Hello.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-brand-900">Add Passkey to Current Device</h4>
              <p className="text-[11px] text-brand-500">
                {passkeySupported
                  ? 'Your browser supports hardware biometric passkeys.'
                  : 'WebAuthn platform authenticator status: Checking or not configured.'}
              </p>
            </div>

            <button
              onClick={handleRegisterPasskey}
              disabled={isRegisteringPasskey}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-900 hover:bg-brand-850 text-cream-50 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              {isRegisteringPasskey ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-caramel-400" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-caramel-400" />
                  <span>Register This Phone/PC</span>
                </>
              )}
            </button>
          </div>

          {passkeyMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              passkeyMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {passkeyMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{passkeyMessage.text}</span>
            </div>
          )}
        </div>

        {/* Section 3: Change Secret Code */}
        <div className="bg-cream-card rounded-2xl border border-cream-300 shadow-sm p-6 space-y-4">
          <h2 className="font-serif font-bold text-base text-brand-950">
            Change Secret Code
          </h2>

          {codeError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{codeError}</span>
            </div>
          )}

          {codeSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Secret code successfully updated!</span>
            </div>
          )}

          <form onSubmit={handleChangeCode} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-brand-900 mb-1">
                New Secret Code (Min. 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showCodes ? 'text' : 'password'}
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2 bg-cream-100/70 border border-cream-300 rounded-xl text-xs text-brand-950 focus:bg-cream-50 focus:ring-2 focus:ring-caramel-500 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCodes(!showCodes)}
                  className="absolute right-3 top-2.5 text-brand-500 hover:text-brand-800"
                >
                  {showCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-900 mb-1">
                Confirm New Secret Code
              </label>
              <input
                type={showCodes ? 'text' : 'password'}
                required
                value={confirmNewCode}
                onChange={(e) => setConfirmNewCode(e.target.value)}
                className="w-full px-3.5 py-2 bg-cream-100/70 border border-cream-300 rounded-xl text-xs text-brand-950 focus:bg-cream-50 focus:ring-2 focus:ring-caramel-500 focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingCode}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-900 hover:bg-brand-850 text-cream-50 transition cursor-pointer"
            >
              {isUpdatingCode ? 'Updating...' : 'Update Secret Code'}
            </button>
          </form>
        </div>

        {/* Section 4: Sign Out & Danger Zone */}
        <div className="bg-cream-card rounded-2xl border border-cream-300 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-cream-200">
            <div>
              <h3 className="font-serif font-bold text-base text-brand-950">Session Sign Out</h3>
              <p className="text-xs text-brand-600">Sign out of this browser session.</p>
            </div>
            <button
              onClick={() => {
                signOut();
                navigate('/');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-cream-100 hover:bg-cream-200 text-brand-900 border border-cream-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-brand-700" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-rose-700 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Danger Zone: Delete Vault Account</span>
            </h3>
            <p className="text-xs text-brand-700 leading-relaxed max-w-xl">
              Permanently purges your account, all uploaded photographs, encrypted albums, device session registries, and security alert history. This action is irreversible.
            </p>

            <button
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition cursor-pointer"
            >
              Delete My Photos Account
            </button>
          </div>
        </div>

      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-cream-50 text-brand-950 p-6 rounded-2xl max-w-md w-full shadow-2xl border border-cream-300 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-lg text-brand-950">
              Permanently Delete Your Account?
            </h4>
            <p className="text-xs text-brand-700 leading-relaxed">
              Every photo in your private vault will be destroyed immediately. Type <strong>DELETE</strong> below to confirm.
            </p>

            <input
              type="text"
              placeholder="Type DELETE"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl text-xs text-brand-950 font-mono focus:bg-cream-50 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteConfirmationInput('');
                }}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-brand-800 hover:bg-cream-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationInput !== 'DELETE' || isDeletingAccount}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50 cursor-pointer"
              >
                {isDeletingAccount ? 'Deleting...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

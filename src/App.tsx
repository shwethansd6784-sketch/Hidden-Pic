import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertsProvider } from './context/AlertsContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ConfigBanner } from './components/ConfigBanner';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { VaultPage } from './pages/VaultPage';
import { AlbumsPage } from './pages/AlbumsPage';
import { SecurityDevicesPage } from './pages/SecurityDevicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { RecoveryPage } from './pages/RecoveryPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-cream-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-caramel-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-semibold text-brand-900 tracking-wider uppercase">
            Verifying Vault Access...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Main App Layout
const AppContent: React.FC = () => {
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-brand-900 font-sans selection:bg-caramel-200 selection:text-brand-950">
      <ConfigBanner />
      <Navbar onOpenAuth={(tab) => setAuthModalTab(tab)} />

      <main className="flex-1 flex flex-col">
        <Routes>
          {/* Main Landing Route */}
          <Route
            path="/"
            element={<LandingPage onOpenAuth={(tab) => setAuthModalTab(tab)} />}
          />

          {/* Special Discretion Path (Requirement 8): e.g. /a7k9m2x8 */}
          <Route
            path="/a7k9m2x8"
            element={<LandingPage onOpenAuth={(tab) => setAuthModalTab(tab)} />}
          />

          {/* Auth Routes */}
          <Route path="/login" element={<AuthPage initialTab="signin" />} />
          <Route path="/register" element={<AuthPage initialTab="signup" />} />
          <Route path="/recovery" element={<RecoveryPage />} />

          {/* Authenticated Vault Routes */}
          <Route
            path="/vault"
            element={
              <ProtectedRoute>
                <VaultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vault/albums"
            element={
              <ProtectedRoute>
                <AlbumsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vault/security"
            element={
              <ProtectedRoute>
                <SecurityDevicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vault/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {/* Quick Auth Modal Overlay when opened via Navbar or Landing buttons */}
      {authModalTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setAuthModalTab(null)}
              className="absolute -top-10 right-0 text-cream-200 hover:text-cream-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              Close [✕]
            </button>
            <AuthPage initialTab={authModalTab} />
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AlertsProvider>
          <AppContent />
        </AlertsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

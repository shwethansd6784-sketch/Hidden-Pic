import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Bell,
  Lock,
  LogOut,
  FolderLock,
  Images,
  Smartphone,
  CheckCheck,
  AlertTriangle,
  Menu,
  X,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertsContext';

interface NavbarProps {
  onOpenAuth?: (tab: 'signin' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { user, profile, signOut } = useAuth();
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useAlerts();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
        setAlertsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { name: 'Vault', path: '/vault', icon: Images },
    { name: 'Albums', path: '/vault/albums', icon: FolderLock },
    { name: 'Security & Devices', path: '/vault/security', icon: Shield, badge: unreadCount },
    { name: 'Settings', path: '/vault/settings', icon: UserIcon },
  ];

  return (
    <header className="bg-brand-900 text-cream-50 sticky top-0 z-40 border-b border-brand-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Name */}
          <Link to={user ? "/vault" : "/"} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-caramel-500 to-caramel-600 flex items-center justify-center text-brand-950 shadow-md transition-transform group-hover:scale-105 border border-caramel-400/40">
              <Lock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-tight text-cream-50 leading-none">
                My Photos
              </span>
              <span className="text-[11px] font-sans font-medium tracking-[0.25em] uppercase text-caramel-400 mt-1">
                Hidden Pics
              </span>
            </div>
          </Link>

          {/* Desktop Navigation for Authenticated Users */}
          {user ? (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-800 text-caramel-300 shadow-inner'
                        : 'text-cream-200 hover:text-cream-50 hover:bg-brand-850'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-rose-600 rounded-full animate-pulse">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Instagram-Style Security Notification Bell */}
                <div className="relative" ref={alertsRef}>
                  <button
                    onClick={() => setAlertsOpen(!alertsOpen)}
                    aria-label="Security notifications"
                    className="relative p-2.5 rounded-lg text-cream-200 hover:text-cream-50 hover:bg-brand-800 transition-colors focus:outline-none"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-caramel-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-white text-[9px] font-bold items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      </span>
                    )}
                  </button>

                  {/* Security Notifications Drawer / Dropdown */}
                  {alertsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-cream-50 text-brand-900 rounded-xl shadow-2xl border border-cream-300 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2.5 border-b border-cream-200 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-caramel-600" />
                          <span className="font-semibold text-sm text-brand-900">Security Alerts</span>
                          {unreadCount > 0 && (
                            <span className="bg-rose-100 text-rose-700 text-[11px] px-1.5 py-0.2 rounded font-medium">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-caramel-600 hover:text-caramel-700 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-cream-100">
                        {alerts.length === 0 ? (
                          <div className="py-8 px-4 text-center text-brand-600">
                            <Shield className="w-8 h-8 text-cream-300 mx-auto mb-2" />
                            <p className="text-xs font-medium">No security alerts at this time.</p>
                            <p className="text-[11px] text-brand-500 mt-0.5">Your private vault is protected.</p>
                          </div>
                        ) : (
                          alerts.slice(0, 6).map((alert) => (
                            <div
                              key={alert.id}
                              onClick={() => {
                                markAsRead(alert.id);
                                navigate('/vault/security');
                                setAlertsOpen(false);
                              }}
                              className={`p-3.5 hover:bg-cream-100 cursor-pointer transition-colors text-left flex gap-3 ${
                                !alert.is_read ? 'bg-amber-50/70 border-l-4 border-caramel-500' : ''
                              }`}
                            >
                              <div className="shrink-0 mt-0.5">
                                {alert.event_type === 'new_device_login' ? (
                                  <div className="w-7 h-7 rounded-full bg-caramel-100 text-caramel-700 flex items-center justify-center">
                                    <Smartphone className="w-3.5 h-3.5" />
                                  </div>
                                ) : alert.severity === 'critical' ? (
                                  <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-cream-200 text-brand-700 flex items-center justify-center">
                                    <Shield className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-brand-900 truncate">
                                  {alert.title}
                                </p>
                                <p className="text-[11px] text-brand-700 line-clamp-2 mt-0.5">
                                  {alert.message}
                                </p>
                                <span className="text-[10px] text-brand-500 block mt-1">
                                  {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(alert.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-2 border-t border-cream-200 bg-cream-100/50 text-center">
                        <Link
                          to="/vault/security"
                          onClick={() => setAlertsOpen(false)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-caramel-600 hover:text-caramel-700"
                        >
                          <span>Manage Devices & Security</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Pill */}
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-brand-800">
                  <div className="w-8 h-8 rounded-full bg-brand-800 border border-caramel-500/40 flex items-center justify-center text-xs font-semibold text-caramel-300">
                    {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-cream-200 max-w-[120px] truncate">
                    {profile?.display_name || user.email?.split('@')[0]}
                  </span>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  title="Sign Out of My Photos"
                  className="p-2 text-cream-300 hover:text-cream-50 hover:bg-brand-800 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-cream-200 hover:text-cream-50 hover:bg-brand-800 rounded-lg"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => (onOpenAuth ? onOpenAuth('signin') : navigate('/login'))}
                  className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-cream-100 hover:text-cream-50 hover:bg-brand-850 transition-colors cursor-pointer border border-brand-700/60"
                >
                  Sign In
                </button>
                <button
                  onClick={() => (onOpenAuth ? onOpenAuth('signup') : navigate('/register'))}
                  className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-r from-caramel-500 to-caramel-600 hover:from-caramel-400 hover:to-caramel-500 text-brand-950 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer for Authenticated Users */}
        {user && mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-brand-800 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-brand-800 text-caramel-300' : 'text-cream-200 hover:bg-brand-850'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold text-white bg-rose-600 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};

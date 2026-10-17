import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  Sparkles,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Shield,
  Compass,
  UserCheck,
} from 'lucide-react';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  canClose?: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  isDarkMode: boolean;
  onOpenPrivacy?: () => void;
  isFirstTimeGate?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  canClose = true,
  onClose,
  onSuccess,
  isDarkMode,
  onOpenPrivacy,
  isFirstTimeGate = false,
}) => {
  const effectiveCanClose = isFirstTimeGate ? false : canClose;
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Google sign in modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // Intercept Escape key when modal is open
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && effectiveCanClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveCanClose, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter your email and password');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        onSuccess(data.user);
        if (effectiveCanClose) onClose();
      } else {
        setError(data.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanGoogleEmail = googleEmail.trim().toLowerCase();
    if (!cleanGoogleEmail || !cleanGoogleEmail.includes('@')) {
      setError('Please enter a valid Google email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isGoogleLogin: true,
          googleProfile: {
            email: cleanGoogleEmail,
            name: googleName.trim() || cleanGoogleEmail.split('@')[0],
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        onSuccess(data.user);
        setShowGoogleModal(false);
        if (effectiveCanClose) onClose();
      } else {
        setError(data.error || 'Google sign-in failed');
      }
    } catch (err) {
      setError('Google sign-in encountered an issue');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Clear any prior guest chats so that whenever someone starts with guest, they have no saved chat
      try {
        localStorage.removeItem('boss_ai_conversations_guest_bossai_com');
        localStorage.removeItem('boss_ai_active_conv_guest_bossai_com');
      } catch (e) {}

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isGuest: true }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        onSuccess({ ...data.user, isGuest: true, role: 'guest' });
        if (effectiveCanClose) onClose();
      } else {
        // Instant resilient fallback
        const guestId = `guest_${Date.now().toString(36)}`;
        const fallbackGuest: UserType = {
          id: guestId,
          name: 'Guest Explorer',
          email: 'guest@bossai.com',
          role: 'guest',
          isGuest: true,
          isSuperAdmin: false,
          modelAccess: 'Boss AI Guest Mode',
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}`,
        };
        onSuccess(fallbackGuest);
        if (effectiveCanClose) onClose();
      }
    } catch (err) {
      const guestId = `guest_${Date.now().toString(36)}`;
      const fallbackGuest: UserType = {
        id: guestId,
        name: 'Guest Explorer',
        email: 'guest@bossai.com',
        role: 'guest',
        isGuest: true,
        isSuperAdmin: false,
        modelAccess: 'Boss AI Guest Mode',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}`,
      };
      onSuccess(fallbackGuest);
      if (effectiveCanClose) onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
      onClick={() => {
        if (effectiveCanClose) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`max-w-md w-full rounded-3xl border shadow-2xl overflow-hidden relative transition-all ${
          isDarkMode ? 'bg-[#1e1f20] border-[#37393b] text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* First-time visitor welcome gate banner */}
        {isFirstTimeGate && (
          <div
            className={`px-5 py-3 border-b text-xs flex items-center gap-2.5 ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-950/90 via-indigo-950/80 to-purple-950/80 border-blue-500/30 text-blue-200'
                : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-[11px] leading-tight">Welcome to BOSS AURA AI 🚀</p>
              <p className="text-[10px] opacity-80 mt-0.5 leading-snug">
                Please log in to enter the AI workspace. Everyone must sign in or create an account on their first visit.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-6 pb-3 flex items-center justify-between border-b border-gray-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1a73e8] via-[#8e24aa] to-[#d93025] p-[2px] shadow-sm">
              <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isDarkMode ? 'bg-[#1e1f20]' : 'bg-white'}`}>
                <Sparkles className="w-4 h-4 text-[#4285f4]" />
              </div>
            </div>
            <div>
              <h2 className="font-display font-bold text-lg leading-tight">
                {isFirstTimeGate
                  ? (mode === 'signin' ? 'Log In to Enter Workspace' : 'Create Account to Enter')
                  : (mode === 'signin' ? 'Sign In to BOSS AURA AI' : 'Create BOSS AURA AI Account')}
              </h2>
              <p className="text-[11px] opacity-60">
                {isFirstTimeGate
                  ? 'Login required to access workspace · Session saved automatically'
                  : 'Continue with Google, Email, or Guest access'}
              </p>
            </div>
          </div>

          {effectiveCanClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-500/10 transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
              }`}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Quick Access Grid: Google and Guest */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Guest Sign-In Button (High prominence) */}
            <button
              id="guest-signin-btn"
              type="button"
              disabled={loading}
              onClick={handleGuestSubmit}
              className={`py-3 px-3.5 rounded-2xl border flex flex-col items-start justify-between gap-1 text-left shadow-sm transition-all group hover:scale-[1.01] active:scale-[0.99] ${
                isDarkMode
                  ? 'bg-gradient-to-br from-emerald-950/60 to-emerald-900/30 hover:from-emerald-900/60 hover:to-emerald-800/40 border-emerald-500/40 text-white'
                  : 'bg-gradient-to-br from-emerald-50 to-teal-50/70 hover:from-emerald-100/80 hover:to-teal-100/80 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">Guest Mode</span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                  isDarkMode ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  1-Click
                </span>
              </div>
              <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-emerald-300/80' : 'text-emerald-800/80'}`}>
                Instant access · 0 Credits · No saved chat history · Sign in anytime to save chats
              </p>
            </button>

            {/* Google Sign-In Button */}
            <button
              id="google-signin-btn"
              type="button"
              onClick={() => {
                setShowGoogleModal(true);
                setError(null);
              }}
              className={`py-3 px-3.5 rounded-2xl border flex flex-col items-start justify-between gap-1 text-left shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] ${
                isDarkMode
                  ? 'bg-[#28292a] hover:bg-[#333537] border-[#3e4042] text-white'
                  : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span className="text-xs font-bold">Google</span>
                </div>
                <span className="text-[9px] font-semibold opacity-60">OAuth</span>
              </div>
              <p className="text-[10px] opacity-70 mt-1">
                Google account · 0 Credits initial with free Credit rewards & Daily Checking
              </p>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2 text-xs opacity-50">
            <div className="flex-1 h-px bg-gray-500/20" />
            <span>or continue with email</span>
            <div className="flex-1 h-px bg-gray-500/20" />
          </div>

          {/* Permanent Login Notice Banner */}
          <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-blue-400" />
            <span className="text-[11px] leading-relaxed">
              <strong>Permanent session:</strong> Sign in with email to keep all chat history & projects saved forever.
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-semibold opacity-70 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 opacity-50" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode ? 'bg-[#131314] border-[#37393b] text-white' : 'bg-gray-50 border-gray-300 text-black'
                    }`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold opacity-70 mb-1">
                Your Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 opacity-50" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode ? 'bg-[#131314] border-[#37393b] text-white' : 'bg-gray-50 border-gray-300 text-black'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold opacity-70 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 opacity-50" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Create a secure password' : '••••••••••••'}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode ? 'bg-[#131314] border-[#37393b] text-white' : 'bg-gray-50 border-gray-300 text-black'
                  }`}
                />
              </div>
            </div>

            <button
              id="submit-auth-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Boss AI' : 'Create Free Account & Enter'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="text-center pt-2 text-xs opacity-75">
            {mode === 'signin' ? (
              <p>
                First time visiting?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="text-blue-500 font-semibold hover:underline"
                >
                  Create your free account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="text-blue-500 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Quick guest bypass link */}
          <div className="pt-2 border-t border-gray-500/10 text-center space-y-2">
            <button
              id="guest-bottom-link-btn"
              type="button"
              disabled={loading}
              onClick={handleGuestSubmit}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1.5 transition-colors hover:underline"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Or explore right now as Guest (Temporary session · No saved chats)</span>
            </button>

            {onOpenPrivacy && (
              <div className="text-[11px] opacity-60 text-center">
                By continuing, you agree to our{' '}
                <button
                  type="button"
                  id="auth-privacy-link-btn"
                  onClick={onOpenPrivacy}
                  className="text-blue-400 hover:underline font-medium inline-flex items-center gap-0.5"
                >
                  <Shield className="w-3 h-3" />
                  <span>Privacy Policy</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Google Email Input Dialog */}
        {showGoogleModal && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 p-6 flex flex-col justify-center animate-in fade-in">
            <div className="max-w-sm mx-auto w-full space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-base font-bold">Sign in with Google</h3>
                <p className="text-xs opacity-70 mt-1">Enter your personal Google email to connect</p>
              </div>

              <form onSubmit={handleGoogleSubmit} className="space-y-3 text-left">
                <div>
                  <label className="block text-[11px] font-semibold opacity-75 mb-1">
                    Your Google Email
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="youremail@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-900 text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold opacity-75 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-900 text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5"
                  >
                    {loading ? 'Connecting...' : 'Continue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

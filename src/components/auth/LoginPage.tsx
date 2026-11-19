import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Store,
  WifiOff,
  Receipt,
  ShieldCheck,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
} from 'lucide-react';

export function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email login state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(msg);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      if (isSignUp) {
        await signUpWithEmail(email, password);
        setSuccessMsg('Account created! Please check your email or proceed to log in.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 flex flex-col justify-between px-6 py-8 text-white">
      {/* Top Header */}
      <div className="text-center pt-4">
        <div className="w-16 h-16 mx-auto bg-white rounded-3xl shadow-xl flex items-center justify-center mb-3 text-blue-600 font-extrabold text-3xl">
          ₹
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Kharcha</h1>
        <p className="text-blue-100 text-sm mt-0.5 font-medium">Smart Multi-Business Manager</p>
      </div>

      {/* Feature Highlights Card */}
      <div className="max-w-md w-full mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-2xl my-4">
        <h2 className="text-xs font-semibold tracking-wider uppercase text-blue-200 mb-3 text-center">
          Engineered for Indian Businesses
        </h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-xs">Multi-Business & Multi-Branch</p>
              <p className="text-[11px] text-blue-100">Kirana, Medical, Hotel, Restaurant, Sweet & Mobile</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-xs">Offline-First Architecture</p>
              <p className="text-[11px] text-blue-100">Works with zero internet, auto-syncs when online</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-xs">GST, Khata & POS Ready</p>
              <p className="text-[11px] text-blue-100">Credit ledger, daily cash drawer, batch/IMEI tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Action Card */}
      <div className="max-w-md w-full mx-auto space-y-3">
        {error && (
          <div className="bg-red-500/20 border border-red-300/40 text-red-100 text-xs p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/20 border border-emerald-300/40 text-emerald-100 text-xs p-3 rounded-xl text-center">
            {successMsg}
          </div>
        )}

        {!showEmailForm ? (
          <div className="space-y-3">
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-semibold h-13 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 px-6 active:scale-[0.98] disabled:opacity-75"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm">Connecting...</span>
                </>
              ) : (
                <>
                  {/* Google SVG */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="text-sm font-bold">Continue with Google</span>
                </>
              )}
            </button>

            {/* Email Alternative */}
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-medium h-11 rounded-xl transition-all text-xs flex items-center justify-center gap-2 border border-white/20"
            >
              <Mail className="w-4 h-4" />
              <span>Or sign in with Email & Password</span>
            </button>
          </div>
        ) : (
          /* Email Form */
          <form onSubmit={handleEmailAuth} className="bg-white rounded-2xl p-4 text-gray-900 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="font-bold text-xs uppercase tracking-wider text-gray-700">
                {isSignUp ? 'Create New Account' : 'Sign In with Email'}
              </span>
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="text-xs text-blue-600 font-semibold"
              >
                Back to Google
              </button>
            </div>

            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Sign Up' : 'Log In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                {isSignUp
                  ? 'Already have an account? Log In'
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-blue-200 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Connected to Supabase PostgreSQL</span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useAuth } from './AuthContext';
import { ALLOWED_DOMAINS, ALLOWED_EMAIL_EXCEPTIONS } from './authTypes';
import { BrandLogo } from '../brand/BrandLogo';
import { ShieldCheck, LogIn, AlertCircle, CheckCircle2, Lock, Sparkles, UserCheck } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, loading, error, clearError } = useAuth();

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#070D18] text-slate-100 px-4 relative overflow-hidden">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-[#0F172A] border border-[#1E293B] rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4 p-2 bg-[#162238] rounded-xl border border-slate-700/60 shadow-inner">
            <BrandLogo size="lg" variant="light" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            BrightOps Form Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-sm">
            Intelligent form field detection, document preparation, and digital form studio.
          </p>
        </div>

        {/* Domain Access Badge */}
        <div className="bg-[#162238]/80 border border-sky-500/20 rounded-xl p-3.5 mb-6 text-xs text-slate-300 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sky-400 font-semibold uppercase tracking-wider text-[11px]">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Authorized Corporate Access Only</span>
          </div>
          <div className="text-slate-400 text-xs">
            Sign-in is permitted for verified accounts on:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALLOWED_DOMAINS.map((domain) => (
              <span
                key={domain}
                className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-mono text-[11px] border border-sky-800/60"
              >
                @{domain}
              </span>
            ))}
            {ALLOWED_EMAIL_EXCEPTIONS.map((email) => (
              <span
                key={email}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700"
                title="Testing Exception"
              >
                {email}
              </span>
            ))}
          </div>
        </div>

        {/* Error Alert Message */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Authentication Blocked</p>
              <p className="leading-relaxed">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-rose-400 hover:text-rose-200 text-sm font-bold ml-1"
            >
              &times;
            </button>
          </div>
        )}

        {/* One-Click Google Authentication Button */}
        <button
          id="btn-google-oauth-signin"
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.99]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>{loading ? 'Authenticating...' : 'Sign in with Google (1-Click)'}</span>
        </button>

        {/* Security & Architecture Note */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Loosely wired Auth Adapter
          </span>
          <span className="font-mono text-slate-400">BrightOps SSO Ready</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} BrightOps. All rights reserved.
      </div>
    </div>
  );
};

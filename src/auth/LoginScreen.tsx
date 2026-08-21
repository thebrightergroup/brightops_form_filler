import React from 'react';
import { useAuth } from './AuthContext';
import { ALLOWED_DOMAINS } from './authTypes';
import { BrandLogo } from '../brand/BrandLogo';
import { ShieldCheck, AlertCircle, Lock } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, loading, error, clearError } = useAuth();

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#070D18] text-slate-100 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-md bg-[#0F172A] border border-[#1E293B] rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4 p-2 bg-[#162238] rounded-xl border border-slate-700/60 shadow-inner">
            <BrandLogo size="lg" variant="light" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Form Filler</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-sm">
            Sign in to open and complete BrightOps document forms.
          </p>
        </div>

        <div className="bg-[#162238]/80 border border-sky-500/20 rounded-xl p-3.5 mb-6 text-xs text-slate-300 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sky-400 font-semibold uppercase tracking-wider text-[11px]">
            <ShieldCheck className="w-4 h-4" />
            <span>Internal access</span>
          </div>
          <div className="text-slate-400">Approved organisation domains:</div>
          <div className="flex flex-wrap gap-1.5">
            {ALLOWED_DOMAINS.map((domain) => (
              <span key={domain} className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-mono text-[11px] border border-sky-800/60">
                @{domain}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Sign-in unavailable</p>
              <p className="leading-relaxed">{error}</p>
            </div>
            <button onClick={clearError} className="text-rose-400 hover:text-rose-200 text-sm font-bold ml-1">&times;</button>
          </div>
        )}

        <button
          id="btn-google-oauth-signin"
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> : <span>G</span>}
          <span>{loading ? 'Signing in…' : 'Sign in with Google'}</span>
        </button>

        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Prototype access gate. Production authorisation remains separately controlled.</span>
        </div>
      </div>
    </div>
  );
};

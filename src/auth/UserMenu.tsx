import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { LogOut, Shield, ChevronDown, Zap } from 'lucide-react';

interface UserMenuProps {
  onOpenPrefillSettings?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onOpenPrefillSettings }) => {
  const { user, signOutUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
        title={`Signed in as ${user.email}`}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full object-cover border border-sky-400" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#006CA3] text-white flex items-center justify-center text-xs font-semibold">
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <span className="text-xs font-medium max-w-[110px] truncate hidden md:inline">
          {user.displayName || user.email}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#0F172A] border border-slate-800 rounded-xl shadow-xl z-50 py-2 text-xs">
          <div className="px-4 py-2 border-b border-slate-800">
            <p className="font-semibold text-slate-100 truncate">{user.displayName}</p>
            <p className="text-slate-400 font-mono text-[11px] truncate">{user.email}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 font-medium text-[10px] border border-sky-800/50 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {user.domain ? `@${user.domain}` : 'Authorised Member'}
              </span>
            </div>
          </div>

          {onOpenPrefillSettings && (
            <div className="px-2 py-1 border-b border-slate-800/80">
              <button
                onClick={() => { setIsOpen(false); onOpenPrefillSettings(); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sky-300 hover:bg-sky-500/10 hover:text-sky-200 transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 text-sky-400" />
                <span>Prefill Profile & Data</span>
              </button>
            </div>
          )}

          <div className="px-2 pt-1">
            <button
              onClick={() => { setIsOpen(false); void signOutUser(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { DetectedField } from '../types';
import { UserProfileData, matchDocumentFieldsForPrefill } from '../auth/prefillProfile';
import { Zap, Sparkles, X, Settings2, CheckCircle2, UserCheck } from 'lucide-react';

interface PrefillBannerProps {
  fields: DetectedField[];
  profile: UserProfileData;
  onApplyPrefill: (profile: UserProfileData, overwrite: boolean) => void;
  onOpenSettings: () => void;
}

export const PrefillBanner: React.FC<PrefillBannerProps> = ({
  fields,
  profile,
  onApplyPrefill,
  onOpenSettings,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Check matching fields
  const { matches, emptyMatchesCount, totalMatchesCount } = matchDocumentFieldsForPrefill(
    fields,
    profile
  );

  // Reset dismissed state if fields change significantly or when opening a fresh document
  useEffect(() => {
    setIsDismissed(false);
  }, [fields.length]);

  if (isDismissed || totalMatchesCount === 0 || emptyMatchesCount === 0) {
    if (appliedToast) {
      return (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md transition-all animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span className="font-bold">{appliedToast}</span>
          </div>
        </div>
      );
    }
    return null;
  }

  const sampleFieldNames = matches
    .filter((m) => m.isEmpty)
    .slice(0, 3)
    .map((m) => m.fieldLabel)
    .join(', ');

  const handleQuickPrefill = () => {
    onApplyPrefill(profile, false);
    setAppliedToast(`Filled ${emptyMatchesCount} fields with your BrightOps profile details!`);
    setTimeout(() => {
      setAppliedToast(null);
      setIsDismissed(true);
    }, 3500);
  };

  return (
    <div className="bg-gradient-to-r from-[#006CA3] via-[#005a88] to-[#0B1220] text-white px-4 py-2.5 shadow-md border-b border-sky-400/30 flex items-center justify-between transition-all animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Summary & Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-sky-400/20 text-sky-200 border border-sky-300/30 flex-shrink-0">
            <Zap className="w-4 h-4 text-sky-300 fill-sky-300/40" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white">
                Auto-Prefill Available
              </span>
              <span className="bg-sky-950/80 text-sky-300 border border-sky-400/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                {emptyMatchesCount} matching field{emptyMatchesCount === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-[11px] text-sky-100 truncate max-w-xl">
              Prefill with <b>{profile.displayName || profile.email}</b> ({sampleFieldNames}
              {matches.length > 3 ? `, +${matches.length - 3} more` : ''})
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleQuickPrefill}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-sky-50 text-[#006CA3] font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-[#006CA3]" />
            <span>Prefill Form Now</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-sky-800/60 transition-colors"
            title="Edit stored browser profile details"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-sky-300 hover:text-white hover:bg-sky-800/60 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { DetectedField } from '../types';
import { UserProfileData, matchDocumentFieldsForPrefill } from '../auth/prefillProfile';
import { CheckCircle2, Settings2, X, Zap } from 'lucide-react';

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
  const { matches, emptyMatchesCount, totalMatchesCount } = matchDocumentFieldsForPrefill(fields, profile);

  useEffect(() => setIsDismissed(false), [fields.length]);

  if (isDismissed || totalMatchesCount === 0 || emptyMatchesCount === 0) {
    return appliedToast ? (
      <div className="bg-emerald-600 text-white px-4 py-2 text-xs flex items-center gap-2 shadow-md">
        <CheckCircle2 className="w-4 h-4" />
        <span className="font-bold">{appliedToast}</span>
      </div>
    ) : null;
  }

  const sampleFieldNames = matches.filter((m) => m.isEmpty).slice(0, 3).map((m) => m.fieldLabel).join(', ');

  const handleQuickPrefill = () => {
    onApplyPrefill(profile, false);
    setAppliedToast(`Filled ${emptyMatchesCount} matching field${emptyMatchesCount === 1 ? '' : 's'}.`);
    window.setTimeout(() => { setAppliedToast(null); setIsDismissed(true); }, 3000);
  };

  return (
    <div className="bg-[#0B1220] text-white px-4 py-2.5 shadow-md border-b border-sky-400/30">
      <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-sky-400/20 text-sky-200 border border-sky-300/30 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">Profile details can fill this form</span>
              <span className="bg-sky-950 text-sky-300 border border-sky-400/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                {emptyMatchesCount} field{emptyMatchesCount === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-[11px] text-sky-100 truncate max-w-xl">
              Suggested for {profile.displayName || profile.email}: {sampleFieldNames}{matches.length > 3 ? `, +${matches.length - 3} more` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleQuickPrefill} className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-sky-50 text-[#006CA3] font-bold text-xs flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /><span>Prefill empty fields</span>
          </button>
          <button onClick={onOpenSettings} className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-sky-800/60" title="Edit saved profile details">
            <Settings2 className="w-4 h-4" />
          </button>
          <button onClick={() => setIsDismissed(true)} className="p-1.5 rounded-lg text-sky-300 hover:text-white hover:bg-sky-800/60" title="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

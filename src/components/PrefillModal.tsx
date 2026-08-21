import React, { useEffect, useState } from 'react';
import {
  UserProfileData,
  getStoredUserProfile,
  saveStoredUserProfile,
  matchDocumentFieldsForPrefill,
} from '../auth/prefillProfile';
import { DetectedField } from '../types';
import { useAuth } from '../auth/AuthContext';
import { Building2, Briefcase, Mail, Phone, Save, User, X, Zap } from 'lucide-react';

interface PrefillModalProps {
  fields: DetectedField[];
  isOpen: boolean;
  onClose: () => void;
  onApplyPrefill: (profile: UserProfileData, overwrite: boolean) => void;
}

export const PrefillModal: React.FC<PrefillModalProps> = ({ fields, isOpen, onClose, onApplyPrefill }) => {
  const { user: oauthUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData>(() => getStoredUserProfile(oauthUser));
  const [overwrite, setOverwrite] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProfile(getStoredUserProfile(oauthUser));
      setSaveSuccess(false);
    }
  }, [isOpen, oauthUser]);

  if (!isOpen) return null;

  const { matches, emptyMatchesCount, totalMatchesCount } = matchDocumentFieldsForPrefill(fields, profile);

  const saveProfile = () => {
    const updated = saveStoredUserProfile(profile, oauthUser);
    setProfile(updated);
    setSaveSuccess(true);
    window.setTimeout(() => setSaveSuccess(false), 2200);
    return updated;
  };

  const handleApply = () => {
    const updated = saveProfile();
    onApplyPrefill(updated, overwrite);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#006CA3]"><Zap className="w-5 h-5" /></div>
            <div>
              <h3 className="font-heading font-bold text-base">Profile prefill</h3>
              <p className="text-xs text-slate-400">Save ordinary profile details in this browser and use them to fill matching fields.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
            <p className="text-xs font-semibold text-slate-800">
              {totalMatchesCount > 0
                ? `${totalMatchesCount} field${totalMatchesCount === 1 ? '' : 's'} match this profile; ${emptyMatchesCount} are currently empty.`
                : 'No standard fields currently match this profile.'}
            </p>
            {matches.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {matches.slice(0, 5).map((m) => (
                  <span key={m.fieldId} className="px-2 py-0.5 rounded bg-white text-slate-700 text-[11px] border border-slate-200">
                    {m.fieldLabel} → <b className="text-[#006CA3]">{m.suggestedValue}</b>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-xs font-semibold text-slate-700">Full name
              <div className="relative mt-1"><User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" /><input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs" /></div>
            </label>
            <label className="text-xs font-semibold text-slate-700">First name
              <input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            </label>
            <label className="text-xs font-semibold text-slate-700">Surname
              <input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-xs" />
            </label>
            <label className="text-xs font-semibold text-slate-700">Email
              <div className="relative mt-1"><Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" /><input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs" /></div>
            </label>
            <label className="text-xs font-semibold text-slate-700">Phone
              <div className="relative mt-1"><Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" /><input value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs" /></div>
            </label>
            <label className="text-xs font-semibold text-slate-700">Organisation
              <div className="relative mt-1"><Building2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" /><input value={profile.company || ''} onChange={(e) => setProfile({ ...profile, company: e.target.value })} className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs" /></div>
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Role / job title
              <div className="relative mt-1"><Briefcase className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" /><input value={profile.jobTitle || ''} onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })} className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs" /></div>
            </label>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
            Signature images, initials images and reusable signature values are not stored in this profile. A signature field may suggest your current display name as typed text when you choose to fill the form.
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} className="w-4 h-4 text-[#006CA3] rounded border-slate-300" />
            <span>Overwrite fields that already contain values</span>
          </label>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button type="button" onClick={() => saveProfile()} className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" /><span>{saveSuccess ? 'Saved' : 'Save profile'}</span>
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl hover:bg-slate-200 text-slate-600 text-xs font-semibold">Cancel</button>
            <button type="button" onClick={handleApply} disabled={totalMatchesCount === 0} className="px-5 py-2.5 rounded-xl bg-[#006CA3] hover:bg-[#005a88] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2">
              <Zap className="w-4 h-4" /><span>Prefill form ({overwrite ? totalMatchesCount : emptyMatchesCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

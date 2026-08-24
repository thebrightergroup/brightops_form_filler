import React, { useState, useEffect } from 'react';
import {
  UserProfileData,
  getStoredUserProfile,
  saveStoredUserProfile,
  matchDocumentFieldsForPrefill,
} from '../auth/prefillProfile';
import { DetectedField } from '../types';
import { useAuth } from '../auth/AuthContext';
import {
  Sparkles,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  PenTool,
  CheckCircle2,
  X,
  Save,
  Zap,
} from 'lucide-react';

interface PrefillModalProps {
  fields: DetectedField[];
  isOpen: boolean;
  onClose: () => void;
  onApplyPrefill: (profile: UserProfileData, overwrite: boolean) => void;
}

export const PrefillModal: React.FC<PrefillModalProps> = ({
  fields,
  isOpen,
  onClose,
  onApplyPrefill,
}) => {
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

  const { matches, emptyMatchesCount, totalMatchesCount } = matchDocumentFieldsForPrefill(
    fields,
    profile
  );

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = saveStoredUserProfile(profile);
    setProfile(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleApply = () => {
    // Save first then apply
    const updated = saveStoredUserProfile(profile);
    onApplyPrefill(updated, overwrite);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-slate-900">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#006CA3] text-white">
              <Zap className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">
                Browser Profile & Auto-Prefill
              </h3>
              <p className="text-xs text-slate-400">
                Stored securely in your browser to instantly populate form fields.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Document Matching Summary Banner */}
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#006CA3] font-mono block mb-0.5">
                ACTIVE DOCUMENT DETECTION
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {totalMatchesCount > 0
                  ? `Found ${totalMatchesCount} field${
                      totalMatchesCount === 1 ? '' : 's'
                    } that match your profile (${emptyMatchesCount} currently empty).`
                  : 'No standard fields automatically matched yet on this form.'}
              </p>
              {matches.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {matches.slice(0, 5).map((m) => (
                    <span
                      key={m.fieldId}
                      className="px-2 py-0.5 rounded bg-white text-slate-700 text-[11px] font-medium border border-slate-200 shadow-2xs"
                    >
                      {m.fieldLabel} &rarr; <b className="text-[#006CA3]">{m.suggestedValue}</b>
                    </span>
                  ))}
                  {matches.length > 5 && (
                    <span className="px-2 py-0.5 rounded bg-white text-slate-500 text-[11px] border border-slate-200">
                      +{matches.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form to Edit Stored Profile */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Stored Profile Details
              </span>
              {saveSuccess && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Profile updated!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Full Name / Display Name
                </label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parts = val.trim().split(/\s+/);
                    setProfile({
                      ...profile,
                      displayName: val,
                      firstName: parts[0] || '',
                      lastName: parts.slice(1).join(' ') || '',
                    });
                  }}
                  placeholder="e.g. Gary McCourt"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#006CA3] focus:border-transparent outline-hidden"
                />
              </div>

              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First / Given Name
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  placeholder="Gary"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#006CA3] focus:border-transparent outline-hidden"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last / Family Name
                </label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  placeholder="McCourt"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#006CA3] focus:border-transparent outline-hidden"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Corporate Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="info@brightops.com.au"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#006CA3] focus:border-transparent outline-hidden"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+61 400 123 456"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#006CA3] focus:border-transparent outline-hidden"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={profile.company || ''}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  placeholder="The Brighter Group / BrightOps"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#006CA3] focus:border-transparent outline-hidden"
                />
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  Job Title / Role
                </label>
                <input
                  type="text"
                  value={profile.jobTitle || ''}
                  onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                  placeholder="Operations Lead"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#006CA3] focus:border-transparent outline-hidden"
                />
              </div>

              {/* Default Signature Text */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-slate-500" />
                  Default Typed Signature
                </label>
                <input
                  type="text"
                  value={profile.signatureText || ''}
                  onChange={(e) => setProfile({ ...profile, signatureText: e.target.value })}
                  placeholder="Gary McCourt"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-serif italic text-slate-800 focus:ring-2 focus:ring-[#006CA3] focus:border-transparent outline-hidden"
                />
              </div>
            </div>

            {/* Overwrite Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="w-4 h-4 text-[#006CA3] rounded border-slate-300 focus:ring-[#006CA3]"
                />
                <span>Overwrite fields that already have entered values</span>
              </label>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSaveProfile}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Profile</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-transparent hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl bg-[#006CA3] hover:bg-[#005a88] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-sky-200" />
              <span>Prefill Form Now ({totalMatchesCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

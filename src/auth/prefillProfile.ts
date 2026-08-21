import { DetectedField } from '../types';
import { UserProfile } from './authTypes';

export interface UserProfileData {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  lastUpdated: string;
}

const STORAGE_KEY_PREFIX = 'brightops_user_prefill_profile';

function getStorageKey(oauthUser?: UserProfile | null): string {
  const identity = oauthUser?.uid || oauthUser?.email?.toLowerCase() || 'local';
  return `${STORAGE_KEY_PREFIX}:${identity}`;
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName || typeof fullName !== 'string') return { firstName: '', lastName: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function deriveCompanyNameFromDomain(domain: string | null | undefined): string {
  if (!domain) return 'BrightOps';
  const lower = domain.toLowerCase();
  if (lower.includes('thebrightergroup')) return 'The Brighter Group';
  if (lower.includes('brightops')) return 'BrightOps';
  return 'BrightOps';
}

export function getStoredUserProfile(oauthUser?: UserProfile | null): UserProfileData {
  let existingProfile: Partial<UserProfileData> = {};
  try {
    const raw = localStorage.getItem(getStorageKey(oauthUser));
    if (raw) existingProfile = JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse stored user profile from localStorage:', err);
  }

  const oauthDisplayName = oauthUser?.displayName || existingProfile.displayName || '';
  const oauthEmail = oauthUser?.email || existingProfile.email || '';
  const domain = oauthUser?.domain || (oauthEmail.includes('@') ? oauthEmail.split('@')[1] : null);
  const { firstName: derivedFirst, lastName: derivedLast } = splitFullName(oauthDisplayName);

  const merged: UserProfileData = {
    displayName: existingProfile.displayName || oauthDisplayName || 'BrightOps User',
    firstName: existingProfile.firstName || derivedFirst || '',
    lastName: existingProfile.lastName || derivedLast || '',
    email: existingProfile.email || oauthEmail || '',
    phone: existingProfile.phone || '',
    company: existingProfile.company || deriveCompanyNameFromDomain(domain),
    jobTitle: existingProfile.jobTitle || 'Team Member',
    address: existingProfile.address || '',
    lastUpdated: existingProfile.lastUpdated || new Date().toISOString(),
  };

  try {
    localStorage.setItem(getStorageKey(oauthUser), JSON.stringify(merged));
  } catch (err) {
    console.warn('Could not persist merged user profile:', err);
  }
  return merged;
}

export function saveStoredUserProfile(data: Partial<UserProfileData>, oauthUser?: UserProfile | null): UserProfileData {
  const current = getStoredUserProfile(oauthUser);
  const updated: UserProfileData = { ...current, ...data, lastUpdated: new Date().toISOString() };
  try {
    localStorage.setItem(getStorageKey(oauthUser), JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save user profile to localStorage:', err);
  }
  return updated;
}

export interface FieldPrefillMatch {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  suggestedValue: string;
  matchType: 'name' | 'firstName' | 'lastName' | 'email' | 'phone' | 'date' | 'company' | 'jobTitle' | 'signature' | 'address';
  currentValue?: string | boolean;
  isEmpty: boolean;
}

export function matchDocumentFieldsForPrefill(fields: DetectedField[], profile: UserProfileData): {
  matches: FieldPrefillMatch[];
  emptyMatchesCount: number;
  totalMatchesCount: number;
} {
  const todayIso = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const matches: FieldPrefillMatch[] = [];

  for (const field of fields) {
    const rawLabel = (field.label || '').toLowerCase();
    const rawName = (field.machineName || '').toLowerCase();
    const purpose = (field.inferredPurpose || '').toLowerCase();
    const isValEmpty = field.value === undefined || field.value === null || field.value === '';
    let suggestedValue: string | null = null;
    let matchType: FieldPrefillMatch['matchType'] | null = null;

    if (field.fieldType === 'email' || rawName.includes('email') || rawLabel.includes('email') || rawLabel.includes('e-mail') || purpose.includes('email')) {
      if (profile.email) { suggestedValue = profile.email; matchType = 'email'; }
    } else if (rawName.includes('first_name') || rawLabel.includes('first name') || rawLabel.includes('given name') || rawName.includes('firstname')) {
      if (profile.firstName) { suggestedValue = profile.firstName; matchType = 'firstName'; }
    } else if (rawName.includes('last_name') || rawLabel.includes('last name') || rawLabel.includes('surname') || rawLabel.includes('family name') || rawName.includes('lastname')) {
      if (profile.lastName) { suggestedValue = profile.lastName; matchType = 'lastName'; }
    } else if (rawName.includes('full_name') || rawLabel.includes('full name') || rawName.includes('employee_name') || rawLabel.includes('employee name') || rawName.includes('applicant_name') || rawLabel.includes('applicant name') || rawName.includes('contact_name') || rawLabel.includes('contact name') || rawLabel.includes('signer name') || rawLabel.includes('prepared by') || rawLabel.includes('completed by') || rawLabel.includes('your name') || rawLabel === 'name' || rawName === 'name' || purpose.includes('person name')) {
      if (profile.displayName) { suggestedValue = profile.displayName; matchType = 'name'; }
    } else if (field.fieldType === 'phone' || rawName.includes('phone') || rawLabel.includes('phone') || rawLabel.includes('mobile') || rawName.includes('mobile') || rawLabel.includes('contact number')) {
      if (profile.phone) { suggestedValue = profile.phone; matchType = 'phone'; }
    } else if (rawName.includes('company') || rawLabel.includes('company') || rawName.includes('organisation') || rawLabel.includes('organisation') || rawName.includes('organization') || rawLabel.includes('organization') || rawLabel.includes('employer') || rawLabel.includes('business name')) {
      if (profile.company) { suggestedValue = profile.company; matchType = 'company'; }
    } else if (rawName.includes('job_title') || rawLabel.includes('job title') || rawLabel.includes('position') || rawLabel.includes('role') || rawName.includes('position') || rawLabel.includes('occupation')) {
      if (profile.jobTitle) { suggestedValue = profile.jobTitle; matchType = 'jobTitle'; }
    } else if (field.fieldType === 'date' || rawName.includes('date') || rawLabel.includes('date') || rawLabel.includes('today') || purpose.includes('date')) {
      suggestedValue = field.fieldType === 'date' ? todayIso : todayFormatted;
      matchType = 'date';
    } else if (field.fieldType === 'signature' && profile.displayName) {
      // Runtime typed-signature suggestion only. No reusable signature image/value is persisted in browser profile storage.
      suggestedValue = profile.displayName;
      matchType = 'signature';
    }

    if (suggestedValue && matchType) {
      matches.push({
        fieldId: field.id,
        fieldLabel: field.label || field.machineName || 'Field',
        fieldType: field.fieldType,
        suggestedValue,
        matchType,
        currentValue: field.value,
        isEmpty: isValEmpty,
      });
    }
  }

  return {
    matches,
    emptyMatchesCount: matches.filter((m) => m.isEmpty).length,
    totalMatchesCount: matches.length,
  };
}

export function applyPrefillToFields(fields: DetectedField[], profile: UserProfileData, overwriteExisting = false): {
  updatedFields: DetectedField[];
  filledCount: number;
  filledLabels: string[];
} {
  const { matches } = matchDocumentFieldsForPrefill(fields, profile);
  const matchMap = new Map<string, string>();
  for (const match of matches) {
    if (overwriteExisting || match.isEmpty) matchMap.set(match.fieldId, match.suggestedValue);
  }

  let filledCount = 0;
  const filledLabels: string[] = [];
  const updatedFields = fields.map((f) => {
    if (!matchMap.has(f.id)) return f;
    filledCount++;
    filledLabels.push(f.label || f.machineName);
    return { ...f, value: matchMap.get(f.id)! };
  });

  return { updatedFields, filledCount, filledLabels };
}

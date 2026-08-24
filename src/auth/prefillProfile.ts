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
  signatureText?: string;
  lastUpdated: string;
}

const STORAGE_KEY = 'brightops_user_prefill_profile';

/**
 * Parses full name into first and last names
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' };
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

/**
 * Derives a default company name based on the authenticated domain
 */
export function deriveCompanyNameFromDomain(domain: string | null | undefined): string {
  if (!domain) return 'BrightOps';
  const lower = domain.toLowerCase();
  if (lower.includes('thebrightergroup')) return 'The Brighter Group';
  if (lower.includes('brightops')) return 'BrightOps';
  return 'BrightOps';
}

/**
 * Loads the user profile from browser localStorage.
 * If user details from OAuth are available, merges them in if fields are empty.
 */
export function getStoredUserProfile(oauthUser?: UserProfile | null): UserProfileData {
  let existingProfile: Partial<UserProfileData> = {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      existingProfile = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse stored user profile from localStorage:', err);
  }

  // Derive defaults from OAuth user if available
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
    signatureText: existingProfile.signatureText || existingProfile.displayName || oauthDisplayName || '',
    lastUpdated: existingProfile.lastUpdated || new Date().toISOString(),
  };

  // If local storage was empty or updated, save merged result
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn('Could not persist merged user profile:', err);
  }

  return merged;
}

/**
 * Saves updated profile details directly to browser localStorage.
 */
export function saveStoredUserProfile(data: Partial<UserProfileData>): UserProfileData {
  const current = getStoredUserProfile();
  const updated: UserProfileData = {
    ...current,
    ...data,
    lastUpdated: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save user profile to localStorage:', err);
  }

  return updated;
}

/**
 * Evaluates how many fields in the current document match the user profile
 * and generates prefill values for them.
 */
export interface FieldPrefillMatch {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  suggestedValue: string;
  matchType: 'name' | 'firstName' | 'lastName' | 'email' | 'phone' | 'date' | 'company' | 'jobTitle' | 'signature' | 'address';
  currentValue?: string | boolean;
  isEmpty: boolean;
}

export function matchDocumentFieldsForPrefill(
  fields: DetectedField[],
  profile: UserProfileData
): {
  matches: FieldPrefillMatch[];
  emptyMatchesCount: number;
  totalMatchesCount: number;
} {
  const todayIso = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todayFormatted = new Date().toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }); // DD/MM/YYYY

  const matches: FieldPrefillMatch[] = [];

  for (const field of fields) {
    const rawLabel = (field.label || '').toLowerCase();
    const rawName = (field.machineName || '').toLowerCase();
    const purpose = (field.inferredPurpose || '').toLowerCase();
    const isValEmpty = field.value === undefined || field.value === null || field.value === '';

    let suggestedValue: string | null = null;
    let matchType: FieldPrefillMatch['matchType'] | null = null;

    // 1. Email matching
    if (
      field.fieldType === 'email' ||
      rawName.includes('email') ||
      rawLabel.includes('email') ||
      rawLabel.includes('e-mail') ||
      purpose.includes('email')
    ) {
      if (profile.email) {
        suggestedValue = profile.email;
        matchType = 'email';
      }
    }
    // 2. First Name matching
    else if (
      rawName.includes('first_name') ||
      rawLabel.includes('first name') ||
      rawLabel.includes('given name') ||
      rawName.includes('firstname')
    ) {
      if (profile.firstName) {
        suggestedValue = profile.firstName;
        matchType = 'firstName';
      }
    }
    // 3. Last Name matching
    else if (
      rawName.includes('last_name') ||
      rawLabel.includes('last name') ||
      rawLabel.includes('surname') ||
      rawLabel.includes('family name') ||
      rawName.includes('lastname')
    ) {
      if (profile.lastName) {
        suggestedValue = profile.lastName;
        matchType = 'lastName';
      }
    }
    // 4. Full Name / Name matching
    else if (
      rawName.includes('full_name') ||
      rawLabel.includes('full name') ||
      rawName.includes('employee_name') ||
      rawLabel.includes('employee name') ||
      rawName.includes('applicant_name') ||
      rawLabel.includes('applicant name') ||
      rawName.includes('contact_name') ||
      rawLabel.includes('contact name') ||
      rawLabel.includes('signer name') ||
      rawLabel.includes('prepared by') ||
      rawLabel.includes('completed by') ||
      rawLabel.includes('your name') ||
      rawLabel === 'name' ||
      rawName === 'name' ||
      purpose.includes('person name')
    ) {
      if (profile.displayName) {
        suggestedValue = profile.displayName;
        matchType = 'name';
      }
    }
    // 5. Phone matching
    else if (
      field.fieldType === 'phone' ||
      rawName.includes('phone') ||
      rawLabel.includes('phone') ||
      rawLabel.includes('mobile') ||
      rawName.includes('mobile') ||
      rawLabel.includes('contact number')
    ) {
      if (profile.phone) {
        suggestedValue = profile.phone;
        matchType = 'phone';
      }
    }
    // 6. Company / Organization matching
    else if (
      rawName.includes('company') ||
      rawLabel.includes('company') ||
      rawName.includes('organisation') ||
      rawLabel.includes('organisation') ||
      rawName.includes('organization') ||
      rawLabel.includes('organization') ||
      rawLabel.includes('employer') ||
      rawLabel.includes('business name')
    ) {
      if (profile.company) {
        suggestedValue = profile.company;
        matchType = 'company';
      }
    }
    // 7. Job Title / Role matching
    else if (
      rawName.includes('job_title') ||
      rawLabel.includes('job title') ||
      rawLabel.includes('position') ||
      rawLabel.includes('role') ||
      rawName.includes('position') ||
      rawLabel.includes('occupation')
    ) {
      if (profile.jobTitle) {
        suggestedValue = profile.jobTitle;
        matchType = 'jobTitle';
      }
    }
    // 8. Date matching
    else if (
      field.fieldType === 'date' ||
      rawName.includes('date') ||
      rawLabel.includes('date') ||
      rawLabel.includes('today') ||
      purpose.includes('date')
    ) {
      // Date inputs typically require YYYY-MM-DD
      suggestedValue = field.fieldType === 'date' ? todayIso : todayFormatted;
      matchType = 'date';
    }
    // 9. Signature (typed or text representation)
    else if (field.fieldType === 'signature') {
      if (profile.signatureText || profile.displayName) {
        suggestedValue = profile.signatureText || profile.displayName;
        matchType = 'signature';
      }
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

  const emptyMatchesCount = matches.filter((m) => m.isEmpty).length;
  const totalMatchesCount = matches.length;

  return {
    matches,
    emptyMatchesCount,
    totalMatchesCount,
  };
}

/**
 * Applies prefilled values to an array of detected fields.
 * Returns the modified field array and count of fields filled.
 */
export function applyPrefillToFields(
  fields: DetectedField[],
  profile: UserProfileData,
  overwriteExisting = false
): { updatedFields: DetectedField[]; filledCount: number; filledLabels: string[] } {
  const { matches } = matchDocumentFieldsForPrefill(fields, profile);
  const matchMap = new Map<string, string>();

  for (const match of matches) {
    if (overwriteExisting || match.isEmpty) {
      matchMap.set(match.fieldId, match.suggestedValue);
    }
  }

  let filledCount = 0;
  const filledLabels: string[] = [];

  const updatedFields = fields.map((f) => {
    if (matchMap.has(f.id)) {
      const newVal = matchMap.get(f.id)!;
      filledCount++;
      filledLabels.push(f.label || f.machineName);
      return {
        ...f,
        value: newVal,
      };
    }
    return f;
  });

  return {
    updatedFields,
    filledCount,
    filledLabels,
  };
}

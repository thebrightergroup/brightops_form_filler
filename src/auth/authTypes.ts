export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  domain: string | null;
  isAuthorized: boolean;
  role: 'admin' | 'member' | 'guest';
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
}

// Configurable Allowed Domains & Specific Email Exceptions
export const ALLOWED_DOMAINS = [
  'thebrightergroup.com.au',
  'brightops.com.au',
];

export const ALLOWED_EMAIL_EXCEPTIONS = [
  'gary.j.mccourt@gmail.com',
];

/**
 * Validates whether an email belongs to an allowed corporate domain
 * or matches an approved testing/admin exception.
 *
 * IMPORTANT: this is a prototype UI gate only. Protected shared/cloud
 * data must also be authorised server-side and/or through Firebase rules.
 */
export function checkEmailAuthorization(email: string | null | undefined): {
  isAuthorized: boolean;
  reason?: string;
} {
  if (!email) {
    return {
      isAuthorized: false,
      reason: 'No email address was provided by the authentication provider.',
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (ALLOWED_EMAIL_EXCEPTIONS.map((e) => e.toLowerCase()).includes(normalizedEmail)) {
    return { isAuthorized: true };
  }

  const domain = normalizedEmail.split('@')[1];
  if (domain && ALLOWED_DOMAINS.map((d) => d.toLowerCase()).includes(domain)) {
    return { isAuthorized: true };
  }

  return {
    isAuthorized: false,
    reason: `Access restricted. Your email (${normalizedEmail}) is not from an authorised BrightOps domain (@thebrightergroup.com.au or @brightops.com.au).`,
  };
}

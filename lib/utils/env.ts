// ─── Core accessor helpers ────────────────────────────────────────────────────

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Copy .env.example to .env.local and fill in the value.`,
    );
  }
  return value;
}

function optional(key: string, fallback?: string): string {
  return process.env[key] || fallback || '';
}

// ─── Named accessors (single source of truth for every key) ──────────────────

export const env = {
  // Auth.js v5 reads AUTH_SECRET automatically; expose for explicit use / validation
  authSecret: () => required('AUTH_SECRET'),

  // AUTH_URL is optional — Auth.js auto-detects on Vercel; set for local/self-hosted
  authUrl: () => optional('AUTH_URL'),

  // Google OAuth (used by NextAuth Google provider)
  googleOAuthClientId: () => required('GOOGLE_OAUTH_CLIENT_ID'),
  googleOAuthClientSecret: () => required('GOOGLE_OAUTH_CLIENT_SECRET'),

  // Legacy Service Account keys (optional in OAuth-user mode)
  googleServiceAccountEmail: () => optional('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
  googlePrivateKey: () => optional('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n'),

  // PostgreSQL / Neon connection string (required)
  databaseUrl: () => required('DATABASE_URL'),

  // Public base URL for share links — available both server-side and client-side
  // because of the NEXT_PUBLIC_ prefix
  baseUrl: () => optional('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000'),

  isDev: () => process.env.NODE_ENV !== 'production',
} as const;

// ─── Startup validation ───────────────────────────────────────────────────────
// Call once via instrumentation.ts (Node.js runtime only).
// Throws with a clear list of all missing keys at once.

const SERVER_REQUIRED_KEYS = [
  'AUTH_SECRET',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
] as const;

export function validateRequiredEnvs(): void {
  const missing = SERVER_REQUIRED_KEYS.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `\n\nMissing required environment variables:\n` +
        missing.map((k) => `  ✗ ${k}`).join('\n') +
        `\n\nCopy .env.example to .env.local and fill in the values.\n`,
    );
  }
}

// Keep the generic helper exported for any ad-hoc use
export function getRequiredEnv(key: string): string {
  return required(key);
}

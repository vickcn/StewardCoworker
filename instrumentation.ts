// Next.js instrumentation hook — runs once when the server starts (Node.js runtime only).
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateRequiredEnvs } = await import('@/lib/utils/env');
    validateRequiredEnvs();
  }
}

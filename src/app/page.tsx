import { redirect } from 'next/navigation';

/**
 * Root page — no content here.
 * Middleware handles the redirect before this even runs:
 *   - Not logged in  → /login
 *   - Logged in      → /admin/dashboard
 *
 * This server-side redirect is a fallback in case middleware is skipped.
 */
export default function RootPage() {
  redirect('/login');
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const { sendMagicLink, isLoading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── If already logged in, redirect immediately ──────────────────────────
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/admin/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  // Show nothing while checking auth or redirecting
  if (isLoading || isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('[LoginPage] Already submitting, ignoring duplicate request');
      return;
    }

    setError('');
    setIsSubmitting(true);
    console.log('[LoginPage] Form submitted with email:', email);

    try {
      // Validate form
      if (!email) {
        setError('Please enter your email address');
        setIsSubmitting(false);
        return;
      }

      // Allowed domains check for security (restrict to company emails)
      const allowedDomain = 'gmail.com';
      if (!email.toLowerCase().endsWith(allowedDomain)) {
        setError(`Please use your ${allowedDomain} email address.`);
        setIsSubmitting(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('[LoginPage] Sending magic link to:', email);
      await sendMagicLink(email, redirectUrl);
      console.log('[LoginPage] Magic link sent successfully');
      setIsSubmitted(true);
      
      // Add cooldown to prevent rapid retries (60 seconds)
      submitTimeoutRef.current = setTimeout(() => {
        setIsSubmitting(false);
      }, 60000);
    } catch (err: unknown) {
      console.error('[LoginPage] Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      if (err instanceof Error && err.message.includes('429')) {
        setError('Too many requests. Please wait a moment and try again.');
        // Add longer cooldown for rate limit errors (90 seconds)
        submitTimeoutRef.current = setTimeout(() => {
          setIsSubmitting(false);
        }, 90000);
      } else {
        setError(errorMessage);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="p-8">
          {/* Header - Only show on login form */}
          {!isSubmitted && (
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Panel</h1>
              <p className="text-slate-600">Sign in to your account</p>
            </div>
          )}

          {/* Conditional Rendering for Success Screen */}
          {isSubmitted ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
              <p className="text-slate-600">
                We've sent a secure login link to <br />
                <span className="font-semibold text-slate-900">{email}</span>
              </p>
              <p className="text-sm text-slate-500">
                Click the link in the email to sign in instantly. The link will expire shortly.
              </p>

              <Button
                variant="outline"
                className="w-full mt-6"
                onClick={() => setIsSubmitted(false)}
              >
                Back to login
              </Button>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Company Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="admin@company.com"
                    disabled={isSubmitting || isLoading}
                    className="transition-all duration-200"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full mt-6 transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  {isSubmitting || isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" />
                      Sending Link...
                    </div>
                  ) : (
                    'Send Login Link'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-sm text-slate-500">or</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              {/* Demo Credentials */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-6">
                <p className="text-xs font-medium text-blue-900 mb-2">Passwordless Login</p>
                <p className="text-xs text-blue-700">No passwords needed. Just enter your company email to receive a secure sign-in link.</p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

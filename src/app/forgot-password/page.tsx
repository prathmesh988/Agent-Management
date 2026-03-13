'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);

    try {
      // Validate email
      if (!email) {
        setError('Please enter your email address');
        setIsSubmitting(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }

      // In a real app, you would call the password reset function from auth service
      // For now, we'll show a success message
      setSuccess(true);
      setEmail('');

      // In production, redirect after showing success for 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      const errorMessage = err.message || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center">
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h1>
            <p className="text-slate-600">Enter your email to receive reset instructions</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Check your email</p>
                <p className="text-sm text-green-700 mt-1">
                  We&apos;ve sent you a password reset link. Please check your email inbox.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Reset Form */}
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="john@company.com"
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
                    Sending reset email...
                  </div>
                ) : (
                  'Send Reset Email'
                )}
              </Button>
            </form>
          ) : null}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 <strong>Tip:</strong> Reset links typically expire after 1 hour for security reasons.
            </p>
          </div>

          {/* Links */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-slate-600">
              Remember your password?{' '}
              <Link href="/login">
                <span className="text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium">
                  Sign in
                </span>
              </Link>
            </p>
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup">
                <span className="text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium">
                  Sign up
                </span>
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

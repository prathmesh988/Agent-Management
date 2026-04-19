'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Loader, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyMagicLink, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // If somehow already authenticated, just redirect
    if (isAuthenticated) {
      router.push('/admin/dashboard');
      return;
    }

    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    console.log('[AuthCallback] Raw URL params - userId:', userId, 'secret:', secret ? 'present' : 'missing');
    console.log('[AuthCallback] Full search params:', searchParams.toString());

    if (!userId || !secret) {
      setStatus('error');
      setErrorMessage('Invalid or missing authentication link parameters. Please request a new login link.');
      return;
    }

    const handleVerification = async () => {
      try {
        console.log('[AuthCallback] Starting magic link verification...');
        console.log('[AuthCallback] Attempting to verify with userId:', userId);
        await verifyMagicLink(userId, secret);
        console.log('[AuthCallback] Magic link verified successfully');

        // Auto-assign 'new_user' label if this is the first login (no role label yet)
        // We need the verified user's ID — re-read it from Appwrite client-side
        try {
          const { account: appwriteAccount } = await import('@/services/auth');
          const verifiedUser = await appwriteAccount.get();
          console.log('[AuthCallback] Verified user:', verifiedUser.$id);
          
          const initResponse = await fetch(`/api/admin/users/${verifiedUser.$id}/check-or-init`, {
            method: 'POST',
          });
          
          const initData = await initResponse.json();
          console.log('[AuthCallback] check-or-init response:', initData);
          
          if (!initResponse.ok) {
            console.warn('[AuthCallback] check-or-init failed:', initData.error);
          }
        } catch (initErr) {
          // Non-fatal — the layout will handle role enforcement
          console.warn('[AuthCallback] check-or-init error:', initErr);
        }

        setStatus('success');
        // Add a small delay to ensure cookies are persisted before redirecting
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 500);
      } catch (error: unknown) {
        setStatus('error');
        const message = error instanceof Error ? error.message : 'Failed to verify login link. It may have expired.';
        console.error('[AuthCallback] Verification error:', error);
        
        // Log more detailed error info
        if (error instanceof Error) {
          console.error('[AuthCallback] Error name:', error.name);
          console.error('[AuthCallback] Error message:', error.message);
          console.error('[AuthCallback] Error stack:', error.stack);
        }
        
        setErrorMessage(message);
      }
    };

    handleVerification();
  }, [searchParams, verifyMagicLink, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <div className="p-8 text-center space-y-6">
          <div className="mb-4 flex justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900">Checking credentials</h1>

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader className="h-8 w-8 text-blue-600 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Verifying your secure login link...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-emerald-700">Login verified! Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6 py-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-left">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
                  <p className="text-xs text-red-700 mt-2">
                    If the link has expired, you can request a new one. Magic links are valid for a limited time.
                  </p>
                  <p className="text-xs text-red-700 mt-2">
                    💡 <strong>Debugging tip:</strong> Open your browser console (F12) to see detailed error information.
                  </p>
                </div>
              </div>
              <Link href="/login" className="block w-full">
                <Button className="w-full transition-all duration-200 hover:shadow-md">
                  Return to Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Fallback component
function AuthCallbackFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <div className="p-8 text-center space-y-6">
          <div className="mb-4 flex justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Verifying login...</h1>
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Please wait...</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Wrap with Suspense
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
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
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        setIsSubmitting(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }

      await login(formData.email, formData.password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Login failed. Please try again.';
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
                Email Address
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@company.com"
                disabled={isSubmitting || isLoading}
                className="transition-all duration-200"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
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
                  Signing in...
                </div>
              ) : (
                'Sign In'
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
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <p className="text-xs font-medium text-blue-900 mb-2">Demo Credentials:</p>
            <p className="text-xs text-blue-700">Email: demo@company.com</p>
            <p className="text-xs text-blue-700">Password: Demo@12345</p>
          </div>

          {/* Links */}
          <div className="text-center space-y-2">
            <Link href="/forgot-password">
              <p className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200">
                Forgot your password?
              </p>
            </Link>
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
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

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

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
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

      // Password validation
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        setIsSubmitting(false);
        return;
      }

      // Password match validation
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsSubmitting(false);
        return;
      }

      await signup(formData.email, formData.password, formData.name);
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorMessage = err.message || 'Signup failed. Please try again.';
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
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
            <p className="text-slate-600">Sign up for admin access</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                disabled={isSubmitting || isLoading}
                className="transition-all duration-200"
              />
            </div>

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
                placeholder="john@company.com"
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
              <p className="text-xs text-slate-500">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
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
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Terms */}
          <p className="text-xs text-slate-500 text-center mt-4">
            By signing up, you agree to our{' '}
            <Link href="/terms">
              <span className="text-blue-600 hover:text-blue-700">Terms of Service</span>
            </Link>
          </p>

          {/* Links */}
          <div className="text-center mt-4">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login">
                <span className="text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium">
                  Sign in
                </span>
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

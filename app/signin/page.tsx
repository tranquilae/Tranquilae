'use client';

// Prevent prerendering
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithPassword } from '@/lib/supabaseClient';
import { getUserBySupabaseId } from '@/lib/neonClient';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign in with Supabase
      const { user } = await signInWithPassword(email, password);
      
      if (user) {
        // Check if user exists in Neon and get onboarding status
        try {
          const neonUser = await getUserBySupabaseId(user.id);
          
          if (neonUser?.onboarded) {
            router.push('/dashboard');
          } else {
            router.push('/onboarding');
          }
        } catch (neonError) {
          // User might not exist in Neon yet, redirect to onboarding
          console.warn('User not found in Neon, redirecting to onboarding');
          router.push('/onboarding');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 px-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient">Welcome Back</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Sign in to your Tranquilae account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="accent-button w-full py-3 px-4 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link 
                href="/signup" 
                className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 transition-colors"
              >
                Sign up here
              </Link>
            </p>
            
            <div className="mt-4">
              <Link 
                href="/auth/reset-password" 
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

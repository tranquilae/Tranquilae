'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase, onAuthStateChange } from '@/lib/supabaseClient';
import { getUserBySupabaseId } from '@/lib/neonClient';

interface AuthContextType {
  user: User | null;
  neonUser: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/signin', '/signup', '/auth', '/terms', '/privacy'];

// Routes that require authentication but allow incomplete onboarding
const AUTH_ROUTES = ['/onboarding'];

// Routes that require completed onboarding
const DASHBOARD_ROUTES = ['/dashboard'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [neonUser, setNeonUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current route requires auth but allows incomplete onboarding
  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current route requires completed onboarding
  const isDashboardRoute = DASHBOARD_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await loadNeonUser(session.user.id);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        setUser(session.user);
        await loadNeonUser(session.user.id);
      } else {
        setUser(null);
        setNeonUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load user data from Neon
  const loadNeonUser = async (userId: string) => {
    try {
      const neonUserData = await getUserBySupabaseId(userId);
      setNeonUser(neonUserData);
    } catch (error) {
      console.warn('Could not load Neon user data:', error);
      // Don't fail the auth flow if Neon user doesn't exist yet
      setNeonUser(null);
    }
  };

  // Handle route protection
  useEffect(() => {
    if (loading) return;

    // Redirect logic based on auth state and route
    if (!user) {
      // User not authenticated
      if (!isPublicRoute) {
        console.log('Redirecting to signin - not authenticated');
        router.push('/signin');
      }
    } else {
      // User is authenticated
      if (isPublicRoute && (pathname === '/signin' || pathname === '/signup')) {
        // Don't redirect authenticated users away from auth pages immediately
        // Let them complete the flow naturally
        return;
      }

      // Check onboarding status for dashboard routes
      if (isDashboardRoute && (!neonUser || !neonUser.onboarded)) {
        console.log('Redirecting to onboarding - user not onboarded');
        router.push('/onboarding');
      } else if (pathname === '/onboarding' && neonUser?.onboarded) {
        console.log('Redirecting to dashboard - user already onboarded');
        router.push('/dashboard');
      }
    }
  }, [user, neonUser, loading, pathname, isPublicRoute, isAuthRoute, isDashboardRoute, router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setNeonUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    neonUser,
    loading,
    signOut: handleSignOut,
  };

  // Show loading spinner while determining auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="glass-card p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="text-lg font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

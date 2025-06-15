
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserProfile } from '@/lib/api';
import type { User, ApiError } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from './i18n-context';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  setTokenManually: (newToken: string) => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'financeflow_jwt_token';
const DUMMY_USER: User = {
  id: '0',
  login: 'Dev User',
  email: 'dev@example.com',
  memberSince: new Date().toISOString()
};
const DUMMY_TOKEN = 'dev-mode-active-dummy-token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchUserCallback = useCallback(async (currentTokenValue: string) => {
    if (currentTokenValue === DUMMY_TOKEN) {
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      setIsLoading(false);
      return;
    }
    // setIsLoading(true); // Set loading true before async operation - this is handled by callers or initial effect.
    try {
      const userData = await fetchUserProfile(currentTokenValue);
      setUser(userData);
      setToken(currentTokenValue);
      toast({ title: t('tokenValidationSuccess') });
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      toast({
        variant: "destructive",
        title: t('profileFetchErrorTitle'),
        description: `${t('profileFetchErrorDesc')} ${(error as ApiError).message || ''}`
      });
      setUser(null);
      setToken(currentTokenValue); // Keep token so user can see it in set-token page if redirect happens
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    setIsLoading(true); // Ensure loading is true at the start of this effect
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (storedToken) {
      fetchUserCallback(storedToken);
    } else {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/set-token') {
        setUser(DUMMY_USER);
        setToken(DUMMY_TOKEN);
        if (typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN);
      }
      setIsLoading(false); // Set loading false if no token and not fetching
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs only once on mount.

  const login = useCallback(async (email: string) => {
    setIsLoading(true);
    // Simulate API call for login for dev mode
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(DUMMY_USER);
    setToken(DUMMY_TOKEN);
    if (typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN);
    toast({ title: "Dev Mode Active", description: "Login is bypassed. Welcome!" });
    setIsLoading(false);
    router.push('/dashboard');
  }, [router, toast]);

  const logout = useCallback(() => {
    setIsLoading(true);
    setUser(null); // More realistic logout
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY); // Clear the token
    }
    // Re-enable dummy token for next page load if not login/set-token for dev convenience
    // This part is tricky; for now, let's just clear and redirect.
    // The useEffect on mount will handle setting dummy token if appropriate.
    toast({ title: t('logoutSuccessTitle'), description: "You have been logged out." });
    setIsLoading(false);
    router.push('/login');
  }, [router, toast, t]);

  const setTokenManually = useCallback(async (newToken: string) => {
    setIsLoading(true);
    const trimmedNewToken = newToken.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, trimmedNewToken);
    }
    if (!trimmedNewToken) {
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      toast({ title: t('tokenClearedTitle'), description: t('revertedToDevModeDesc') });
      setIsLoading(false);
    } else {
      await fetchUserCallback(trimmedNewToken);
      // fetchUserCallback handles setIsLoading(false)
    }
  }, [fetchUserCallback, toast, t]);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    const currentTokenValue = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (currentTokenValue) {
      await fetchUserCallback(currentTokenValue);
      // fetchUserCallback handles setIsLoading(false)
    } else {
      // If no token, potentially set to dummy state or just ensure loading is false
      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/set-token') {
          setUser(DUMMY_USER);
          setToken(DUMMY_TOKEN);
      } else {
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    }
  }, [fetchUserCallback]);

  const isAuthenticated = !!user && !!token; // Simpler check: if user and token exist

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, logout, setTokenManually, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


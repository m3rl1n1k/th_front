
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
  memberSince: new Date().toISOString(),
  userCurrency: { code: 'USD' } // Added default currency for dummy user
};
const DUMMY_TOKEN = 'dev-mode-active-dummy-token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchUserCallback = useCallback(async (currentTokenValue: string) => {
    setIsLoading(true); // Set loading true before this async operation
    if (currentTokenValue === DUMMY_TOKEN) {
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      setIsLoading(false);
      return;
    }
    try {
      const userData = await fetchUserProfile(currentTokenValue);
      setUser(userData); // userData should include userCurrency
      setToken(currentTokenValue);
      toast({ title: t('tokenValidationSuccess') });
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      toast({
        variant: "destructive",
        title: t('profileFetchErrorTitle'),
        description: `${t('profileFetchErrorDesc')} ${(error as ApiError).message || ''}`
      });
      setUser(null); // Clear user on error
      setToken(currentTokenValue); 
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    setIsLoading(true); 
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (storedToken) {
      fetchUserCallback(storedToken);
    } else {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/set-token') {
        setUser(DUMMY_USER);
        setToken(DUMMY_TOKEN);
        if (typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN);
      }
      setIsLoading(false); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run once on mount

  const login = useCallback(async (email: string) => {
    setIsLoading(true);
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
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
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
    }
  }, [fetchUserCallback, toast, t]);

  const fetchUser = useCallback(async () => {
    // setIsLoading(true); // This might be redundant if fetchUserCallback handles it
    const currentTokenValue = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (currentTokenValue) {
      await fetchUserCallback(currentTokenValue);
    } else {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/set-token') {
          setUser(DUMMY_USER);
          setToken(DUMMY_TOKEN);
      } else {
        setUser(null);
        setToken(null);
      }
      setIsLoading(false); // Ensure loading is false if no token to fetch with
    }
  }, [fetchUserCallback]);

  const isAuthenticated = !!user && !!token;

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

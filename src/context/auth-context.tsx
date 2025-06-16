
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
  userCurrency: { code: 'USD' }
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
    setIsLoading(true);
    if (currentTokenValue === DUMMY_TOKEN) {
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      setIsLoading(false);
      return;
    }
    try {
      const userData = await fetchUserProfile(currentTokenValue);
      setUser(userData);
      setToken(currentTokenValue);
      // toast({ title: t('tokenValidationSuccess') }); // Optional: can be noisy
    } catch (error) {
      setUser(null);
      setToken(null); // Clear token state
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY); // Remove invalid token from storage
      }
      toast({
        variant: "destructive",
        title: t('profileFetchErrorTitle'),
        description: `${t('profileFetchErrorDesc')} ${(error as ApiError).message || t('pleaseLoginAgain')}`
      });
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;

    if (storedToken) {
      fetchUserCallback(storedToken); // This sets isLoading internally and then false in finally
    } else {
      // No stored token logic (Dev mode fallback)
      if (process.env.NODE_ENV === 'development' || true) { 
        setUser(DUMMY_USER);
        setToken(DUMMY_TOKEN);
        if (typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN);
      } else {
        setUser(null);
        setToken(null);
      }
      if (isActive) setIsLoading(false);
    }
    return () => { isActive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUserCallback]); // fetchUserCallback is memoized

  const login = useCallback(async (email: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
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
    toast({ title: t('logoutSuccessTitle'), description: t('logoutSuccessDesc') });
    setIsLoading(false);
    router.push('/login');
  }, [router, toast, t]);

  const setTokenManually = useCallback(async (newToken: string) => {
    setIsLoading(true);
    const trimmedNewToken = newToken.trim();
    
    if (!trimmedNewToken) { // User cleared the token input
      setUser(DUMMY_USER); // Revert to dummy user for dev
      setToken(DUMMY_TOKEN);
      if (typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN);
      toast({ title: t('tokenClearedTitle'), description: t('revertedToDevModeDesc') });
      setIsLoading(false);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, trimmedNewToken);
      }
      await fetchUserCallback(trimmedNewToken); // This will set isLoading to false in its finally
    }
  }, [fetchUserCallback, toast, t]);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    const currentTokenValue = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (currentTokenValue) {
      await fetchUserCallback(currentTokenValue); // Manages its own isLoading
    } else {
      if (process.env.NODE_ENV === 'development' || true) {
          setUser(DUMMY_USER);
          setToken(DUMMY_TOKEN);
      } else {
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
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

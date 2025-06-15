
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
      setToken(currentTokenValue); 
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, t]); 

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (storedToken) {
      fetchUserCallback(storedToken);
    } else {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/set-token') {
        setUser(DUMMY_USER);
        setToken(DUMMY_TOKEN);
        localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN);
      }
      setIsLoading(false);
    }
  }, [fetchUserCallback]);

  const login = useCallback(async (email: string) => {
    setUser(DUMMY_USER);
    setToken(DUMMY_TOKEN);
    if (typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN);
    toast({ title: "Dev Mode Active", description: "Login is bypassed. Welcome!" });
    router.push('/dashboard');
  }, [router, toast]);

  const logout = useCallback(() => {
    setUser(DUMMY_USER); 
    setToken(DUMMY_TOKEN); 
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN); 
    }
    toast({ title: "Dev Mode Logout", description: "Simulated logout. Redirecting..." });
    router.push('/login');
  }, [router, toast]);

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
    setIsLoading(true);
    const currentTokenValue = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (currentTokenValue) {
      await fetchUserCallback(currentTokenValue);
    } else {
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      setIsLoading(false);
    }
  }, [fetchUserCallback]);

  const isAuthenticated = !!user && !!token && token !== DUMMY_TOKEN ? true : (token === DUMMY_TOKEN);

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

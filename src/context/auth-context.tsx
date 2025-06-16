
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

  const saveTokenToStorages = (tokenValue: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, tokenValue);
      sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenValue);
    }
  };

  const removeTokenFromStorages = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  };

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
      saveTokenToStorages(currentTokenValue); // Ensure it's in both if valid
    } catch (error) {
      setUser(null);
      setToken(null);
      removeTokenFromStorages();
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
    
    let initialToken: string | null = null;
    if (typeof window !== 'undefined') {
      initialToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (!initialToken) {
        initialToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (initialToken) {
          // If found in localStorage but not sessionStorage, copy to sessionStorage for current session
          sessionStorage.setItem(TOKEN_STORAGE_KEY, initialToken);
        }
      }
    }

    if (initialToken) {
      fetchUserCallback(initialToken);
    } else {
      if (process.env.NODE_ENV === 'development' || true) { 
        setUser(DUMMY_USER);
        setToken(DUMMY_TOKEN);
        saveTokenToStorages(DUMMY_TOKEN);
      } else {
        setUser(null);
        setToken(null);
      }
      if (isActive) setIsLoading(false);
    }
    return () => { isActive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUserCallback]);

  const login = useCallback(async (email: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); 
    setUser(DUMMY_USER);
    setToken(DUMMY_TOKEN);
    saveTokenToStorages(DUMMY_TOKEN);
    toast({ title: "Dev Mode Active", description: "Login is bypassed. Welcome!" });
    setIsLoading(false);
    router.push('/dashboard');
  }, [router, toast]);

  const logout = useCallback(() => {
    setIsLoading(true);
    setUser(null);
    setToken(null);
    removeTokenFromStorages();
    toast({ title: t('logoutSuccessTitle'), description: t('logoutSuccessDesc') });
    setIsLoading(false);
    router.push('/login');
  }, [router, toast, t]);

  const setTokenManually = useCallback(async (newTokenValue: string) => {
    setIsLoading(true);
    const trimmedNewToken = newTokenValue.trim();
    
    if (!trimmedNewToken) { 
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      saveTokenToStorages(DUMMY_TOKEN);
      toast({ title: t('tokenClearedTitle'), description: t('revertedToDevModeDesc') });
      setIsLoading(false);
    } else {
      // Save to storages first, then attempt fetch. 
      // fetchUserCallback will handle removal if validation fails.
      saveTokenToStorages(trimmedNewToken); 
      await fetchUserCallback(trimmedNewToken);
    }
  }, [fetchUserCallback, toast, t]);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    let currentTokenValue: string | null = null;
    if (typeof window !== 'undefined') {
      currentTokenValue = sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    
    if (currentTokenValue) {
      await fetchUserCallback(currentTokenValue);
    } else {
      if (process.env.NODE_ENV === 'development' || true) {
          setUser(DUMMY_USER);
          setToken(DUMMY_TOKEN);
          saveTokenToStorages(DUMMY_TOKEN);
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

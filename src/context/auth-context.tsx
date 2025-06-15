"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, fetchUserProfile } from '@/lib/api';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from './i18n-context'; // Assuming t is exported or available

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  setTokenManually: (newToken: string) => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'financeflow_jwt_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchUserCallback = useCallback(async (currentToken: string) => {
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const userData = await fetchUserProfile(currentToken);
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      setUser(null);
      setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
      // Optionally, redirect to login or show a toast
      // router.push('/login'); // This might be too aggressive if user is on a public page
    } finally {
      setIsLoading(false);
    }
  }, [router]);


  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (storedToken) {
      setToken(storedToken);
      fetchUserCallback(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [fetchUserCallback]);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser, token: newToken } = await loginUser(email);
      setUser(loggedInUser as User); // Assuming loginUser returns an object with a login property for username
      setToken(newToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      }
      router.push('/dashboard');
      toast({ title: t('loginSuccessTitle'), description: t('loginSuccessDesc') });
    } catch (error: any) {
      console.error("Login failed", error);
      toast({ variant: "destructive", title: t('loginFailedTitle'), description: error.message || t('loginFailedDesc') });
      setUser(null);
      setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    router.push('/login');
    toast({ title: t('logoutSuccessTitle') });
  }, [router, t, toast]);

  const setTokenManually = (newToken: string) => {
    setIsLoading(true);
    if (newToken) {
      setToken(newToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      }
      fetchUserCallback(newToken).finally(() => setIsLoading(false));
      toast({ title: t('tokenSetTitle'), description: t('tokenSetDesc') });
    } else {
      logout();
      setIsLoading(false);
    }
  };
  
  const fetchUser = async () => {
    if (token) {
      await fetchUserCallback(token);
    }
  };


  const isAuthenticated = !!token && !!user;

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

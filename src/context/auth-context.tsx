
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, fetchUserProfile } from '@/lib/api';
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
  setTokenManually: (newToken: string) => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'financeflow_jwt_token';
const DUMMY_USER: User = { 
  id: '0', 
  login: 'Dev User', 
  email: 'dev@example.com',
  memberSince: new Date().toISOString() // Add a default memberSince for dummy user
};
const DUMMY_TOKEN = 'dev-mode-active-dummy-token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(DUMMY_USER);
  const [token, setToken] = useState<string | null>(DUMMY_TOKEN);
  const [isLoading, setIsLoading] = useState(false); 
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchUserCallback = useCallback(async (currentToken: string) => {
    if (!currentToken || currentToken === DUMMY_TOKEN) {
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN); 
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const userData = await fetchUserProfile(currentToken);
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user profile with real token", error);
      toast({ variant: "destructive", title: "Profile Fetch Error", description: (error as ApiError).message || "Could not load profile with the provided token." });
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY); 
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (storedToken && storedToken !== DUMMY_TOKEN) {
      setToken(storedToken); 
      fetchUserCallback(storedToken); 
    } else {
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      setIsLoading(false);
    }
  }, [fetchUserCallback]);

  const login = async (email: string) => {
    setUser(DUMMY_USER);
    setToken(DUMMY_TOKEN);
    setIsLoading(false);
    toast({ title: "Dev Mode Active", description: "Login is bypassed. Welcome!" });
    router.push('/dashboard');
  };

  const logout = useCallback(() => {
    setUser(DUMMY_USER); 
    setToken(DUMMY_TOKEN);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY); 
    }
    toast({ title: "Dev Mode Logout", description: "Simulated logout. Redirecting..." });
    router.push('/login'); 
  }, [router, toast]);

  const setTokenManually = (newToken: string) => {
    setIsLoading(true);
    if (newToken && newToken.trim() !== "" && newToken !== DUMMY_TOKEN) {
      setToken(newToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      }
      fetchUserCallback(newToken).finally(() => setIsLoading(false));
      toast({ title: t('tokenSetTitle'), description: t('tokenSetDesc') });
    } else {
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY); 
      }
      setIsLoading(false);
      toast({ title: "Token Reset", description: "Reverted to default dev mode authentication." });
      if (newToken === DUMMY_TOKEN) {
        toast({ title: "Dev Mode Confirmed", description: "Using default dev mode authentication." });
      }
    }
  };
  
  const fetchUser = async () => {
    if (token && token !== DUMMY_TOKEN) {
      await fetchUserCallback(token);
    } else {
      setUser(DUMMY_USER); 
      setToken(DUMMY_TOKEN); 
      setIsLoading(false);
    }
  };

  const isAuthenticated = true; 

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

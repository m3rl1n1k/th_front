
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
const DUMMY_USER: User = { id: '0', login: 'Dev User', email: 'dev@example.com' };
const DUMMY_TOKEN = 'dev-mode-active-dummy-token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(DUMMY_USER);
  const [token, setToken] = useState<string | null>(DUMMY_TOKEN);
  const [isLoading, setIsLoading] = useState(false); // Start as not loading
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchUserCallback = useCallback(async (currentToken: string) => {
    if (!currentToken || currentToken === DUMMY_TOKEN) {
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN); // Ensure dummy token if current is invalid or dummy
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const userData = await fetchUserProfile(currentToken);
      setUser(userData);
      // Token is already set from outside (e.g. localStorage or setTokenManually)
    } catch (error) {
      console.error("Failed to fetch user profile with real token", error);
      toast({ variant: "destructive", title: "Profile Fetch Error", description: (error as ApiError).message || "Could not load profile with the provided token." });
      // Revert to dummy state if fetching real user fails to maintain "auth off" experience
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY); // Remove invalid real token
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // This effect allows a "real" token from localStorage to override the dummy token for API testing.
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (storedToken && storedToken !== DUMMY_TOKEN) {
      setToken(storedToken); // Set the real token
      fetchUserCallback(storedToken); // Attempt to fetch user with this real token
    } else {
      // Default to dummy user/token if no real token is stored or if stored token is the dummy one
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
    setUser(DUMMY_USER); // Reset to dummy state
    setToken(DUMMY_TOKEN);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY); // Clear any potentially "real" token
    }
    toast({ title: "Dev Mode Logout", description: "Simulated logout. Redirecting..." });
    router.push('/login'); // This will then redirect to dashboard due to login page changes
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
      // Setting empty or dummy token, ensure dummy state
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY); // Remove if it was a real token
      }
      setIsLoading(false);
      toast({ title: "Token Reset", description: "Reverted to default dev mode authentication." });
      // If they set the dummy token explicitly, we can just confirm it.
      if (newToken === DUMMY_TOKEN) {
        toast({ title: "Dev Mode Confirmed", description: "Using default dev mode authentication." });
      }
    }
  };
  
  const fetchUser = async () => {
    // This function is typically called if user data is missing but token exists.
    // In "auth off" mode, we mostly rely on the dummy user.
    // It will only try to fetch if a non-dummy token is present.
    if (token && token !== DUMMY_TOKEN) {
      await fetchUserCallback(token);
    } else {
      setUser(DUMMY_USER); // Ensure dummy user is set
      setToken(DUMMY_TOKEN); // Ensure dummy token is set
      setIsLoading(false);
    }
  };

  const isAuthenticated = true; // Auth is always "on" in this mode

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

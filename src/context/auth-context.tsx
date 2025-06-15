
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserProfile } from '@/lib/api'; // loginUser removed as it's part of dummy flow now
import type { User, ApiError } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from './i18n-context';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean; // In dev mode, this is mainly for UI display consistency
  login: (email: string) => Promise<void>; // Kept for conceptual flow, though simplified
  logout: () => void;
  setTokenManually: (newToken: string) => Promise<void>; // Changed to Promise
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
  const [user, setUser] = useState<User | null>(null); // Initial state null
  const [token, setToken] = useState<string | null>(null); // Initial state null
  const [isLoading, setIsLoading] = useState(true); // Start true until initial effect determines state
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchUserCallback = useCallback(async (currentTokenValue: string | null) => {
    if (!currentTokenValue || currentTokenValue === DUMMY_TOKEN) {
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      if (typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userData = await fetchUserProfile(currentTokenValue);
      setUser(userData);
      setToken(currentTokenValue); // Token is valid, keep it
      // localStorage is assumed to be already set with currentTokenValue
    } catch (error) {
      console.error("Failed to fetch user profile with token:", currentTokenValue, error);
      toast({
        variant: "destructive",
        title: t('profileFetchErrorTitle') || "Profile Fetch Error",
        description: `${t('profileFetchErrorDesc') || "Could not validate token."} ${(error as ApiError).message || ''}`
      });
      setUser(null); // Set user to null to indicate failed validation
      setToken(currentTokenValue); // Keep the problematic token
      // localStorage still holds currentTokenValue, which is problematic
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    // No immediate setIsLoading(true) here, fetchUserCallback handles it if needed.
    fetchUserCallback(storedToken); // Will default to DUMMY if storedToken is null/empty/DUMMY_TOKEN
                                     // Or will attempt to validate a real storedToken.
                                     // isLoading is handled by fetchUserCallback.
  }, [fetchUserCallback]);


  const login = async (email: string) => {
    // In this "auth off" mode, login just sets to dummy user and redirects.
    setUser(DUMMY_USER);
    setToken(DUMMY_TOKEN);
    if (typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN);
    setIsLoading(false); // Ensure loading is false
    toast({ title: "Dev Mode Active", description: "Login is bypassed. Welcome!" });
    router.push('/dashboard');
  };

  const logout = useCallback(() => {
    setUser(DUMMY_USER); // Revert to dummy user on logout
    setToken(DUMMY_TOKEN); // Revert to dummy token
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN); // Explicitly set dummy token or remove
    }
    toast({ title: "Dev Mode Logout", description: "Simulated logout. Redirecting..." });
    router.push('/login');
  }, [router, toast]);

  const setTokenManually = useCallback(async (newToken: string) => {
    setIsLoading(true); // Set loading true at the start
    const trimmedNewToken = newToken.trim();

    if (trimmedNewToken && trimmedNewToken !== DUMMY_TOKEN) {
      // A real token is being set
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, trimmedNewToken);
      }
      // Now validate it. fetchUserCallback will set user and token states appropriately.
      // It will also handle setIsLoading(false) in its finally block.
      await fetchUserCallback(trimmedNewToken);
      // The toast for successful token validation (or failure) is handled in fetchUserCallback
      // We can add a generic "token processing attempted" toast here if desired,
      // or rely on fetchUserCallback's more specific toasts.
      // For now, let's assume fetchUserCallback's toasts are sufficient.
      // If fetchUserCallback succeeded, a success toast isn't strictly necessary from here.
      // If it failed, error toast is already shown.
      // A simple "Token updated" could be:
      // toast({ title: t('tokenSetTitle'), description: t('tokenUpdatedDesc') });
    } else {
      // Empty token or DUMMY_TOKEN explicitly provided, revert to full dummy state
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN);
      }
      toast({ title: t('tokenClearedTitle') || "Token Cleared", description: t('revertedToDevModeDesc') || "Reverted to default dev mode." });
      setIsLoading(false); // Ensure loading is stopped
    }
    // setIsLoading(false) is called within fetchUserCallback or directly if reverting to DUMMY
  }, [fetchUserCallback, toast, t]);

  const fetchUser = async () => {
    if (token) { // token can be real or DUMMY_TOKEN
      await fetchUserCallback(token);
    } else { // No token at all (should be rare after initial load)
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      if (typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN);
      setIsLoading(false);
    }
  };

  const isAuthenticated = true; // Keep UI navigable in dev mode

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



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
  isLoading: boolean; // AuthContext's internal loading state for initial validation
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
  const [isLoading, setIsLoading] = useState(true); // True until initial token check is done
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Effect for initial token loading and validation. Runs once on mount.
  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    
    setIsLoading(true); // Start auth loading
    if (!storedToken || storedToken === DUMMY_TOKEN) {
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      if (typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN);
      setIsLoading(false); // End auth loading
    } else {
      fetchUserProfile(storedToken)
        .then(userData => {
          setUser(userData);
          setToken(storedToken);
          // toast({ title: t('tokenValidationSuccess') }); // Optional: toast for success
        })
        .catch(error => {
          console.error("Initial token validation failed:", error);
          toast({
            variant: "destructive",
            title: t('profileFetchErrorTitle'),
            description: `${t('profileFetchErrorDesc')} ${(error as ApiError).message || ''}`
          });
          setUser(null); // Correctly set user to null
          setToken(storedToken); // Keep the problematic token for clarity
          // localStorage is already set with storedToken. API layer handles 401 redirect.
        })
        .finally(() => {
          setIsLoading(false); // End auth loading
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  // Memoized callback for fetching user profile with the current token.
  // This is used internally by setTokenManually and the exported fetchUser.
  const fetchUserWithCurrentToken = useCallback(async (currentTokenValue: string | null) => {
    if (!currentTokenValue || currentTokenValue === DUMMY_TOKEN) {
      setUser(DUMMY_USER);
      setToken(DUMMY_TOKEN);
      if (typeof window !== 'undefined') localStorage.setItem(TOKEN_STORAGE_KEY, DUMMY_TOKEN);
      return; // No actual fetching needed for dummy token
    }

    // For real tokens, attempt to fetch user profile
    try {
      const userData = await fetchUserProfile(currentTokenValue);
      setUser(userData);
      setToken(currentTokenValue);
      toast({ title: t('tokenValidationSuccess') });
    } catch (error) {
      console.error("Failed to fetch user profile with token:", currentTokenValue, error);
      toast({
        variant: "destructive",
        title: t('profileFetchErrorTitle'),
        description: `${t('profileFetchErrorDesc')} ${(error as ApiError).message || ''}`
      });
      setUser(null);
      setToken(currentTokenValue); // Keep problematic token
    }
  }, [toast, t]);


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
    
    await fetchUserWithCurrentToken(trimmedNewToken); // Validate and set user/token state
    
    // If fetchUserWithCurrentToken resulted in DUMMY_TOKEN (e.g. empty input)
    if (!trimmedNewToken || trimmedNewToken === DUMMY_TOKEN) {
        toast({ title: t('tokenClearedTitle'), description: t('revertedToDevModeDesc') });
    }
    // Success/error toasts for real tokens are handled within fetchUserWithCurrentToken

    setIsLoading(false);
  }, [fetchUserWithCurrentToken, toast, t]);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    await fetchUserWithCurrentToken(token); // Use the current token from state
    setIsLoading(false);
  }, [token, fetchUserWithCurrentToken]);

  const isAuthenticated = true; // Dev mode always "authenticated" for UI purposes

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

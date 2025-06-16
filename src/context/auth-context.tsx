
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchUserProfile, loginUser as apiLoginUser, registerUser as apiRegisterUser } from '@/lib/api';
import type { User, ApiError, LoginCredentials, RegistrationPayload, LoginResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from './i18n-context';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegistrationPayload) => Promise<void>;
  logout: () => void;
  setTokenManually: (newToken: string) => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'financeflow_jwt_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Changed to state
  const router = useRouter();
  const pathname = usePathname();
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

  const clearAuthArtefacts = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false); // Update isAuthenticated state
    removeTokenFromStorages();
  }, []);

  const fetchAndSetUser = useCallback(async (currentTokenValue: string, shouldSaveToken = true) => {
    try {
      const userData = await fetchUserProfile(currentTokenValue);
      setUser(userData);
      setToken(currentTokenValue);
      setIsAuthenticated(true); // Update isAuthenticated state
      if (shouldSaveToken) {
        saveTokenToStorages(currentTokenValue);
      }
      return userData;
    } catch (error) {
      clearAuthArtefacts();
      throw error;
    }
  }, [clearAuthArtefacts]);

  useEffect(() => {
    let isActive = true;
    const initializeAuth = async () => {
      setIsLoading(true);
      let initialToken: string | null = null;
      if (typeof window !== 'undefined') {
        initialToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
        if (initialToken && sessionStorage.getItem(TOKEN_STORAGE_KEY) !== initialToken) {
          sessionStorage.setItem(TOKEN_STORAGE_KEY, initialToken);
        }
      }

      if (initialToken) {
        try {
          await fetchAndSetUser(initialToken, false);
        } catch (error) {
          toast({
            variant: "destructive",
            title: t('sessionExpiredTitle'),
            description: (error as ApiError).message || t('sessionExpiredDesc'),
          });
          if (pathname !== '/login' && pathname !== '/register' && !pathname.startsWith('/terms') && pathname !== '/') {
            router.replace('/login');
          }
        }
      } else {
        clearAuthArtefacts(); // Ensure state is cleared if no token
      }
      if (isActive) setIsLoading(false);
    };

    initializeAuth();
    return () => { isActive = false; };
  }, [fetchAndSetUser, t, pathname, router, clearAuthArtefacts]); // Added clearAuthArtefacts

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response: LoginResponse = await apiLoginUser(credentials);
      await fetchAndSetUser(response.token);
      // setIsAuthenticated(true) is called within fetchAndSetUser
      toast({ title: t('loginSuccessTitle'), description: t('loginSuccessDesc') });
      router.push('/dashboard');
    } catch (error) {
      clearAuthArtefacts();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAndSetUser, router, toast, t, clearAuthArtefacts]);

  const register = useCallback(async (payload: RegistrationPayload) => {
    setIsLoading(true);
    try {
      await apiRegisterUser(payload);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  const logout = useCallback(() => {
    setIsLoading(true);
    clearAuthArtefacts();
    toast({ title: t('logoutSuccessTitle'), description: t('logoutSuccessDesc') });
    setIsLoading(false);
    router.push('/login');
  }, [router, toast, t, clearAuthArtefacts]);

  const setTokenManually = useCallback(async (newTokenValue: string) => {
    setIsLoading(true);
    const trimmedNewToken = newTokenValue.trim();
    
    if (!trimmedNewToken) { 
      clearAuthArtefacts();
      toast({ title: t('tokenClearedTitle'), description: t('manualTokenClearedDesc') });
      setIsLoading(false);
      router.push('/login');
    } else {
      try {
        await fetchAndSetUser(trimmedNewToken);
        // setIsAuthenticated(true) is called within fetchAndSetUser
        toast({ title: t('tokenSetSuccessTitle'), description: t('tokenSetSuccessDesc') });
        router.push('/dashboard');
      } catch (error) {
        toast({ variant: "destructive", title: t('tokenSetFailedTitle'), description: (error as ApiError).message || t('tokenSetFailedDesc') });
      } finally {
        setIsLoading(false);
      }
    }
  }, [fetchAndSetUser, toast, t, router, clearAuthArtefacts]);

  const fetchUser = useCallback(async () => {
    const currentTokenValue = token || (typeof window !== 'undefined' ? (sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY)) : null);
    if (currentTokenValue) {
      setIsLoading(true);
      try {
        await fetchAndSetUser(currentTokenValue, false);
         // setIsAuthenticated(true) is called within fetchAndSetUser
      } catch (error) {
        toast({ variant: "destructive", title: t('sessionRefreshFailedTitle'), description: (error as ApiError).message || t('sessionRefreshFailedDesc') });
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    } else {
       // If no token, and not currently loading and not already authenticated (which implies state is settled)
      if (!isLoading && !isAuthenticated) {
        clearAuthArtefacts(); // Ensure state is fully cleared
        // router.replace('/login'); // Redirect if on a protected page
      }
    }
  }, [token, fetchAndSetUser, toast, t, router, isLoading, isAuthenticated, clearAuthArtefacts]); // Added clearAuthArtefacts

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, logout, register, setTokenManually, fetchUser }}>
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

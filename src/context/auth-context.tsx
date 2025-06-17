
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
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'financeflow_jwt_token';
const INTENDED_DESTINATION_KEY = 'intended_destination';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { t } = useTranslation();

  const saveTokenToStorages = (tokenValue: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenValue);
    }
  };

  const removeTokenFromStorages = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(INTENDED_DESTINATION_KEY);
    }
  };

  const clearAuthArtefacts = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    removeTokenFromStorages();
  }, []);

  const fetchAndSetUser = useCallback(async (currentTokenValue: string, shouldSaveToken = true) => {
    try {
      const userData = await fetchUserProfile(currentTokenValue);
      setUser(userData);
      setToken(currentTokenValue);
      setIsAuthenticated(true);
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
        initialToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      }

      if (initialToken) {
        try {
          await fetchAndSetUser(initialToken, false);
        } catch (error) {
          const apiError = error as ApiError;
          console.error("Initialization fetchAndSetUser error:", apiError);
          if (apiError.rawResponse) {
            console.error("Raw server response on init error:", apiError.rawResponse);
          }
          clearAuthArtefacts(); 
        }
      } else {
        clearAuthArtefacts(); 
      }
      if (isActive) setIsLoading(false);
    };

    initializeAuth();
    return () => { isActive = false; };
  }, [fetchAndSetUser, clearAuthArtefacts]); 

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response: LoginResponse = await apiLoginUser(credentials);
      await fetchAndSetUser(response.token);
      toast({ title: t('loginSuccessTitle'), description: t('loginSuccessDesc') });

      let redirectTo = '/dashboard'; // Default redirect path
      
      if (typeof window !== 'undefined') {
        const intendedDestination = sessionStorage.getItem(INTENDED_DESTINATION_KEY);
        
        // CRITICAL: Remove the key from sessionStorage immediately after reading it,
        // regardless of whether it will be used.
        if (intendedDestination) {
            sessionStorage.removeItem(INTENDED_DESTINATION_KEY);
        }

        // Now, validate the intendedDestination if it was found
        const nonIntendedRedirectPaths = ['/login', '/register', '/terms', '/set-token', '/'];
        
        if (intendedDestination && 
            !nonIntendedRedirectPaths.includes(intendedDestination) &&
            intendedDestination.startsWith('/') && 
            !intendedDestination.startsWith('//')) {
          // If it's a valid, non-problematic path, use it
          redirectTo = intendedDestination;
        }
        // If intendedDestination was null, empty, or one of the nonIntendedRedirectPaths,
        // redirectTo remains '/dashboard'.
      }
      
      router.push(redirectTo);

    } catch (error) {
      const apiError = error as ApiError;
      console.error("Login error:", apiError);
      if (apiError.rawResponse) {
        console.error("Raw server response on login error:", apiError.rawResponse);
      }
      toast({
        variant: "destructive",
        title: t('loginFailedTitle'),
        description: apiError.message || t('loginFailedDesc'),
      });
      clearAuthArtefacts();
    } finally {
      setIsLoading(false);
    }
  }, [fetchAndSetUser, router, toast, t, clearAuthArtefacts]);

  const register = useCallback(async (payload: RegistrationPayload) => {
    setIsLoading(true);
    try {
      await apiRegisterUser(payload);
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Registration error:", apiError);
      if (apiError.rawResponse) {
        console.error("Raw server response on registration error:", apiError.rawResponse);
      }
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


  const fetchUser = useCallback(async () => {
    const currentTokenValue = token || (typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_STORAGE_KEY) : null);
    if (currentTokenValue) {
      setIsLoading(true);
      try {
        await fetchAndSetUser(currentTokenValue, false);
      } catch (error) {
        const apiError = error as ApiError;
        console.error("fetchUser error:", apiError);
        if (apiError.rawResponse) {
            console.error("Raw server response on fetchUser error:", apiError.rawResponse);
        }
        toast({ variant: "destructive", title: t('sessionRefreshFailedTitle'), description: apiError.message || t('sessionRefreshFailedDesc') });
        
        const publicPaths = ['/login', '/register', '/terms', '/', '/set-token'];
        if (typeof window !== 'undefined' && !publicPaths.includes(pathname)) {
            sessionStorage.setItem(INTENDED_DESTINATION_KEY, pathname);
        }
        router.replace('/login');

      } finally {
        setIsLoading(false);
      }
    } else {
      if (!isLoading && !isAuthenticated) {
        clearAuthArtefacts();
      }
    }
  }, [token, fetchAndSetUser, toast, t, router, isLoading, isAuthenticated, clearAuthArtefacts, pathname]); 

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, logout, register, fetchUser }}>
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

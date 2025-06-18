
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

  useEffect(() => {
    setIsLoading(false); 
  }, []);

  const clearAuthData = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  const processSuccessfulLogin = useCallback(async (apiToken: string) => {
    try {
      const userData = await fetchUserProfile(apiToken);
      setUser(userData);
      setToken(apiToken); // Token stored in memory
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      clearAuthData();
      throw error;
    }
  }, [clearAuthData]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response: LoginResponse = await apiLoginUser(credentials);
      await processSuccessfulLogin(response.token);
      toast({ title: t('loginSuccessTitle'), description: t('loginSuccessDesc') });

      let redirectTo = '/dashboard';
      
      if (typeof window !== 'undefined') {
        const intendedDestination = localStorage.getItem(INTENDED_DESTINATION_KEY);
        
        if (intendedDestination) {
            localStorage.removeItem(INTENDED_DESTINATION_KEY);
        }

        const nonIntendedRedirectPaths = ['/login', '/register', '/terms', '/set-token', '/'];
        
        if (intendedDestination && 
            !nonIntendedRedirectPaths.includes(intendedDestination) &&
            intendedDestination.startsWith('/') && 
            !intendedDestination.startsWith('//')) {
          redirectTo = intendedDestination;
        }
      }
      
      router.push(redirectTo);

    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: t('loginFailedTitle'),
        description: apiError.message || t('loginFailedDesc'),
      });
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, [processSuccessfulLogin, router, toast, t, clearAuthData]);

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
    clearAuthData();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(INTENDED_DESTINATION_KEY); // Also clear from localStorage on logout
    }
    toast({ title: t('logoutSuccessTitle'), description: t('logoutSuccessDesc') });
    router.push('/login');
    setIsLoading(false);
  }, [router, toast, t, clearAuthData]);

  const fetchUser = useCallback(async () => {
    if (token) {
      setIsLoading(true);
      try {
        const userData = await fetchUserProfile(token);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        const apiError = error as ApiError;
        toast({ variant: "destructive", title: t('sessionRefreshFailedTitle'), description: apiError.message || t('sessionRefreshFailedDesc') });
        clearAuthData();
        
        const publicPaths = ['/login', '/register', '/terms', '/', '/set-token'];
         if (typeof window !== 'undefined' && !publicPaths.includes(pathname)) {
            localStorage.setItem(INTENDED_DESTINATION_KEY, pathname);
        }
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!isLoading && isAuthenticated) {
        clearAuthData();
      }
    }
  }, [token, toast, t, router, clearAuthData, pathname, isLoading, isAuthenticated]);


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

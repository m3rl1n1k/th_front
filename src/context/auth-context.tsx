
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
  // setTokenManually removed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INTENDED_DESTINATION_KEY = 'intended_destination';
const AUTH_TOKEN_KEY = 'financeflow_auth_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true until initial check is done
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { t } = useTranslation();

  const clearAuthData = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, []);

  const processSuccessfulLogin = useCallback(async (apiToken: string, fetchedUser?: User) => {
    try {
      const userData = fetchedUser || await fetchUserProfile(apiToken);
      setUser(userData);
      setToken(apiToken);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, apiToken);
      }
      return userData;
    } catch (error) {
      clearAuthData();
      throw error; // Re-throw to be caught by calling function
    }
  }, [clearAuthData]);
  
  useEffect(() => {
    const attemptAutoLogin = async () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
        if (storedToken) {
          try {
            // No need to setIsLoading(true) here as it's already true initially
            const userData = await fetchUserProfile(storedToken);
            setUser(userData);
            setToken(storedToken);
            setIsAuthenticated(true);
          } catch (error) {
            // Token invalid or expired
            clearAuthData(); // This will remove the bad token from localStorage
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false); // No token, not loading
        }
      } else {
        setIsLoading(false); // SSR or non-browser, not loading
      }
    };
    attemptAutoLogin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: run once on mount

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response: LoginResponse = await apiLoginUser(credentials);
      await processSuccessfulLogin(response.token, response.user); // Pass fetched user if available
      toast({ title: t('loginSuccessTitle'), description: t('loginSuccessDesc') });

      let redirectTo = '/dashboard';
      if (typeof window !== 'undefined') {
        const intendedDestination = localStorage.getItem(INTENDED_DESTINATION_KEY);
        if (intendedDestination) {
          localStorage.removeItem(INTENDED_DESTINATION_KEY);
        }
        const nonIntendedRedirectPaths = ['/login', '/register', '/terms', '/set-token', '/'];
        if (intendedDestination && !nonIntendedRedirectPaths.includes(intendedDestination) && intendedDestination.startsWith('/') && !intendedDestination.startsWith('//')) {
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
      throw error; // Re-throw for the form to handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setIsLoading(true);
    clearAuthData();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(INTENDED_DESTINATION_KEY);
    }
    toast({ title: t('logoutSuccessTitle'), description: t('logoutSuccessDesc') });
    router.push('/login');
    setIsLoading(false); // Ensure loading state is reset
  }, [router, toast, t, clearAuthData]);

  const fetchUser = useCallback(async () => {
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null);
    if (currentToken) {
      setIsLoading(true);
      try {
        const userData = await fetchUserProfile(currentToken);
        setUser(userData);
        setToken(currentToken); // Ensure token state is also in sync
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
      if (isAuthenticated) { // If context thought it was authenticated but no token, clear data
        clearAuthData();
      }
       setIsLoading(false); // If no token, not loading
    }
  }, [token, toast, t, router, clearAuthData, pathname, isAuthenticated]);

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

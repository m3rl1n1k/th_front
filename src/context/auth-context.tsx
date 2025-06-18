
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
  const [isLoading, setIsLoading] = useState(true); // Start as true until initial check is done
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Effect for initial loading state. Since token is in-memory,
  // we are effectively unauthenticated on initial load/refresh.
  useEffect(() => {
    setIsLoading(false); // Initial "check" is done, user is unauthenticated by default
  }, []);

  const clearAuthData = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    // No need to remove token from sessionStorage as it's not stored there anymore
  }, []);

  const processSuccessfulLogin = useCallback(async (apiToken: string) => {
    try {
      const userData = await fetchUserProfile(apiToken);
      setUser(userData);
      setToken(apiToken);
      setIsAuthenticated(true);
      // Token is NOT saved to sessionStorage here
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
        const intendedDestination = sessionStorage.getItem(INTENDED_DESTINATION_KEY);
        if (intendedDestination) {
          sessionStorage.removeItem(INTENDED_DESTINATION_KEY);
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
      clearAuthData(); // Ensure state is clean on login failure
    } finally {
      setIsLoading(false);
    }
  }, [processSuccessfulLogin, router, toast, t, clearAuthData]);

  const register = useCallback(async (payload: RegistrationPayload) => {
    setIsLoading(true);
    try {
      await apiRegisterUser(payload);
    } catch (error) {
      throw error; // Let the UI handle specific error messages
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  const logout = useCallback(() => {
    setIsLoading(true); // Briefly set loading during logout process
    clearAuthData();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(INTENDED_DESTINATION_KEY); // Clear any lingering intended destination
    }
    toast({ title: t('logoutSuccessTitle'), description: t('logoutSuccessDesc') });
    router.push('/login');
    setIsLoading(false); // Reset loading after push
  }, [router, toast, t, clearAuthData]);

  const fetchUser = useCallback(async () => {
    // This function re-fetches user profile using the current in-memory token.
    // Useful if user data needs to be refreshed after an update (e.g., profile edit).
    // If token is null (e.g., after refresh), this won't proceed to API call.
    if (token) {
      setIsLoading(true);
      try {
        const userData = await fetchUserProfile(token);
        setUser(userData);
        setIsAuthenticated(true); // Reaffirm authentication
      } catch (error) {
        const apiError = error as ApiError;
        toast({ variant: "destructive", title: t('sessionRefreshFailedTitle'), description: apiError.message || t('sessionRefreshFailedDesc') });
        clearAuthData(); // If fetching user fails, clear auth state
        
        const publicPaths = ['/login', '/register', '/terms', '/', '/set-token'];
         if (typeof window !== 'undefined' && !publicPaths.includes(pathname)) {
            sessionStorage.setItem(INTENDED_DESTINATION_KEY, pathname);
        }
        router.replace('/login'); // Redirect to login if user fetch fails
      } finally {
        setIsLoading(false);
      }
    } else {
      // If there's no token in memory, ensure the user is treated as unauthenticated.
      // This path is typically hit if fetchUser is called after a page refresh where token state was lost.
      if (!isLoading && isAuthenticated) { // Only clear if currently marked as authenticated
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

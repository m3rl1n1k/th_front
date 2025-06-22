

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchUserProfile, loginUser as apiLoginUser, registerUser as apiRegisterUser, getInvitations } from '@/lib/api';
import type { User, ApiError, LoginCredentials, RegistrationPayload, LoginResponse, Invitation } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from './i18n-context';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingInvitationCount: number; // Added for badge
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegistrationPayload) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INTENDED_DESTINATION_KEY = 'intended_destination';
const AUTH_TOKEN_KEY = 'financeflow_auth_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingInvitationCount, setPendingInvitationCount] = useState(0); // Added state
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { t } = useTranslation();

  const clearAuthData = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setPendingInvitationCount(0); // Reset count on clear
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, []);

  const updatePendingInvitations = useCallback(async (apiToken: string, currentUserId?: string | number) => {
    if (!currentUserId) return;
    try {
      const invitationsResponse = await getInvitations(apiToken);
      const receivedInvitations = invitationsResponse.invitation || [];
      const count = receivedInvitations.filter(
        inv => inv.invitedUser?.id === currentUserId && inv.status === 'pending'
      ).length;
      setPendingInvitationCount(count);
    } catch (error) {
      console.error("Failed to fetch invitations for badge:", error);
      setPendingInvitationCount(0); // Reset on error
    }
  }, []);

  const processSuccessfulLogin = useCallback(async (apiToken: string, fetchedUser?: User) => {
    try {
      const userData = fetchedUser || await fetchUserProfile(apiToken);
      setUser(userData);
      setToken(apiToken);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(AUTH_TOKEN_KEY, apiToken);
      }
      await updatePendingInvitations(apiToken, userData.id); // Fetch invitations after user is set
      return userData;
    } catch (error) {
      clearAuthData();
      throw error;
    }
  }, [clearAuthData, updatePendingInvitations]);

  useEffect(() => {
    const attemptAutoLogin = async () => {
      if (typeof window !== 'undefined') {
        const storedToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
        if (storedToken) {
          try {
            const userData = await fetchUserProfile(storedToken);
            setUser(userData);
            setToken(storedToken);
            setIsAuthenticated(true);
            await updatePendingInvitations(storedToken, userData.id); // Fetch invitations
          } catch (error) {
            clearAuthData();
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    attemptAutoLogin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed updatePendingInvitations from deps as it uses useCallback

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response: LoginResponse = await apiLoginUser(credentials);
      await processSuccessfulLogin(response.token, response.user);
      toast({ title: t('loginSuccessTitle'), description: t('loginSuccessDesc') });

      let redirectTo = '/dashboard';

      if (typeof window !== 'undefined') {
        const intendedDestination = localStorage.getItem(INTENDED_DESTINATION_KEY);

        if (intendedDestination && intendedDestination.trim() !== "") {
          localStorage.removeItem(INTENDED_DESTINATION_KEY);

          const nonIntendedRedirectPaths = ['/login', '/register', '/terms', '/'];
          const isValidForRedirect =
            !nonIntendedRedirectPaths.includes(intendedDestination) &&
            intendedDestination.startsWith('/') &&
            !intendedDestination.startsWith('//');

          if (isValidForRedirect) {
            redirectTo = intendedDestination;
          }
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
  }, []);

  const logout = useCallback(() => {
    setIsLoading(true);
    clearAuthData();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(INTENDED_DESTINATION_KEY);
    }
    toast({ title: t('logoutSuccessTitle'), description: t('logoutSuccessDesc') });
    router.push('/login');
    setIsLoading(false);
  }, [router, toast, t, clearAuthData]);

  const fetchUser = useCallback(async () => {
    const currentToken = token || (typeof window !== 'undefined' ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null);
    if (currentToken) {
      setIsLoading(true);
      try {
        const userData = await fetchUserProfile(currentToken);
        setUser(userData);
        setToken(currentToken);
        setIsAuthenticated(true);
        await updatePendingInvitations(currentToken, userData.id); // Fetch invitations
      } catch (error) {
        const apiError = error as ApiError;
        toast({ variant: "destructive", title: t('sessionRefreshFailedTitle'), description: apiError.message || t('sessionRefreshFailedDesc') });
        clearAuthData();
        const publicPaths = ['/login', '/register', '/terms', '/'];
        if (typeof window !== 'undefined' && !publicPaths.includes(pathname)) {
          localStorage.setItem(INTENDED_DESTINATION_KEY, pathname);
        }
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (isAuthenticated) {
        clearAuthData();
      }
       setIsLoading(false);
    }
  }, [token, toast, t, router, clearAuthData, pathname, isAuthenticated, updatePendingInvitations]);

  useEffect(() => {
    const publicPaths = ['/login', '/register', '/terms', '/'];
    if (!isLoading && !isAuthenticated && !publicPaths.includes(pathname)) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(INTENDED_DESTINATION_KEY, pathname);
      }
      router.replace('/login');
    } else if (
        !isLoading &&
        isAuthenticated &&
        user &&
        (!user.userCurrency || !user.userCurrency.code) &&
        pathname !== '/profile' &&
        !publicPaths.includes(pathname)
      ) {
        toast({
          title: t('setYourCurrencyTitle'),
          description: t('setYourCurrencyDesc'),
          variant: 'default',
          duration: 7000,
        });
        router.replace('/profile');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, user, router, pathname, t, toast]);


  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, logout, register, fetchUser, pendingInvitationCount }}>
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


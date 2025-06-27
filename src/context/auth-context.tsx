
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchUserProfile, loginUser as apiLoginUser, registerUser as apiRegisterUser, getInvitations } from '@/lib/api';
import type { User, ApiError, LoginCredentials, RegistrationPayload, LoginResponse, Invitation } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from './i18n-context';
import { SessionRenewalModal } from '@/components/common/session-renewal-modal';
import { devLog } from '@/lib/logger';


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

const augmentUserData = (user: User): User => {
  const isVerified = !!user.verifiedAt || !!user.isVerified;
  const subscription = user.subscription !== undefined ? user.subscription : null;
  return { ...user, isVerified, subscription };
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingInvitationCount, setPendingInvitationCount] = useState(0);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [reloadOnSuccess, setReloadOnSuccess] = useState(false);
  const isModalOpenRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { t } = useTranslation();

  const clearAuthData = useCallback(() => {
    devLog('Clearing auth data from state and session storage.');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setPendingInvitationCount(0);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, []);

  const logout = useCallback(() => {
    setIsLoading(true);
    devLog('Logging out...');
    clearAuthData();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(INTENDED_DESTINATION_KEY);
    }
    toast({ title: t('logoutSuccessTitle'), description: t('logoutSuccessDesc') });
    router.push('/login');
    setIsLoading(false);
  }, [router, toast, t, clearAuthData]);

  const handleRenewalClose = useCallback(() => {
    devLog('Session renewal modal closed by user. Logging out.');
    isModalOpenRef.current = false;
    setIsRenewalModalOpen(false);
    logout();
  }, [logout]);
  
  const promptSessionRenewal = useCallback(() => {
    // Prevent opening if already on a public page like login
    const publicPaths = ['/login', '/register', '/terms', '/', '/email-verification', '/auth/verify'];
    if (publicPaths.some(p => pathname.startsWith(p))) {
        devLog('On a public page, not showing renewal modal.');
        return;
    }

    // For pages that are authenticated but are entry points, we should redirect to login instead of showing modal.
    const preAuthPages = ['/transactions/new/select-category'];
    if (preAuthPages.some(p => pathname.startsWith(p))) {
      devLog(`On pre-auth page "${pathname}" with expired session, logging out.`);
      logout();
      return;
    }

    // Prevent opening if already open or if no user was logged in previously
    if (!isModalOpenRef.current && (user || sessionStorage.getItem(AUTH_TOKEN_KEY))) {
        isModalOpenRef.current = true;
        devLog('Prompting for session renewal.');
        setIsRenewalModalOpen(true);
    }
  }, [user, pathname, logout]);

  // Listen for the custom sessionExpired event
  useEffect(() => {
    const handleSessionExpired = () => {
      promptSessionRenewal();
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, [promptSessionRenewal]);


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
      // Don't toast here as it can be noisy. The central handler will show the modal.
      setPendingInvitationCount(0); // Reset on error
    }
  }, []);

  const processSuccessfulLogin = useCallback(async (apiToken: string, fetchedUser?: User) => {
    devLog('Processing successful login...');
    try {
      let userData = fetchedUser || await fetchUserProfile(apiToken);
      userData = augmentUserData(userData);
      devLog('Fetched and augmented user data:', userData);
      setUser(userData);
      setToken(apiToken);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(AUTH_TOKEN_KEY, apiToken);
        devLog('Auth token stored in session storage.');
      }
      await updatePendingInvitations(apiToken, userData.id); // Fetch invitations after user is set
      return userData;
    } catch (error) {
      console.error('Error during post-login processing:', error);
      clearAuthData();
      throw error;
    }
  }, [clearAuthData, updatePendingInvitations]);
  
  const handleRenewalSuccess = useCallback(async (newToken: string) => {
    devLog('Session renewal successful. Processing new token.');
    try {
      await processSuccessfulLogin(newToken);
      isModalOpenRef.current = false;
      setIsRenewalModalOpen(false);
      toast({ title: t('sessionRefreshedTitle'), description: t('sessionRefreshedDesc') });
      setReloadOnSuccess(true);
    } catch (error) {
        toast({ variant: 'destructive', title: t('sessionRefreshFailedTitle'), description: (error as ApiError).message || t('sessionRefreshFailedDesc') });
        handleRenewalClose(); // Logout user if processing fails
    }
  }, [processSuccessfulLogin, toast, t, handleRenewalClose]);

  useEffect(() => {
    if (reloadOnSuccess) {
      // This effect runs after the re-render that closes the modal, preventing a race condition.
      window.location.reload();
    }
  }, [reloadOnSuccess]);


  useEffect(() => {
    const attemptAutoLogin = async () => {
      devLog('Attempting auto-login on component mount.');
      if (typeof window !== 'undefined') {
        const storedToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
        if (storedToken) {
          devLog('Found token in session storage. Verifying...');
          try {
            let userData = await fetchUserProfile(storedToken);
            userData = augmentUserData(userData);
            setUser(userData);
            setToken(storedToken);
            setIsAuthenticated(true);
            await updatePendingInvitations(storedToken, userData.id); // Fetch invitations
            devLog('Auto-login successful.');
          } catch (error) {
            devLog('Auto-login failed. Clearing auth data.', error);
            clearAuthData();
          } finally {
            setIsLoading(false);
          }
        } else {
          devLog('No token found in session storage.');
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    attemptAutoLogin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    devLog(`Attempting login for user: ${credentials.username}`);
    try {
      const response: LoginResponse = await apiLoginUser(credentials);
      devLog('Login API call successful. Received token and user data.');
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
      devLog(`Redirecting to ${redirectTo}`);
      router.push(redirectTo);
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Login failed.', apiError);
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
    devLog(`Attempting registration for email: ${payload.email}`);
    try {
      await apiRegisterUser(payload);
      devLog('Registration API call successful.');
    } catch (error) {
      console.error('Registration failed.', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    const currentToken = token || (typeof window !== 'undefined' ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null);
    if (currentToken) {
      setIsLoading(true);
      devLog('Manually fetching/refreshing user profile.');
      try {
        let userData = await fetchUserProfile(currentToken);
        userData = augmentUserData(userData);
        setUser(userData);
        setToken(currentToken);
        setIsAuthenticated(true);
        await updatePendingInvitations(currentToken, userData.id); // Fetch invitations
        devLog('Successfully fetched and updated user data.');
      } catch (error) {
        if ((error as ApiError).code !== 401) {
            toast({ variant: "destructive", title: t('sessionRefreshFailedTitle'), description: (error as ApiError).message || t('sessionRefreshFailedDesc') });
            clearAuthData();
            const publicPaths = ['/login', '/register', '/terms', '/'];
            if (typeof window !== 'undefined' && !publicPaths.includes(pathname)) {
              localStorage.setItem(INTENDED_DESTINATION_KEY, pathname);
            }
            router.replace('/login');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      devLog('fetchUser called but no token available.');
      if (isAuthenticated) {
        clearAuthData();
      }
       setIsLoading(false);
    }
  }, [token, toast, t, router, clearAuthData, pathname, isAuthenticated, updatePendingInvitations]);

  useEffect(() => {
    const publicPaths = ['/login', '/register', '/terms', '/', '/email-verification', '/auth/verify'];
    if (!isLoading && !isAuthenticated && !publicPaths.some(p => pathname.startsWith(p)) && !isRenewalModalOpen) {
      if (typeof window !== 'undefined') {
        devLog(`Not authenticated. Storing intended destination: ${pathname}`);
        localStorage.setItem(INTENDED_DESTINATION_KEY, pathname);
      }
      router.replace('/login');
    } else if (
        !isLoading &&
        isAuthenticated &&
        user &&
        (!user.userCurrency || !user.userCurrency.code) &&
        pathname !== '/profile' &&
        !publicPaths.some(p => pathname.startsWith(p))
      ) {
        devLog('User currency not set. Redirecting to profile.');
        toast({
          title: t('setYourCurrencyTitle'),
          description: t('setYourCurrencyDesc'),
          variant: 'default',
          duration: 7000,
        });
        router.replace('/profile');
    }
  }, [isLoading, isAuthenticated, user, router, pathname, t, toast, isRenewalModalOpen]);


  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, logout, register, fetchUser, pendingInvitationCount }}>
      {children}
      <SessionRenewalModal
        isOpen={isRenewalModalOpen}
        onClose={handleRenewalClose}
        onSuccess={handleRenewalSuccess}
        email={user?.email || null}
      />
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

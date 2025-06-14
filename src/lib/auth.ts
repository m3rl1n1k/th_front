
// This is a mock authentication module.
// In a real application, you would implement JWT-based authentication or similar.
'use server'; // Ensure this runs on the server

import type { User } from './definitions';
import { MOCK_DB } from './definitions'; // Import MOCK_DB from definitions
import { cookies } from 'next/headers';
import {
  API_AUTH_LOGIN,
  API_AUTH_ME
  // API_AUTH_LOGOUT // If you have this endpoint
} from './apiConstants';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

const AUTH_TOKEN_COOKIE_NAME = 'authToken';
const USER_DATA_COOKIE_NAME = 'userData';

// Helper to make auth API calls (remains for potential partial use or future re-enablement)
async function fetchAuthAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `Auth API request failed: ${response.statusText}`;
      try {
          const parsedError = JSON.parse(errorBody);
          if (parsedError && parsedError.message) {
              errorMessage = parsedError.message;
          } else if (parsedError && errorBody) {
            errorMessage = errorBody;
          }
      } catch (e) {
          if (errorBody) errorMessage = errorBody;
      }
      console.error(`Auth API Error (${response.status}) on ${fullUrl}: ${errorMessage}`);
      const error = new Error(errorMessage) as any;
      error.status = response.status;
      throw error;
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  } catch (networkError: any) {
    console.error(`Auth API Fetch Error for ${fullUrl}:`, networkError.message);
    const error = new Error(`Network error when attempting to fetch ${fullUrl}. Is the backend server running and accessible? Original error: ${networkError.message}`) as any;
    error.cause = networkError;
    throw error;
  }
}

// This function is generally not called when auth is "off" via getCurrentUser bypass
async function fetchAndStoreUserData(token: string): Promise<User | null> {
  console.warn("fetchAndStoreUserData called - this should be bypassed in 'auth off' mode if getCurrentUser is correctly mocked.");
  try {
    const user = await fetchAuthAPI(API_AUTH_ME, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (user && !user.error) {
      const cookieStore = await cookies();
      cookieStore.set(USER_DATA_COOKIE_NAME, JSON.stringify(user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      return user as User;
    } else {
      console.error('Failed to fetch user data from /auth/me:', user?.message);
      const cookieStore = await cookies();
      await cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
      await cookieStore.delete(USER_DATA_COOKIE_NAME);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user data from /auth/me:', error);
    const cookieStore = await cookies();
    await cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
    await cookieStore.delete(USER_DATA_COOKIE_NAME);
    return null;
  }
}


export async function getCurrentUser(): Promise<User | null> {
  // For demo purposes, return the mock user directly, bypassing API calls.
  const user = MOCK_DB.users.find(u => u.id === 'user-123');
  return user || null;
}

export async function login(email: string, password_not_used: string): Promise<User | null> {
  // For demo purposes with auth "off", "login" the mock user if email matches.
  // This function should ideally not be reached if isAuthenticated() is true and middleware handles redirection.
  if (email === 'user@example.com') {
    const user = MOCK_DB.users.find(u => u.id === 'user-123');
    if (user) {
      const cookieStore = await cookies();
      // Set a dummy user data cookie and auth token for completeness if any client-side logic expects them
      cookieStore.set(USER_DATA_COOKIE_NAME, JSON.stringify(user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      cookieStore.set(AUTH_TOKEN_COOKIE_NAME, "demo-auth-token-bypassed", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      });
      return user;
    }
  }
  console.error('Demo login attempt failed for:', email, ' This page should not be reachable if auth is off.');
  throw new Error('Invalid demo credentials or setup issue. Login page should be inaccessible when auth is bypassed.');
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  // No API call for logout in demo mode, just clear cookies.
  cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
  cookieStore.delete(USER_DATA_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  // For demo purposes, always return true to bypass API calls for page access.
  return true;
}

export async function getAuthToken(): Promise<string | null> {
  // In demo mode with auth off, no real token is used or needed from cookies for API.
  // This might return a dummy token if set by the demo login.
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value || null;
}

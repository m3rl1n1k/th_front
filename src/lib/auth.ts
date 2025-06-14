
// This is a mock authentication module.
// In a real application, you would implement JWT-based authentication or similar.
'use server'; // Ensure this runs on the server

import type { User } from './definitions';
import { MOCK_DB } from './definitions'; // MOCK_DB is used for getCurrentUser when auth is "off"
import { cookies } from 'next/headers';
import {
  API_AUTH_LOGIN,
  API_AUTH_ME
} from './apiConstants';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

const AUTH_TOKEN_COOKIE_NAME = 'authToken';
const USER_DATA_COOKIE_NAME = 'userData';

// Helper to make auth API calls
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

async function fetchAndStoreUserData(token: string): Promise<User | null> {
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
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;
  const userDataCookie = cookieStore.get(USER_DATA_COOKIE_NAME)?.value;

  if (userDataCookie) {
    try {
      const user = JSON.parse(userDataCookie);
      return user as User;
    } catch (error) {
      console.error('Error parsing user data from cookie:', error);
      await cookieStore.delete(USER_DATA_COOKIE_NAME);
      await cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
      return null;
    }
  }

  if (token) {
    return fetchAndStoreUserData(token);
  }

  return null;
}

// Changed first parameter from 'email' to 'identifier'
export async function login(identifier: string, password_input: string): Promise<User | null> {
  try {
    const response = await fetchAuthAPI(API_AUTH_LOGIN, {
      method: 'POST',
      // The key remains 'email' as per backend API, but its value is from the 'identifier' (username) field
      body: JSON.stringify({ email: identifier, password: password_input }), 
    });

    if (response && response.token) {
      const cookieStore = await cookies();
      cookieStore.set(AUTH_TOKEN_COOKIE_NAME, response.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      return fetchAndStoreUserData(response.token);
    } else {
      console.error('Login failed: No token received from API.');
      throw new Error(response?.message || 'Login failed, no token received.');
    }
  } catch (error: any) {
    console.error('Login API call failed:', error.message);
    throw error;
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
  cookieStore.delete(USER_DATA_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value || null;
}

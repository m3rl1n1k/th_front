
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
    // This block catches errors from the fetch() call itself (e.g., network down, DNS issues, CORS preflight failure)
    console.error(`Auth API Fetch Error for ${fullUrl}:`, networkError.message);
    // Re-throw a more specific error or the original one, adding context.
    const error = new Error(`Network error when attempting to fetch ${fullUrl}. Is the backend server running and accessible? Original error: ${networkError.message}`) as any;
    error.cause = networkError; // Preserve original error if needed
    throw error;
  }
}

async function fetchAndStoreUserData(token: string): Promise<User | null> {
  // This function is now less critical if auth is disabled, but kept for potential re-enabling
  try {
    const user = await fetchAuthAPI(API_AUTH_ME, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (user && !user.error) {
      const cookieStore = cookies();
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
      const cookieStore = cookies();
      cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
      cookieStore.delete(USER_DATA_COOKIE_NAME);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user data from /auth/me:', error);
    const cookieStore = cookies();
    cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
    cookieStore.delete(USER_DATA_COOKIE_NAME);
    return null;
  }
}


export async function getCurrentUser(): Promise<User | null> {
  // --- Temporarily disabled auth: Always return mock user ---
  const mockUser = MOCK_DB.users.find(u => u.email === 'user@example.com');
  return mockUser || MOCK_DB.users[0] || null;
  // --- Original logic below, commented out ---
  /*
  const cookieStore = cookies();
  const userDataString = cookieStore.get(USER_DATA_COOKIE_NAME)?.value;

  if (userDataString) {
    try {
      const userData: User = JSON.parse(userDataString);
      return userData;
    } catch (e) {
      console.error("Failed to parse user data from cookie", e);
      cookieStore.delete(USER_DATA_COOKIE_NAME);
      cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
    }
  }

  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;
  if (token) {
    return await fetchAndStoreUserData(token);
  }
  return null;
  */
}

export async function login(email: string, password_not_used: string): Promise<User | null> {
  // --- Temporarily disabled auth: Return mock user directly ---
  const mockUser = MOCK_DB.users.find(u => u.email === 'user@example.com');
  return mockUser || MOCK_DB.users[0] || null;
  // --- Original logic below, commented out ---
  /*
  const response = await fetchAuthAPI(API_AUTH_LOGIN, {
    method: 'POST',
    body: JSON.stringify({ username: email, password: password_not_used }), // email from form is sent as 'username'
  });

  if (response && response.token) {
    const token = response.token;
    const cookieStore = cookies();
    cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    return await fetchAndStoreUserData(token);
  } else {
    console.error('Login API call successful but no token received or other issue.');
    throw new Error('Login failed: No token received or invalid response structure.');
  }
  */
}

export async function logout(): Promise<void> {
  // --- Temporarily disabled auth: Clear cookies if any, but mostly a no-op for app state ---
  const cookieStore = cookies();
  cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
  cookieStore.delete(USER_DATA_COOKIE_NAME);
  // --- Original logic below, commented out ---
  /*
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;

  if (token) {
    try {
      // If you have a backend logout endpoint, call it here
      // await fetchAuthAPI(API_AUTH_LOGOUT, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
    } catch (error) {
      console.error('Error during API logout (ignoring):', error);
    }
  }

  cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
  cookieStore.delete(USER_DATA_COOKIE_NAME);
  */
}

export async function isAuthenticated(): Promise<boolean> {
  // --- Temporarily disabled auth: Always return true ---
  return true;
  // --- Original logic below, commented out ---
  /*
  const user = await getCurrentUser();
  return user !== null;
  */
}

export async function getAuthToken(): Promise<string | null> {
   // --- Temporarily disabled auth: Return a mock token or null, doesn't really matter much now ---
  return "mock-auth-token-disabled-auth";
  // --- Original logic below, commented out ---
  /*
  const cookieStore = cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value || null;
  */
}

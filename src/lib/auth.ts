
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
  // For demo mode with auth bypass, we don't need to fetch from API if MOCK_DB is primary
  // However, if a real token login *were* to happen, this would be the path.
  // For consistency, we'll still try to fetch from MOCK_DB based on token if needed,
  // but getCurrentUser will prioritize the direct MOCK_DB access.
  
  // This function is more relevant if a real login happens and we need to get user data.
  // For the current demo user setup, getCurrentUser() will bypass this.
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
      cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
      cookieStore.delete(USER_DATA_COOKIE_NAME);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user data from /auth/me:', error);
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
    cookieStore.delete(USER_DATA_COOKIE_NAME);
    return null;
  }
}


export async function getCurrentUser(): Promise<User | null> {
  // For demo purposes, return the mock user directly, bypassing API calls.
  // This ensures no fetch is needed for page access.
  const user = MOCK_DB.users.find(u => u.id === 'user-123');
  return user || null;
}

export async function login(email: string, password_not_used: string): Promise<User | null> {
  // The login form will still attempt to call this.
  // For a true "no fetch" demo, this would also need to be mocked.
  // However, since isAuthenticated() is true, middleware should redirect from /login,
  // making this function less likely to be hit directly by the user.
  // If called, it *will* attempt a real API call as per current setup.
  console.warn("Login function called. In full demo mode, this would typically be bypassed or fully mocked if no backend is available.");
  
  const response = await fetchAuthAPI(API_AUTH_LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email: email, password: password_not_used }),
  });

  if (response && response.token) {
    const token = response.token;
    const cookieStore = await cookies();
    cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    // After real login, fetch and store user data associated with the token
    return await fetchAndStoreUserData(token);
  } else if (email === 'user@example.com' && password_not_used === 'password') {
    // Fallback to mock user if API fails but credentials match the demo ones
    console.warn("Login API failed, but demo credentials match. Returning mock user.");
    const user = MOCK_DB.users.find(u => u.email === email);
    if (user) {
      const cookieStore = await cookies();
      cookieStore.set(USER_DATA_COOKIE_NAME, JSON.stringify(user), { /* options */ });
      // Optionally set a dummy auth token for demo if needed elsewhere
      cookieStore.set(AUTH_TOKEN_COOKIE_NAME, "demo-auth-token", { /* options */ });
      return user;
    }
    return null;
  } else {
    console.error('Login API call successful but no token received or other issue.');
    throw new Error('Login failed: No token received or invalid response structure.');
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;

  if (token && token !== "demo-auth-token") { // Don't try to logout a demo token from API
    try {
      // If you have a backend logout endpoint, call it here
      // Example:
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
}

export async function isAuthenticated(): Promise<boolean> {
  // For demo purposes, always return true to bypass API calls for page access.
  return true;
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value || null;
}

    
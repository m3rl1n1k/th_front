
// This is a mock authentication module.
// In a real application, you would implement JWT-based authentication or similar.
'use server'; // Ensure this runs on the server

import type { User, UserSettings } from './definitions';
import { cookies } from 'next/headers'; // For handling cookies

// TODO: USER: Replace with your actual API base URL, ideally from an environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'; // Example

const AUTH_TOKEN_COOKIE_NAME = 'authToken';
const USER_DATA_COOKIE_NAME = 'userData'; // To store non-sensitive user data

// --- Mock User for Disabled Auth ---
const MOCK_DEFAULT_USER: User = {
  id: 'user-123', // Ensure this ID matches mock data if API is down
  email: 'user@example.com',
  name: 'Default User',
  settings: { transactionsPerPage: 10 },
};

// Helper to make auth API calls
async function fetchAuthAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Auth API Error (${response.status}) on ${endpoint}: ${errorBody}`);
    if (response.status === 401 || response.status === 403) {
      return { error: true, status: response.status, message: errorBody || response.statusText };
    }
    throw new Error(`Auth API request failed: ${response.statusText} - ${errorBody}`);
  }
   if (response.status === 204) { // No Content
    return null;
  }
  return response.json();
}


export async function getCurrentUser(): Promise<User | null> {
  // --- AUTH DISABLED ---
  return MOCK_DEFAULT_USER;

  // --- ORIGINAL LOGIC ---
  // const cookieStore = cookies();
  // const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;
  // const userDataString = cookieStore.get(USER_DATA_COOKIE_NAME)?.value;

  // if (userDataString) {
  //   try {
  //     const userData: User = JSON.parse(userDataString);
  //     return userData;
  //   } catch (e) {
  //     console.error("Failed to parse user data from cookie", e);
  //     cookieStore.delete(USER_DATA_COOKIE_NAME);
  //     cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
  //     return null;
  //   }
  // }
  
  // if (token) {
  //   try {
  //     const user = await fetchAuthAPI('/auth/me', { // TODO: USER: Replace with your /me endpoint
  //       method: 'GET',
  //       headers: { 'Authorization': `Bearer ${token}` },
  //     });
  //     if (user && !user.error) {
  //       cookieStore.set(USER_DATA_COOKIE_NAME, JSON.stringify(user), {
  //         httpOnly: true,
  //         secure: process.env.NODE_ENV === 'production',
  //         sameSite: 'lax',
  //         path: '/',
  //       });
  //       return user;
  //     } else {
  //       cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
  //       cookieStore.delete(USER_DATA_COOKIE_NAME);
  //       return null;
  //     }
  //   } catch (error) {
  //     console.error('Error fetching current user from API:', error);
  //     cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
  //     cookieStore.delete(USER_DATA_COOKIE_NAME);
  //     return null;
  //   }
  // }
  // return null;
}

export async function login(email: string, password_not_used: string): Promise<User | null> {
  // --- AUTH DISABLED ---
  console.warn("Auth is disabled. Login function called but will return mock user.");
  return MOCK_DEFAULT_USER;

  // --- ORIGINAL LOGIC ---
  // try {
  //   const response = await fetchAuthAPI('/auth/login', { 
  //     method: 'POST',
  //     body: JSON.stringify({ email, password: password_not_used }),
  //   });

  //   if (response && response.token && response.user && !response.error) {
  //     const { user, token } = response;
  //     const cookieStore = cookies();
  //     cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === 'production',
  //       sameSite: 'lax',
  //       path: '/',
  //     });
  //     cookieStore.set(USER_DATA_COOKIE_NAME, JSON.stringify(user), {
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === 'production',
  //       sameSite: 'lax',
  //       path: '/',
  //     });
  //     return user as User;
  //   } else {
  //     console.error('Login failed:', response?.message || 'Invalid credentials or API error');
  //     return null;
  //   }
  // } catch (error) {
  //   console.error('Error during login API call:', error);
  //   return null;
  // }
}

export async function logout(): Promise<void> {
  // --- AUTH DISABLED ---
  console.warn("Auth is disabled. Logout function called but no actual logout will occur.");
  const cookieStore = cookies(); // Still clear cookies in case they were set before disabling
  cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
  cookieStore.delete(USER_DATA_COOKIE_NAME);
  return;

  // --- ORIGINAL LOGIC ---
  // const cookieStore = cookies();
  // cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
  // cookieStore.delete(USER_DATA_COOKIE_NAME);
  // Optionally call API logout:
  // const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;
  // if (token) {
  //   try {
  //     await fetchAuthAPI('/auth/logout', {
  //       method: 'POST',
  //       headers: { 'Authorization': `Bearer ${token}` },
  //     });
  //   } catch (error) {
  //     console.error('Error during API logout:', error);
  //   }
  // }
}

export async function isAuthenticated(): Promise<boolean> {
  // --- AUTH DISABLED ---
  return true;
  // --- ORIGINAL LOGIC ---
  // const user = await getCurrentUser();
  // return user !== null;
}

export async function getAuthToken(): Promise<string | null> {
  // --- AUTH DISABLED ---
  // Return a mock token if your API strictly requires one even for a "public" or "default" user state.
  // Otherwise, returning null is fine if API calls can proceed without it when auth is "disabled".
  // For this temporary disable, let's assume null is okay.
  return null; 
  
  // --- ORIGINAL LOGIC ---
  // const cookieStore = cookies();
  // return cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value || null;
}

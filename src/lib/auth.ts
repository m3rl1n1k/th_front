
// This is a mock authentication module.
// In a real application, you would implement JWT-based authentication or similar.
'use server'; // Ensure this runs on the server

import type { User, UserSettings } from './definitions';
import { cookies } from 'next/headers'; // For handling cookies

// TODO: USER: Replace with your actual API base URL, ideally from an environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'; // Example

const AUTH_TOKEN_COOKIE_NAME = 'authToken';
const USER_DATA_COOKIE_NAME = 'userData'; // To store non-sensitive user data

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
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;
  const userDataString = cookieStore.get(USER_DATA_COOKIE_NAME)?.value;

  if (userDataString) {
    try {
      const userData: User = JSON.parse(userDataString);
      // Optionally, you might want to re-validate the token with the backend here
      // or just trust the cookie for a certain period.
      // For simplicity, we'll trust it if it exists.
      return userData;
    } catch (e) {
      console.error("Failed to parse user data from cookie", e);
      // Clear potentially corrupted cookies
      cookieStore.delete(USER_DATA_COOKIE_NAME);
      cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
      return null;
    }
  }
  
  if (token) {
    try {
      const user = await fetchAuthAPI('/auth/me', { // TODO: USER: Replace with your /me endpoint
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (user && !user.error) {
        cookieStore.set(USER_DATA_COOKIE_NAME, JSON.stringify(user), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // Example: 7 days
        });
        return user;
      } else {
        // Token is invalid or API error
        cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
        cookieStore.delete(USER_DATA_COOKIE_NAME);
        return null;
      }
    } catch (error) {
      console.error('Error fetching current user from API:', error);
      cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
      cookieStore.delete(USER_DATA_COOKIE_NAME);
      return null;
    }
  }
  return null;
}

export async function login(email: string, password_not_used: string): Promise<User | null> {
  try {
    const response = await fetchAuthAPI('/auth/login', { // TODO: USER: Replace with your login endpoint
      method: 'POST',
      body: JSON.stringify({ email, password: password_not_used }), // Send password to actual API
    });

    if (response && response.token && response.user && !response.error) {
      const { user, token } = response;
      const cookieStore = cookies();
      cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // Example: 30 days
      });
      cookieStore.set(USER_DATA_COOKIE_NAME, JSON.stringify(user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // Example: 7 days
      });
      return user as User;
    } else {
      console.error('Login failed:', response?.message || 'Invalid credentials or API error');
      return null;
    }
  } catch (error) {
    console.error('Error during login API call:', error);
    return null;
  }
}

export async function logout(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;

  // Optionally call API logout endpoint if your backend has one
  // if (token) {
  //   try {
  //     await fetchAuthAPI('/auth/logout', { // TODO: USER: Replace with your logout endpoint
  //       method: 'POST',
  //       headers: { 'Authorization': `Bearer ${token}` },
  //     });
  //   } catch (error) {
  //     console.error('Error during API logout:', error);
  //     // Proceed with client-side logout even if API call fails
  //   }
  // }

  cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
  cookieStore.delete(USER_DATA_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value || null;
}

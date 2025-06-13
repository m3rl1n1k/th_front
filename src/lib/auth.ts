
// This is a mock authentication module.
// In a real application, you would implement JWT-based authentication or similar.
'use server'; // Ensure this runs on the server

import type { User } from './definitions';
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
    // Avoid throwing error for 401/403 on login/getCurrentUser to handle it gracefully
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
      // Optionally, you might want to re-validate the token with a /me endpoint
      // if (!token) return null;
      // const apiUser = await fetchAuthAPI('/auth/me', { headers: { 'Authorization': `Bearer ${token}` }});
      // if (apiUser && !apiUser.error) return apiUser;
      // If /auth/me fails or token is stale, clear cookies and return null
      return userData;
    } catch (e) {
      console.error("Failed to parse user data from cookie", e);
      // Clear potentially corrupted cookie
      cookieStore.delete(USER_DATA_COOKIE_NAME);
      cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
      return null;
    }
  }
  
  // If no user data in cookie, but token exists, try fetching from /me endpoint
  if (token) {
    try {
      const user = await fetchAuthAPI('/auth/me', { // TODO: USER: Replace with your /me endpoint
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (user && !user.error) {
         // Save fetched user data to cookie for faster access next time
        cookieStore.set(USER_DATA_COOKIE_NAME, JSON.stringify(user), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          // maxAge: 60 * 60 * 24 * 7, // Example: 1 week
        });
        return user;
      } else {
        // Token might be invalid/expired
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
  // TODO: USER: Replace with your API login call
  // This example assumes your API returns a user object and a token
  try {
    const response = await fetchAuthAPI('/auth/login', { // TODO: USER: Replace with your login endpoint
      method: 'POST',
      body: JSON.stringify({ email, password: password_not_used }), // Send email and password
    });

    if (response && response.token && response.user && !response.error) {
      const { user, token } = response;
      const cookieStore = cookies();
      cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
        httpOnly: true, // Important for security
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Or 'strict'
        path: '/',
        // maxAge: 60 * 60 * 24, // Example: 1 day, adjust as needed
      });
      cookieStore.set(USER_DATA_COOKIE_NAME, JSON.stringify(user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        // maxAge: 60 * 60 * 24,
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
  // TODO: USER: Optionally call your API's logout endpoint
  // const token = cookies().get(AUTH_TOKEN_COOKIE_NAME)?.value;
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

  const cookieStore = cookies();
  cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);
  cookieStore.delete(USER_DATA_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// New function to get the auth token for API calls in actions.ts
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value || null;
}

// --- Mock User (fallback if needed during transition, can be removed later) ---
// let MOCK_USER: User | null = {
//   id: 'user-123',
//   email: 'user@example.com',
//   name: 'Test User (Mock)',
// };
// Mock functions if API is not ready (can be removed later)
// export async function getCurrentUser_mock(): Promise<User | null> {
//   await new Promise(resolve => setTimeout(resolve, 50));
//   return MOCK_USER;
// }
// export async function login_mock(email: string, password_not_used: string): Promise<User | null> {
//   await new Promise(resolve => setTimeout(resolve, 100));
//   if (email === 'user@example.com') {
//     MOCK_USER = { id: 'user-123', email: 'user@example.com', name: 'Test User (Mock)' };
//     return MOCK_USER;
//   }
//   return null;
// }
// export async function logout_mock(): Promise<void> {
//   await new Promise(resolve => setTimeout(resolve, 50));
//   MOCK_USER = null;
// }
// export async function isAuthenticated_mock(): Promise<boolean> {
//   const user = await getCurrentUser_mock();
//   return user !== null;
// }

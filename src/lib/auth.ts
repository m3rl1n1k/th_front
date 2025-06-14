
// This is a mock authentication module.
// In a real application, you would implement JWT-based authentication or similar.
'use server'; // Ensure this runs on the server

import type { User, UserSettings } from './definitions';
import { cookies } from 'next/headers'; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'; 

const AUTH_TOKEN_COOKIE_NAME = 'authToken';
const USER_DATA_COOKIE_NAME = 'userData'; 

// Helper to make auth API calls
async function fetchAuthAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json', // Ensure server knows we expect JSON
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
        }
    } catch (e) {
        // If errorBody is not JSON, use the text itself or a generic message
        if (errorBody) errorMessage = errorBody;
    }
    console.error(`Auth API Error (${response.status}) on ${endpoint}: ${errorMessage}`);
    // Throw an error that includes the status and message from the API response
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    throw error;
  }
   if (response.status === 204) { 
    return null;
  }
  return response.json();
}

async function fetchAndStoreUserData(token: string): Promise<User | null> {
  try {
    const user = await fetchAuthAPI('/auth/me', {
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
        maxAge: 60 * 60 * 24 * 7 
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
}

export async function login(email: string, password_not_used: string): Promise<User | null> {
  const response = await fetchAuthAPI('/auth/login', { 
    method: 'POST',
    body: JSON.stringify({ username: email, password: password_not_used }), 
  });

  if (response && response.token) { 
    const token = response.token;
    const cookieStore = cookies();
    cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 
    });
    return await fetchAndStoreUserData(token);
  } else {
    console.error('Login API call successful but no token received in response.');
    throw new Error('Login successful but no token received.');
  }
}

export async function logout(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;

  if (token) {
    try {
      // Inform the backend about logout, if an endpoint exists and is configured.
      // await fetchAuthAPI('/auth/logout', {
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
  const user = await getCurrentUser();
  return user !== null;
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value || null;
}


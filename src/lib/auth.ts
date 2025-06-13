// This is a mock authentication module.
// In a real application, you would implement JWT-based authentication.

import type { User } from './definitions';

// Simulate a logged-in user
// In a real app, this would come from a session / context provider after login
let MOCK_USER: User | null = {
  id: 'user-123',
  email: 'user@example.com',
  name: 'Test User',
};

export async function getCurrentUser(): Promise<User | null> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return MOCK_USER;
}

export async function login(email: string, password_not_used: string): Promise<User | null> {
  // Simulate login
  await new Promise(resolve => setTimeout(resolve, 500));
  if (email === 'user@example.com') { // Mock credentials
    MOCK_USER = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
    };
    return MOCK_USER;
  }
  return null;
}

export async function logout(): Promise<void> {
  // Simulate logout
  await new Promise(resolve => setTimeout(resolve, 100));
  MOCK_USER = null;
}

export async function isAuthenticated(): Promise<boolean> {
  return MOCK_USER !== null;
}

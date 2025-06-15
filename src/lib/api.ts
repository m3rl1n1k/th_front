import { URLS } from '@/config/urls';
import type { ApiError } from '@/types';

interface RequestOptions extends RequestInit {
  token?: string | null;
  isFormData?: boolean;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    console.error('API Error:', errorData);
    throw errorData;
  }
  if (response.status === 204) { // No content
    return undefined as T;
  }
  return response.json();
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { token, isFormData, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!isFormData && fetchOptions.body && typeof fetchOptions.body === 'object') {
    headers.set('Content-Type', 'application/json');
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  } else if (isFormData) {
    // Content-Type for FormData is set automatically by the browser
  } else {
     headers.set('Content-Type', 'application/json');
  }
  
  headers.set('Accept', 'application/json');


  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  return handleResponse<T>(response);
}

// Auth
export const loginUser = (email: string): Promise<{ user: { login: string }; token: string }> =>
  request(URLS.login, { method: 'POST', body: { email } });

export const fetchUserProfile = (token: string): Promise<any> =>
  request(URLS.me, { method: 'GET', token });


// Dashboard
export const getDashboardSummary = (token: string): Promise<{ total_balance: number; month_income: number; month_expense: number }> =>
  request(URLS.dashboardSummary, { method: 'GET', token });

// Transactions
export const getTransactionTypes = (token: string): Promise<{ types: Record<string, string> }> =>
  request(URLS.transactionTypes, { method: 'GET', token });

export const createTransaction = (data: any, token: string): Promise<any> =>
  request(URLS.transactions, { method: 'POST', body: data, token });

export { request }; // Export generic request if needed elsewhere

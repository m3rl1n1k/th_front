
import { URLS } from '@/config/urls';
import type { ApiError, Transaction, User } from '@/types'; // Added User type

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

  // Handle body and Content-Type
  if (fetchOptions.body) {
    if (isFormData) {
      // For FormData, Content-Type is set by the browser.
      // The body is already FormData, do not stringify.
    } else if (typeof fetchOptions.body === 'object') {
      // If body is an object and not FormData, stringify it.
      // Set Content-Type to application/json if not already set.
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }
    // If body is a string or other type, assume it's pre-formatted and Content-Type (if needed)
    // is set in options.headers by the caller.
  }
  
  // Always expect JSON response
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

export const fetchUserProfile = (token: string): Promise<User> => // Updated to use User type
  request(URLS.me, { method: 'GET', token });


// Dashboard
export const getDashboardTotalBalance = (token: string): Promise<{ total_balance: number }> =>
  request(URLS.dashboardTotalBalance, { method: 'GET', token });

export const getDashboardMonthlyIncome = (token: string): Promise<{ month_income: number }> =>
  request(URLS.dashboardMonthlyIncome, { method: 'GET', token });

export const getDashboardMonthExpenses = (token: string): Promise<{ month_expense: number }> =>
  request(URLS.dashboardMonthExpenses, { method: 'GET', token });


// Transactions
export const getTransactionTypes = (token: string): Promise<{ types: Record<string, string> }> =>
  request(URLS.transactionTypes, { method: 'GET', token });

export const createTransaction = (data: any, token: string): Promise<any> =>
  request(URLS.transactions, { method: 'POST', body: data, token });

export const getTransactionsList = (
  token: string,
  params: Record<string, string | undefined> = {} // Allow undefined for easier param construction
): Promise<{ data: Transaction[], meta: any }> => {
  const definedParams: Record<string, string> = {};
  for (const key in params) {
    if (params[key] !== undefined) {
      definedParams[key] = params[key] as string;
    }
  }
  const queryString = new URLSearchParams(definedParams).toString();
  const url = queryString ? `${URLS.transactions}?${queryString}` : URLS.transactions;
  return request(url, { method: 'GET', token });
};

export { request }; // Export generic request if needed elsewhere

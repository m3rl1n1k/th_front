
import { URLS } from '@/config/urls';
import type { ApiError, Transaction, User } from '@/types';

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

  if (token && token.trim() !== "") {
    headers.set('Authorization', `Bearer ${token.trim()}`);
  }

  // Handle body and Content-Type
  if (fetchOptions.body) {
    if (isFormData) {
      // For FormData, Content-Type is set by the browser.
    } else if (typeof fetchOptions.body === 'object') {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }
  } else {
    // For GET or other requests without a body, ensure Content-Type is not unnecessarily set.
    if (headers.has('Content-Type') && (fetchOptions.method === 'GET' || !fetchOptions.method)) {
        // Only remove if it's a common JSON type, to avoid removing user-set specific types for GET if any.
        if (headers.get('Content-Type')?.includes('application/json')) {
            headers.delete('Content-Type');
        }
    }
  }
  
  headers.set('Accept', 'application/json');

  console.log(`Requesting URL: ${url}`);
  console.log(`Method: ${fetchOptions.method || 'GET'}`);
  console.log('Headers:', Object.fromEntries(headers.entries()));
  if (fetchOptions.body && !isFormData) {
    console.log('Body:', fetchOptions.body);
  }


  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  return handleResponse<T>(response);
}

// Auth
export const loginUser = (email: string): Promise<{ user: { login: string }; token: string }> =>
  request(URLS.login, { method: 'POST', body: { email } });

export const fetchUserProfile = (token: string): Promise<User> =>
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
  params: Record<string, string | undefined> = {}
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

export { request };

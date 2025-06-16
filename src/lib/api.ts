
import { URLS } from '@/config/urls';
import type {
  ApiError,
  Transaction,
  User,
  WalletDetails,
  MainCategory,
  WalletTypeApiResponse,
  CreateMainCategoryPayload,
  CreateSubCategoryPayload,
  SubCategory,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  RepeatedTransactionsApiResponse,
  RepeatedTransactionEntry,
  MonthlyExpensesByCategoryResponse,
  DashboardLastTransactionsResponse // This type has been updated for the new structure
} from '@/types';

interface RequestOptions extends RequestInit {
  token?: string | null;
  isFormData?: boolean;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({ message: 'An unknown error occurred', code: response.status }));
    throw errorData;
  }
  if (response.status === 204) {
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
    if (headers.has('Content-Type') && (fetchOptions.method === 'GET' || !fetchOptions.method)) {
        if (headers.get('Content-Type')?.includes('application/json')) {
            headers.delete('Content-Type');
        }
    }
  }

  headers.set('Accept', 'application/json');

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  return handleResponse<T>(response);
}

// Auth
export const loginUser = (email: string): Promise<{ user: User; token: string }> =>
  request(URLS.login, { method: 'POST', body: { email } });

export const fetchUserProfile = (token: string): Promise<User> =>
  request(URLS.me, { method: 'GET', token });

export const updateUserProfile = (data: Partial<User & { userCurrencyCode?: string }>, token: string): Promise<User> =>
  request(URLS.userProfile, { method: 'PUT', body: data, token });

// Dashboard
export const getDashboardTotalBalance = (token: string): Promise<{ total_balance: number }> =>
  request(URLS.dashboardTotalBalance, { method: 'GET', token });

export const getDashboardMonthlyIncome = (token: string): Promise<{ month_income: number }> =>
  request(URLS.dashboardMonthlyIncome, { method: 'GET', token });

export const getDashboardMonthExpenses = (token: string): Promise<{ month_expense: number }> =>
  request(URLS.dashboardMonthExpenses, { method: 'GET', token });

export const getDashboardChartTotalExpense = (token: string): Promise<MonthlyExpensesByCategoryResponse> =>
  request(URLS.dashboardChartTotalExpense, { method: 'GET', token });

export const getDashboardLastTransactions = (token: string): Promise<DashboardLastTransactionsResponse> =>
  request(URLS.dashboardLastTransactions, { method: 'GET', token });


// Transactions
export const getTransactionTypes = (token: string): Promise<{ types: Record<string, string> }> =>
  request(URLS.transactionTypes, { method: 'GET', token });

export const createTransaction = (data: CreateTransactionPayload, token: string): Promise<Transaction> =>
  request<Transaction>(URLS.transactions, { method: 'POST', body: data, token });

export const getTransactionsList = (
  token: string,
  params: Record<string, string | undefined> = {}
): Promise<{ transactions: Transaction[] }> => {
  const definedParams: Record<string, string> = {};
  for (const key in params) {
    if (params[key] !== undefined) {
      definedParams[key] = params[key] as string;
    }
  }
  const queryString = new URLSearchParams(definedParams).toString();
  const url = queryString ? `${URLS.transactions}?${queryString}` : URLS.transactions;
  return request<{ transactions: Transaction[] }>(url, { method: 'GET', token });
};

export const getTransactionById = async (id: string | number, token: string): Promise<Transaction> => {
  const response = await request<{ transaction: Transaction }>(URLS.transactionById(id), { method: 'GET', token });
  return response.transaction;
};

export const updateTransaction = async (id: string | number, data: UpdateTransactionPayload, token: string): Promise<Transaction> => {
  const response = await request<{ transaction: Transaction }>(URLS.transactionById(id), { method: 'PUT', body: data, token });
  return response.transaction;
};

export const deleteTransaction = (id: string | number, token: string): Promise<void> =>
  request<void>(URLS.transactionById(id), { method: 'DELETE', token });


export const getTransactionFrequencies = (token: string): Promise<{ periods: Record<string, string> }> =>
  request(URLS.transactionFrequencies, { method: 'GET', token });

// Wallets
export const getWalletsList = (token: string): Promise<{ wallets: WalletDetails[] }> =>
  request(URLS.wallets, { method: 'GET', token });

export const getWalletTypes = (token: string): Promise<{ types: WalletTypeApiResponse }> =>
  request(URLS.walletTypes, { method: 'GET', token });

// Categories Page & Management
export const getMainCategories = async (token: string): Promise<MainCategory[]> => {
  const response = await request<{ categories: MainCategory[] }>(URLS.mainCategories, { method: 'GET', token });
  return response.categories || [];
}

export const createMainCategory = (data: CreateMainCategoryPayload, token: string): Promise<MainCategory> =>
  request<MainCategory>(URLS.createMainCategory, { method: 'POST', body: data, token });

export const createSubCategory = (mainCategoryId: string | number, data: CreateSubCategoryPayload, token: string): Promise<SubCategory> =>
  request<SubCategory>(URLS.createSubCategory(mainCategoryId), { method: 'POST', body: data, token });

// Repeated Transactions
export const getRepeatedTransactionsList = (token: string): Promise<RepeatedTransactionsApiResponse> =>
  request(URLS.repeatedTransactionsList, { method: 'GET', token });

export const toggleRepeatedTransactionStatus = (id: string | number, token: string): Promise<RepeatedTransactionEntry> =>
  request(URLS.toggleRepeatedTransactionStatus(id), { method: 'GET', token });

export const deleteRepeatedTransactionDefinition = (id: string | number, token: string): Promise<void> =>
  request<void>(URLS.repeatedTransactionById(id), { method: 'DELETE', token });


export { request };

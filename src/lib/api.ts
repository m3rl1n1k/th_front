
import { URLS } from '@/config/urls';
import type {
  ApiError,
  Transaction,
  User,
  LoginCredentials,
  LoginResponse,
  RegistrationPayload,
  RegistrationResponse,
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
  DashboardLastTransactionsResponse
} from '@/types';

interface RequestOptions extends RequestInit {
  token?: string | null;
  isFormData?: boolean;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
      if (typeof errorData !== 'object' || errorData === null) {
        errorData = { message: response.statusText || 'An unknown error occurred', code: response.status };
      } else {
        errorData.message = errorData.message || errorData.error || errorData.detail || 'An error occurred';
        errorData.code = errorData.code || response.status;
      }
    } catch (e) {
      errorData = { message: response.statusText || 'An unknown error occurred', code: response.status };
    }
    throw errorData;
  }
  if (response.status === 204) { // No Content
    return undefined as T;
  }
  return response.json();
}


async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { token, isFormData, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  console.log(`[API Request] Attempting to call: ${fetchOptions.method || 'GET'} ${url}`);
  if (options.body) {
    console.log('[API Request] Body (pre-stringify):', options.body);
  }


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
      console.log('[API Request] Body (post-stringify):', fetchOptions.body);
    }
  } else {
    if (headers.has('Content-Type') && (fetchOptions.method === 'GET' || !fetchOptions.method)) {
        if (headers.get('Content-Type')?.includes('application/json')) {
            headers.delete('Content-Type');
        }
    }
  }

  headers.set('Accept', 'application/json');
  
  // Convert Headers object to a plain object for logging
  const headersToLog: Record<string, string> = {};
  headers.forEach((value, key) => {
    headersToLog[key] = value;
  });
  console.log('[API Request] Headers:', headersToLog);


  const response = await fetch(url, {
    mode: 'cors', // Explicitly set mode to cors
    ...fetchOptions,
    headers,
  });

  console.log(`[API Response] Status for ${fetchOptions.method || 'GET'} ${url}: ${response.status}`);

  return handleResponse<T>(response);
}

// Auth
export const loginUser = (credentials: LoginCredentials): Promise<LoginResponse> =>
  request(URLS.login, { method: 'POST', body: credentials });

export const registerUser = (payload: RegistrationPayload): Promise<RegistrationResponse> =>
  request(URLS.register, { method: 'POST', body: payload });

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

export const getDashboardLastTransactions = (token: string, limit: number): Promise<DashboardLastTransactionsResponse> =>
  request(URLS.dashboardLastTransactions(limit), { method: 'GET', token });


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
  request<void>(URLS.deleteRepeatedTransaction(id), { method: 'DELETE', token });


export { request };

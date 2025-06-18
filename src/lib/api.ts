
import { URLS } from '@/config/urls';
import type {
  ApiError,
  Transaction,
  User,
  LoginCredentials,
  LoginResponse,
  RegistrationPayload,
  RegistrationResponse,
  ChangePasswordPayload,
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
  DashboardLastTransactionsResponse,
  CreateWalletPayload,
  UpdateWalletPayload as AppUpdateWalletPayload,
  CurrenciesApiResponse,
  CurrencyInfo,
  UpdateMainCategoryPayload,
  UpdateSubCategoryPayload,
  TransferFormDataResponse,
  TransfersListResponse,
  CreateTransferPayload,
  TransferListItem,
  SubmitFeedbackPayload,
  Feedback,
  GetFeedbacksResponse,
  FeedbackTypeOption,
  BudgetListApiResponse,
  BudgetListItem,
  BudgetDetails,
  CreateBudgetPayload,
  UpdateBudgetPayload,
  BudgetSummaryByMonthResponse,
} from '@/types';

interface RequestOptions extends RequestInit {
  token?: string | null;
  isFormData?: boolean;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiError = {
      message: response.statusText || 'An unknown error occurred',
      code: response.status,
    };
    let rawResponseBody = '';

    try {
      rawResponseBody = await response.text();
      errorData.rawResponse = rawResponseBody;

      const jsonData = JSON.parse(rawResponseBody);

      if (typeof jsonData === 'object' && jsonData !== null) {
        errorData.message = jsonData.message || jsonData.error || jsonData.detail || errorData.message;
        errorData.code = jsonData.code || response.status;
        errorData.errors = jsonData.errors;
      } else {
        errorData.message = rawResponseBody || errorData.message;
      }
    } catch (e) {
      errorData.message = rawResponseBody || errorData.message;
    }
    console.error(`[API Error Response] Status: ${response.status}, URL: ${response.url}`);
    console.error('[API Error Response] Raw body:', rawResponseBody);
    console.error('[API Error Response] Processed error object to be thrown:', errorData);
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

  console.log(`[API Request] Attempting to call: ${fetchOptions.method || 'GET'} ${url}`);


  if (token && token.trim() !== "") {
    headers.set('Authorization', `Bearer ${token.trim()}`);
  }

  if (fetchOptions.body) {
    if (isFormData) {
    } else if (typeof fetchOptions.body === 'object') {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      fetchOptions.body = JSON.stringify(fetchOptions.body);
      console.log('[API Request] Body (post-stringify):', fetchOptions.body);
    } else {
       console.log('[API Request] Body (as-is string):', fetchOptions.body);
    }
  } else {
    if (headers.has('Content-Type') && (fetchOptions.method === 'GET' || !fetchOptions.method)) {
        if (headers.get('Content-Type')?.includes('application/json')) {
            headers.delete('Content-Type');
        }
    }
  }

  if (!headers.has('Accept') && !isFormData) {
    headers.set('Accept', 'application/json');
  }

  const headersToLog: Record<string, string> = {};
  headers.forEach((value, key) => {
    headersToLog[key] = value;
  });
  console.log('[API Request] Headers:', headersToLog);


  const response = await fetch(url, {
    mode: 'cors',
    ...fetchOptions,
    headers,
  });

  console.log(`[API Response] Status for ${fetchOptions.method || 'GET'} ${url}: ${response.status}`);
  if (!response.ok) {
    const responseContentType = response.headers.get("content-type");
    console.log(`[API Response] Content-Type for error: ${responseContentType}`);
  }


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

export const changePassword = (data: ChangePasswordPayload, token: string): Promise<void> =>
  request(URLS.changePassword, { method: 'POST', body: data, token });

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
  // Map API's 'frequency' to frontend's 'frequencyId'
  if (response.transaction && response.transaction.frequency !== undefined) {
    response.transaction.frequencyId = String(response.transaction.frequency);
  }
  return response.transaction;
};

export const updateTransaction = async (id: string | number, data: UpdateTransactionPayload, token: string): Promise<Transaction> => {
  const response = await request<{ transaction: Transaction }>(URLS.transactionById(id), { method: 'PUT', body: data, token });
    // Map API's 'frequency' to frontend's 'frequencyId' if present in response
  if (response.transaction && response.transaction.frequency !== undefined) {
    response.transaction.frequencyId = String(response.transaction.frequency);
  }
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

export const createWallet = (data: CreateWalletPayload, token: string): Promise<WalletDetails> =>
  request<WalletDetails>(URLS.createWallet, { method: 'POST', body: data, token });

export const getWalletById = async (id: string | number, token: string): Promise<WalletDetails> => {
  return request<WalletDetails>(URLS.walletById(id), { method: 'GET', token });
}

export const updateWallet = async (id: string | number, data: AppUpdateWalletPayload, token: string): Promise<WalletDetails> => {
 return request<WalletDetails>(URLS.walletById(id), { method: 'PUT', body: data, token });
}

export const deleteWallet = (id: string | number, token: string): Promise<void> =>
  request<void>(URLS.walletById(id), { method: 'DELETE', token });


// Categories Page & Management
export const getMainCategories = async (token: string): Promise<MainCategory[]> => {
  const response = await request<{ categories: MainCategory[] }>(URLS.mainCategories, { method: 'GET', token });
  return response.categories || [];
}

export const getMainCategoryById = async (id: string | number, token: string): Promise<MainCategory> => {
  const response = await request<{ category: MainCategory }>(URLS.mainCategoryById(id), { method: 'GET', token });
  return response.category;
};

export const createMainCategory = (data: CreateMainCategoryPayload, token: string): Promise<MainCategory> =>
  request<MainCategory>(URLS.createMainCategory, { method: 'POST', body: data, token });

export const updateMainCategory = (id: string | number, data: UpdateMainCategoryPayload, token: string): Promise<MainCategory> =>
  request<MainCategory>(URLS.updateMainCategory(id), { method: 'PUT', body: data, token });

export const deleteMainCategory = (id: string | number, token: string): Promise<void> =>
  request<void>(URLS.deleteMainCategory(id), { method: 'DELETE', token });

// SubCategories
export const createSubCategory = (data: CreateSubCategoryPayload, token: string): Promise<SubCategory> =>
  request<SubCategory>(URLS.createSubCategory, { method: 'POST', body: data, token });

export const updateSubCategory = (id: string | number, data: UpdateSubCategoryPayload, token: string): Promise<SubCategory> =>
  request<SubCategory>(URLS.updateSubCategory(id), { method: 'PUT', body: data, token });

export const deleteSubCategory = (id: string | number, token: string): Promise<void> =>
  request<void>(URLS.deleteSubCategory(id), { method: 'DELETE', token });


// Repeated Transactions
export const getRepeatedTransactionsList = (token: string): Promise<RepeatedTransactionsApiResponse> =>
  request(URLS.repeatedTransactionsList, { method: 'GET', token });

export const toggleRepeatedTransactionStatus = (id: string | number, token: string): Promise<RepeatedTransactionEntry> =>
  request(URLS.toggleRepeatedTransactionStatus(id), { method: 'GET', token });

export const deleteRepeatedTransactionDefinition = (id: string | number, token: string): Promise<void> =>
  request<void>(URLS.deleteRepeatedTransaction(id), { method: 'DELETE', token });

// Transfers
export const getTransferFormData = (token: string): Promise<TransferFormDataResponse> =>
  request(URLS.transferFormData, { method: 'GET', token });

export const getTransfersList = (token: string): Promise<TransfersListResponse> =>
  request(URLS.transfersList, { method: 'GET', token });

export const createTransfer = (data: CreateTransferPayload, token: string): Promise<TransferListItem> =>
  request<TransferListItem>(URLS.createTransfer, { method: 'POST', body: data, token });

export const deleteTransfer = (id: string | number, token: string): Promise<void> =>
  request<void>(URLS.deleteTransfer(id), { method: 'DELETE', token });

// General
export const getCurrencies = (token: string): Promise<CurrenciesApiResponse> =>
  request(URLS.currencies, { method: 'GET', token });

// Feedback
export const submitFeedback = (data: SubmitFeedbackPayload, token: string): Promise<{ message: string }> => {
  return request(URLS.submitFeedback, { method: 'POST', body: data, token });
};

export const getFeedbacks = (token: string): Promise<GetFeedbacksResponse> => {
  return request(URLS.getFeedbacks, { method: 'GET', token });
};

// Budgets
export const getBudgetList = (token: string): Promise<BudgetListApiResponse> => {
  return request(URLS.getBudgets, { method: 'GET', token });
};

// This function fetches a specific budget item using its global ID.
export const getBudgetDetails = async (id: string | number, token: string): Promise<BudgetDetails> => {
  const response = await request<{ budget: BudgetDetails }>(URLS.getBudgetById(id), { method: 'GET', token });
  return response.budget;
};

// New function to fetch a budget item for editing using the summary path
export const getBudgetSummaryItemForEdit = async (date: string, id: string | number, token: string): Promise<BudgetDetails> => {
  // Assuming the response structure is {"budget": BudgetDetails}, same as getBudgetById
  const response = await request<{ budget: BudgetDetails }>(URLS.getBudgetSummaryItemForEdit(date, id), { method: 'GET', token });
  return response.budget;
};


export const createBudget = (data: CreateBudgetPayload, token: string): Promise<BudgetListItem> => {
  return request<BudgetListItem>(URLS.createBudget, { method: 'POST', body: data, token });
};

export const updateBudget = (id: string | number, data: UpdateBudgetPayload, token: string): Promise<BudgetListItem> => {
  return request<BudgetListItem>(URLS.updateBudget(id), { method: 'PUT', body: data, token });
};

export const deleteBudget = (id: string | number, token: string): Promise<void> => {
  return request<void>(URLS.deleteBudget(id), { method: 'DELETE', token });
};

export const getBudgetSummaryForMonth = (monthYear: string, token: string): Promise<BudgetSummaryByMonthResponse> => {
  return request<BudgetSummaryByMonthResponse>(URLS.getBudgetSummaryForMonth(monthYear), { method: 'GET', token });
};


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
  ApiBudgetDetailItem,
  CreateBudgetPayload,
  UpdateBudgetPayload,
  BudgetSummaryByMonthResponse,
  CapitalData,
  CapitalDetailsApiResponse,
  CreateCapitalPayload,
  Invitation,
  CreateInvitationPayload,
  AcceptInvitationPayload,
  RejectInvitationPayload,
  GetInvitationsApiResponse,
  UserSettings,
  GetTransactionsListResponse,
  ReportDataResponse,
} from '@/types';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  token?: string | null;
  isFormData?: boolean;
  body?: BodyInit | Record<string, any> | null;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let rawResponseBody = '';
    let jsonData: any = null;
    let finalErrorMessage: string = response.statusText || 'An unknown error occurred';

    try {
      rawResponseBody = await response.text();
      // Only parse if there's content
      if (rawResponseBody) {
        jsonData = JSON.parse(rawResponseBody);
      }
    } catch (e) {
      // JSON parsing failed, use raw text if available.
      const errorToThrow: ApiError = {
        message: rawResponseBody || finalErrorMessage,
        code: response.status,
        rawResponse: rawResponseBody,
      };
      throw errorToThrow;
    }

    if (typeof jsonData === 'object' && jsonData !== null) {
      if (jsonData.errors && typeof jsonData.errors === 'object') {
        // Format from `errors` object: { "field": ["message"] }
        finalErrorMessage = Object.values(jsonData.errors).flat().join('; ');
      } else if (Array.isArray(jsonData.message)) {
         // Format from `message` array: [{ "field": "...", "message": "..." }]
        finalErrorMessage = jsonData.message
          .map((err: any) => err.message || JSON.stringify(err))
          .join('; ');
      } else if (jsonData.message || jsonData.error || jsonData.detail) {
        // Fallback to other possible string keys
        finalErrorMessage = jsonData.message || jsonData.error || jsonData.detail;
      }
    } else if (rawResponseBody) {
      // Handle cases where the response is a non-JSON string
      finalErrorMessage = rawResponseBody;
    }

    const errorToThrow: ApiError = {
      message: finalErrorMessage,
      code: jsonData?.code || response.status,
      errors: jsonData?.errors,
      rawResponse: rawResponseBody,
    };

    throw errorToThrow;
  }

  // Handle successful but empty responses (e.g., 204 No Content)
  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
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

  if (!headers.has('Accept') && !isFormData) {
    headers.set('Accept', 'application/json');
  }

  let response;
  try {
      response = await fetch(url, {
        mode: 'cors',
        ...fetchOptions,
        headers,
      });
  } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
          const apiError: ApiError = {
              message: 'Network error: Could not connect to the API. Please ensure the backend server is running and that CORS is configured correctly.',
              code: 503, // Service Unavailable
          };
          throw apiError;
      }
      // Re-throw other network errors
      throw error;
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

export const verifyEmail = (verificationToken: string): Promise<{ message: string }> =>
  request(URLS.verifyEmail, { method: 'POST', body: { token: verificationToken } });

export const resendVerificationEmail = (token: string): Promise<{ message: string }> =>
  request(URLS.resendVerificationEmail, { method: 'GET', token });

// User Settings
export const getUserSettings = (token: string): Promise<{ settings: UserSettings }> =>
  request(URLS.userSettings, { method: 'GET', token });

export const updateUserSettings = (data: Partial<UserSettings>, token: string): Promise<{ settings: UserSettings }> =>
  request(URLS.userSettings, { method: 'POST', body: data, token });


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
  params: Record<string, string | number | undefined> = {}
): Promise<GetTransactionsListResponse> => {
  const definedParams: Record<string, string> = {};
  for (const key in params) {
    if (params[key] !== undefined) {
      definedParams[key] = String(params[key]);
    }
  }
  const queryString = new URLSearchParams(definedParams).toString();
  const url = queryString ? `${URLS.transactions}?${queryString}` : URLS.transactions;
  return request<GetTransactionsListResponse>(url, { method: 'GET', token });
};

export const getTransactionById = async (id: string | number, token: string): Promise<Transaction> => {
  const response = await request<{ transaction: Transaction }>(URLS.transactionById(id), { method: 'GET', token });
  if (response.transaction && response.transaction.frequency !== undefined) {
    response.transaction.frequencyId = String(response.transaction.frequency);
  }
  return response.transaction;
};

export const updateTransaction = async (id: string | number, data: UpdateTransactionPayload, token: string): Promise<Transaction> => {
  const response = await request<{ transaction: Transaction }>(URLS.transactionById(id), { method: 'PUT', body: data, token });
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

export const getBudgetSummaryItemForEdit = async (date: string, id: string | number, token: string): Promise<BudgetDetails> => {
  const responseArray = await request<ApiBudgetDetailItem[]>(URLS.getBudgetSummaryItemForEdit(date, id), { method: 'GET', token });

  if (!responseArray || responseArray.length === 0) {
    throw new Error('Budget item not found or empty response.');
  }
  const apiItem = responseArray[0];

  const transformedDetails: BudgetDetails = {
    id: apiItem.id,
    month: apiItem.month,
    plannedAmount: apiItem.plannedAmount.amount / 100,
    currencyCode: apiItem.currency.code || apiItem.plannedAmount.currency.code,
    subCategory: {
      id: apiItem.subCategory.id,
      name: apiItem.subCategory.name,
    },
  };
  return transformedDetails;
};


export const createBudget = (data: CreateBudgetPayload, token: string): Promise<BudgetListItem> => {
  return request<BudgetListItem>(URLS.createBudget, { method: 'POST', body: data, token });
};

export const updateBudget = (date: string, id: string | number, data: UpdateBudgetPayload, token: string): Promise<BudgetListItem> => {
  return request<BudgetListItem>(URLS.updateBudget(date, id), { method: 'PUT', body: data, token });
};

export const deleteBudget = (date: string, id: string | number, token: string): Promise<void> => {
  return request<void>(URLS.deleteBudget(date, id), { method: 'POST', token });
};

export const deleteBudgetsForMonth = (monthYear: string, token: string): Promise<void> => {
  return request<void>(URLS.deleteBudgetsForMonth(monthYear), { method: 'DELETE', token });
};

export const getBudgetSummaryForMonth = (monthYear: string, token: string): Promise<BudgetSummaryByMonthResponse> => {
  return request<BudgetSummaryByMonthResponse>(URLS.getBudgetSummaryForMonth(monthYear), { method: 'GET', token });
};

// Capital & Invitations
export const createCapital = (data: CreateCapitalPayload, token: string): Promise<CapitalDetailsApiResponse> =>
  request(URLS.createCapital, { method: 'POST', body: data, token });

export const getCapitalDetails = (capitalId: string | number, token: string): Promise<CapitalDetailsApiResponse> =>
  request(URLS.getCapitalDetails(capitalId), { method: 'GET', token });

export const deleteCapital = (capitalId: string | number, token: string): Promise<void> =>
  request(URLS.deleteCapital(capitalId), { method: 'DELETE', token });

export const removeUserFromCapital = (userId: string | number, token: string): Promise<void> => {
  return request(URLS.removeUserFromCapital(userId), { method: 'DELETE', token });
}

export const getInvitations = async (token: string): Promise<GetInvitationsApiResponse> => {
  const response = await request<GetInvitationsApiResponse>(URLS.getInvitations, { method: 'GET', token });
  return response;
}

export const createInvitation = (capitalId: string | number, data: CreateInvitationPayload, token: string): Promise<Invitation> =>
  request(URLS.createInvitation(capitalId), { method: 'POST', body: data, token });

export const acceptInvitation = (invitationId: string | number, token: string): Promise<{message: string}> =>
  request(URLS.acceptInvitation(invitationId), { method: 'POST', body: { capital_invitation: Number(invitationId) }, token });

export const rejectInvitation = (invitationId: string | number, token: string): Promise<{message: string}> =>
  request(URLS.rejectInvitation(invitationId), { method: 'POST', body: { capital_invitation: Number(invitationId) }, token });

// Reports
export const getReportData = (token: string, year: number, month: number | string): Promise<ReportDataResponse> => {
  return request(URLS.getReportData(year, month), { method: 'GET', token });
};

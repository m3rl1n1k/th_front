
export interface User {
  id: string | number;
  login: string; // This is the username
  email: string;
  memberSince?: string;
  userCurrency?: {
    code: string;
  };
}

export interface LoginCredentials {
  username: string; // Will contain the email input
  password?: string; // Password will be optional if we keep set-token for dev
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegistrationPayload {
  email: string;
  login: string; // This is the username
  password?: string;
}

export interface RegistrationResponse {
  message?: string;
  user?: User; // Optional: API might return the created user
}


export interface TransactionAmount {
  amount: number; // This is in cents from the API
  currency: {
    code: string;
  };
}

export interface TransactionSubCategory {
  id: string | number;
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface TransactionWallet {
  id: string | number;
  name: string;
  number?: string;
}

export interface Transaction {
  id: string | number;
  amount: TransactionAmount; // Amount is in cents
  currency: {
    code: string;
  };
  exchangeRate: number;
  type: number; // Numeric ID from API
  description: string | null;
  wallet: TransactionWallet;
  subCategory: TransactionSubCategory | null;
  user?: {
    id: string | number;
  };
  source: string | null;
  date: string; // ISO date string
  isRecurring?: boolean;
  frequencyId?: string;

  // Frontend derived/display properties
  typeName?: string;
  categoryName?: string | null;

  // Potential form fields
  walletId?: string;
  categoryId?: string;
}

export interface CreateTransactionPayload {
  amount: number; // In cents for API
  description: string | null;
  typeId: string; // String ID from GET /transactions/types
  date: string; // YYYY-MM-DD
  wallet_id: number; // Numeric ID
  category_id: number | null; // Numeric ID (subCategory ID)
  frequencyId: string; // String ID from GET /transactions/frequency
}

export interface UpdateTransactionPayload {
  amount: number; // In cents for API
  description?: string | null;
  typeId: string;
  date: string; // YYYY-MM-DD
  wallet_id: number;
  category_id?: number | null;
  frequencyId: string;
}


export interface TransactionType {
  id: string;
  name: string;
}

export interface ApiError {
  message: string;
  code?: number;
  errors?: Record<string, string[]>; // Field-specific errors for validation
  error?: string; // Sometimes error is a single string
  detail?: string; // For other error structures
  rawResponse?: string; // To store the raw server response text
}


export interface Frequency {
  id: string;
  name: string;
}

export interface WalletDetails {
  id: number;
  name: string;
  amount: TransactionAmount; // Amount is in cents
  number: string;
  currency: {
    code: string;
  };
  type: string | null;
  user: {
    id: number;
  };
  typeName?: string;
}

export interface FormCategory {
  id:string;
  name: string;
  icon?: string | null;
  color?: string | null;
}

export type WalletTypeApiResponse = Record<string, string>;

export type WalletTypeMap = Record<string, string>;

export interface SubCategory {
  id: string | number;
  name: string;
  icon: string | null;
  color: string | null;
  mainCategoryId?: string | number;
}

export interface MainCategory {
  id: string | number;
  name: string;
  icon: string | null;
  color: string | null;
  subCategories: SubCategory[];
}

export interface CreateMainCategoryPayload {
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface CreateSubCategoryPayload {
  name: string;
  icon?: string | null;
  color?: string | null;
  mainCategoryId: string;
}

export interface RepeatedTransactionEntry {
  id: number | string;
  transaction: {
    id: number | string;
    description?: string | null;
  };
  status: number;
  frequency: string;
  createdAt: string;
  nextExecution: string;

  frequencyName?: string;
  statusName?: string;
}

export interface RepeatedTransactionsApiResponse {
  repeated_transactions: RepeatedTransactionEntry[];
}

// Dashboard Chart Data
export interface MonthlyExpenseByCategoryItem {
  amount: number; // in cents
  color?: string; // Optional color from backend
}

export interface MonthlyExpensesByCategoryResponse {
  month_expense_chart: Record<string, MonthlyExpenseByCategoryItem>; // Keys are category names
}


// Dashboard Last Activity: List of individual transactions
export interface DashboardLastTransactionsResponse {
  last_transactions: Transaction[];
}


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
  password?: string; 
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
  amount: TransactionAmount; 
  currency: {
    code: string;
  };
  exchangeRate: number;
  type: number; 
  description: string | null;
  wallet: TransactionWallet;
  subCategory: TransactionSubCategory | null;
  user?: {
    id: string | number;
  };
  source: string | null;
  date: string; 
  isRecurring?: boolean;
  frequencyId?: string;

  typeName?: string;
  categoryName?: string | null;

  walletId?: string;
  categoryId?: string;
}

export interface CreateTransactionPayload {
  amount: number; 
  description: string | null;
  typeId: string; 
  date: string; 
  wallet_id: number; 
  category_id: number | null; 
  frequencyId: string; 
}

export interface UpdateTransactionPayload {
  amount: number; 
  description?: string | null;
  typeId: string;
  date: string; 
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
  errors?: Record<string, string[]>; 
  error?: string; 
  detail?: string; 
  rawResponse?: string; 
}


export interface Frequency {
  id: string;
  name: string;
}

export interface WalletDetails {
  id: number;
  name: string;
  amount: TransactionAmount; 
  number: string; // Account number
  currency: { // Currency of the wallet itself
    code: string;
  };
  type: string; // Type key like "main", "cash", "credit"
  user: {
    id: number;
  };
  typeName?: string; // For display, translated
  // Icon and color are typically not part of the GET /wallets response as per API_DOC,
  // they are determined by 'type' on the frontend or managed separately if customizable.
}

export interface CreateWalletPayload {
  name: string;
  amount_cents: number; // API expects cents for creation
  currency: string; // e.g., "USD", "EUR"
  type: string; // Type key like "main", "cash" from GET /wallets/types
  account_number?: string | null;
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

export interface MonthlyExpenseByCategoryItem {
  amount: number; 
  color?: string; 
}

export interface MonthlyExpensesByCategoryResponse {
  month_expense_chart: Record<string, MonthlyExpenseByCategoryItem>; 
}

export interface DashboardLastTransactionsResponse {
  last_transactions: Transaction[];
}

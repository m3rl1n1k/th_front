
export interface User {
  id: string | number;
  login: string;
  email: string;
  memberSince?: string;
  userCurrency?: {
    code: string;
  };
}

export interface TransactionAmount {
  amount: number; // This is in cents from the API for GET requests
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

export interface Transaction {
  id: string | number;
  amount: TransactionAmount;
  currency: {
    code: string;
  };
  exchangeRate: number;
  type: number; // Numeric ID from API
  description: string | null;
  wallet: {
    id: string | number;
    name: string;
  };
  subCategory: TransactionSubCategory | null;
  user: {
    id: string | number;
  };
  source: string | null;
  date: string; // ISO date string
  isRecurring?: boolean; // Derived or sent by backend
  frequencyId?: string; // From GET /transactions/frequency

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
  errors?: Record<string, string[]>;
}

export interface Frequency {
  id: string;
  name: string;
}

export interface Wallet {
  id: string | number;
  name: string;
  amount: TransactionAmount;
}

export interface WalletDetails {
  id: number;
  name: string;
  amount: TransactionAmount;
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
  id: string;
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

// For the new repeated transactions feature
export interface RepeatedTransactionEntry {
  id: number | string; // ID of the RECURRENCE RULE/DEFINITION
  transaction: {
    id: number | string; // ID of the TEMPLATE TRANSACTION
    description?: string | null;
    // Other potential fields from the template transaction might be here
    // e.g. amount: { amount: number; currency: { code: string } };
    // e.g. type: number;
  };
  status: number; // e.g., 1 for active, 0 for inactive
  frequency: string; // Frequency ID (e.g., "1", "5")
  createdAt: string; // ISO date string
  nextExecution: string; // ISO date string

  // Frontend derived
  frequencyName?: string;
  statusName?: string;
  templateTransactionDescription?: string; // For display
}

export interface RepeatedTransactionsApiResponse {
  repeated_transactions: RepeatedTransactionEntry[];
}

export interface ToggleStatusPayload {
  status: number;
}

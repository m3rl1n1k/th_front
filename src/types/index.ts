
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

export interface Transaction {
  id: string | number;
  amount: TransactionAmount; // Updated to use TransactionAmount
  currency: { // Often redundant if amount object has it, but API might send it
    code: string;
  };
  exchangeRate: number;
  type: number; // Numeric ID from API (e.g., 1 for INCOME, 2 for EXPENSE)
  description: string | null;
  wallet: {
    id: string | number;
    name: string;
  };
  subCategory: {
    id?: string | number;
    name?: string;
  } | null;
  user: {
    id: string | number;
  };
  source: string | null;
  date: string; // ISO date string e.g., "2024-07-28T14:30:00Z"
  isRecurring?: boolean; // This might be derived from frequencyId or sent by backend
  frequencyId?: string; // From GET /transactions/frequency

  // Frontend derived/display properties
  typeName?: string;
  categoryName?: string | null;

  // Potential form fields (ensure consistency with payloads)
  walletId?: string; // string for form binding
  categoryId?: string; // string for form binding
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
  // source?: string | null; // Include if API expects it and form supports it
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
  amount: TransactionAmount; // Re-using TransactionAmount
}

export interface WalletDetails {
  id: number;
  name: string;
  amount: TransactionAmount; // Re-using TransactionAmount
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

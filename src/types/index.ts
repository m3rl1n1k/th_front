
export interface User {
  id: string | number;
  login: string;
  email: string;
  memberSince?: string;
  userCurrency?: { // Added user's preferred currency
    code: string;
  };
  // Roles removed as per requirement not to show them
}

// Updated Transaction interface to match the new API response
export interface Transaction {
  id: string | number;
  amount: {
    amount: number; // Assuming this is in cents as per original API doc intent
    currency: {
      code: string;
    };
  };
  currency: { // Top-level currency information, might be redundant if amount.currency is always present
    code: string;
  };
  exchangeRate: number;
  type: number; // Numeric type (e.g., 1 for INCOME, 2 for EXPENSE)
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
  source: string;
  date: string; // ISO 8601 date string
  isRecurring?: boolean;
  typeName?: string; // To be populated client-side (e.g., "INCOME", "EXPENSE")
}

export interface TransactionType {
  id: string; // e.g., "1", "2"
  name: string; // e.g., "INCOME", "EXPENSE"
}

export interface ApiError {
  message: string;
  code?: number;
  errors?: Record<string, string[]>;
}

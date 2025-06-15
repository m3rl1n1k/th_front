
export interface User {
  id: string | number;
  login: string;
  email: string;
  memberSince?: string;
  userCurrency?: {
    code: string;
  };
}

export interface Transaction {
  id: string | number;
  amount: {
    amount: number;
    currency: {
      code: string;
    };
  };
  currency: { // This seems redundant if amount.currency exists, but API provides it
    code: string;
  };
  exchangeRate: number;
  type: number; // Numeric type from API (e.g., 1 for INCOME, 2 for EXPENSE)
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
  source: string | null; // Can be used as fallback for details or category-like info
  date: string; // ISO 8601 date string
  isRecurring?: boolean;

  // Fields added client-side for display
  typeName?: string; // e.g., "INCOME", "EXPENSE"
  categoryName?: string | null; // Derived name of the category

  // Fields for form binding, might not be directly on API GET response
  walletId?: string;
  categoryId?: string;
  frequencyId?: string;
}

export interface TransactionType {
  id: string; // "1", "2"
  name: string; // "INCOME", "EXPENSE"
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
  amount: {
    amount: number;
    currency: {
      code: string;
    };
  };
}

export interface WalletDetails { // For /wallets page list
  id: number;
  name: string;
  amount: {
    amount: number;
    currency: {
      code: string;
    };
  };
  number: string;
  currency: {
    code: string;
  };
  type: string | null;
  user: {
    id: number;
  };
  typeName?: string; // Client-side processed type name
}

// This represents the structure of categories used in the form dropdown
export interface FormCategory {
  id: string;
  name: string;
}

export type WalletTypeApiResponse = Record<string, string>; // e.g. { "main": "MAIN", "deposit": "DEPOSIT" }

export type WalletTypeMap = Record<string, string>;


// For the new Categories page
export interface SubCategory {
  id: string | number;
  name: string;
  icon: string | null; // Icon name or identifier
  color: string | null; // Hex color string or Tailwind class
  mainCategoryId?: string | number; // Optional, if needed for context
}

export interface MainCategory {
  id: string | number;
  name: string;
  icon: string | null; // Icon name or identifier
  color: string | null; // Hex color string or Tailwind class
  subCategories: SubCategory[];
}

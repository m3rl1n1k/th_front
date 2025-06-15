
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
  currency: { 
    code: string;
  };
  exchangeRate: number;
  type: number; 
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
  date: string; 
  isRecurring?: boolean;
  typeName?: string; 
  walletId?: string; // For form
  categoryId?: string; // For form
  frequencyId?: string; // For form, if recurring
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
  // For form selection primarily
}

export interface WalletDetails {
  id: number;
  name: string;
  amount: {
    amount: number;
    currency: {
      code: string;
    };
  };
  number: string;
  currency: { // Top-level currency for the wallet itself
    code: string;
  };
  type: string; // e.g., "main", "deposit" - key for walletTypes
  user: {
    id: number;
  };
  typeName?: string; // To be populated client-side using WalletTypeMap
}

export interface Category {
  id: string;
  name: string;
}

// Raw structure from API: { "main": "MAIN", ... }
export type WalletTypeApiResponse = Record<string, string>;

// Processed structure for easier use: { id: "main", name: "MAIN" }
export interface WalletType {
  id: string;
  name: string;
}

// Map for quick lookup: { "main": "MAIN_translated_or_raw", ... }
export type WalletTypeMap = Record<string, string>;


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
  walletId?: string; 
  categoryId?: string; 
  frequencyId?: string; 
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

// This type is for the form select, getWalletsList API returns WalletDetails
export interface Wallet {
  id: string | number; // Make id string to match form value type
  name: string;
  amount: { // Add amount and currency for display in select
    amount: number;
    currency: {
      code: string;
    };
  };
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
  currency: { 
    code: string;
  };
  type: string; 
  user: {
    id: number;
  };
  typeName?: string; 
}

export interface Category {
  id: string;
  name: string;
}

export type WalletTypeApiResponse = Record<string, string>;

export interface WalletType {
  id: string;
  name: string;
}

export type WalletTypeMap = Record<string, string>;


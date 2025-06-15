
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
  source: string | null;
  date: string; 
  isRecurring?: boolean;

  typeName?: string; 
  categoryName?: string | null; 

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
  mainCategoryId?: string | number; // This field is expected from the API in GET /main/categories
}

export interface MainCategory {
  id: string | number;
  name: string;
  icon: string | null; 
  color: string | null; 
  subCategories: SubCategory[];
}

// For category creation forms
export interface CreateMainCategoryPayload {
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface CreateSubCategoryPayload {
  name: string;
  icon?: string | null;
  color?: string | null;
  mainCategoryId: string; // This will be used in the URL for the API, and potentially in the body if backend expects it
}


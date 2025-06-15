
export interface User {
  id: string | number;
  login: string; 
  email: string;
  memberSince?: string; 
}

export interface Transaction {
  id: string | number;
  amount: number; 
  description: string;
  typeId: string; 
  typeName?: string; 
  date: string; 
  isRecurring: boolean;
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


export interface User {
  id: string | number;
  login: string; // This is the username derived from email
  email: string;
  // Add other user properties as needed
}

export interface Transaction {
  id: string | number;
  amount: number; // in cents
  description: string;
  typeId: string; // e.g., "1", "2" (from API)
  typeName?: string; // e.g., "INCOME", "EXPENSE" (from API)
  date: string; // ISO date string, e.g., "2024-07-28"
  isRecurring: boolean;
  createdAt?: string; // ISO 8601 date string from API
  // Add other transaction properties
}

export interface TransactionType {
  id: string;
  name: string; // e.g. "INCOME", "EXPENSE"
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

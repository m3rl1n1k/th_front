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
  type: string; // e.g., "INCOME", "EXPENSE", "TRANSFER" or their IDs like "1", "2"
  typeId?: string; // "1", "2"
  date: string; // ISO date string
  isRecurring: boolean;
  // Add other transaction properties
}

export interface TransactionType {
  id: string;
  name: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

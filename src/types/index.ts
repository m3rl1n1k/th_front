
export interface User {
  id: string | number;
  login: string; // This is the username derived from email
  email: string;
  memberSince?: string; // Optional: ISO Date string for when the user joined
  // Add other user properties as needed
}

interface AmountDetails {
  amount: number; // in cents/smallest unit
  currency: {
    code: string; // e.g., "PLN", "USD"
  };
}

export interface Transaction {
  id: number; // API response shows number
  amount: AmountDetails;
  currency: { // Top-level currency info from API
    code: string;
  };
  exchangeRate: number;
  type: number; // e.g., 1 for INCOME, 2 for EXPENSE
  description: string | null;
  wallet?: { // Making wallet optional as it might not always be relevant for display
    id: number;
    name: string;
  };
  subCategory?: any | null; // Or a more specific type if known
  user?: { // Making user optional
    id: number;
  };
  source?: string | null; // API shows string, can be empty
  date: string; // Full ISO 8601 timestamp, e.g., "2025-06-15T10:26:18+00:00"
  isRecurring?: boolean; // Assuming backend might provide this for filtering
  typeName?: string; // For frontend mapping convenience, populated from `type` and `transactionTypes`
}

export interface TransactionType {
  id: string; // e.g., "1", "2" (maps to Transaction.type but as string)
  name: string; // e.g. "INCOME", "EXPENSE"
}

export interface ApiError {
  message: string;
  code?: number;
  errors?: Record<string, string[]>;
}

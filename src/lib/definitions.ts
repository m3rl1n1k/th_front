
export interface UserSettings {
  transactionsPerPage: number;
  defaultCurrency?: string;
  showTotalBalanceCard?: boolean;
  showMonthlyIncomeCard?: boolean;
  showMonthlyExpensesCard?: boolean;
  showAverageSpendingCard?: boolean;
  showExpenseChartCard?: boolean;
  showRecentActivityCard?: boolean;
  geminiApiKey?: string; // Added for AI settings
}

export interface User {
  id: string;
  email: string;
  name?: string;
  settings?: UserSettings;
}

export type TransactionType = 'Income' | 'Expense';
export type TransactionFrequency = 'One-time' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface Transaction {
  id: string;
  userId: string;
  subCategoryId?: string; // Made optional
  walletId: string;
  type: TransactionType;
  frequency: TransactionFrequency;
  amount: number;
  createdAt: Date;
  description?: string;
}

export interface MainCategory {
  id: string;
  userId: string;
  name: string;
  color: string; // hex code
  icon?: string; // Name of a lucide-react icon
}

export interface SubCategory {
  id:string;
  userId: string;
  mainCategoryId: string;
  name: string;
  color: string; // hex code
  icon?: string; // Name of a lucide-react icon
}

export type WalletType = 'Cash' | 'Bank Account' | 'Credit Card' | 'E-Wallet';

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  currency: string; // e.g., USD, EUR
  initialAmount: number; // Use 'initialAmount' to avoid confusion with current balance which might be calculated
  type: WalletType;
  icon?: string; // Name of a lucide-react icon
  // Current balance can be calculated by summing transactions or stored and updated.
  // For simplicity in CRUD, we might just store initialAmount.
}

export interface Transfer {
  id: string;
  userId: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  createdAt: Date;
  description?: string;
}

export interface Budget {
  id: string;
  userId: string;
  subCategoryId: string; // Changed from mainCategoryId
  plannedAmount: number;
  month: number; // 1-12
  year: number;
  createdAt: Date;
}

export interface SharedCapitalSession {
  id: string;
  userId: string;
  partnerEmail: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type FeedbackStatus = 'pending' | 'active' | 'closed';
export const feedbackStatuses: FeedbackStatus[] = ['pending', 'active', 'closed'];


export interface FeedbackItem {
  id: string;
  userId: string;
  feedbackType: FeedbackType;
  subject: string;
  message: string;
  userEmail?: string;
  status: FeedbackStatus;
  createdAt: Date;
}
// Assuming FeedbackType is defined in submit-feedback-flow and imported where needed,
// or should be defined here. For now, using a generic string for simplicity if not strictly typed.
export type FeedbackType = 'Technical Issue' | 'Error Report' | 'Suggestion' | 'General Feedback' | 'Other';
export const feedbackTypes: FeedbackType[] = ['Technical Issue', 'Error Report', 'Suggestion', 'General Feedback', 'Other'];


// Mock data types
export type MockDb = {
  users: User[];
  mainCategories: MainCategory[];
  subCategories: SubCategory[];
  wallets: Wallet[];
  transactions: Transaction[];
  transfers: Transfer[];
  budgets: Budget[];
  sharedCapitalSessions: SharedCapitalSession[];
  feedbacks: FeedbackItem[]; // Added for storing feedback
};


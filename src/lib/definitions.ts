
export interface UserSettings {
  transactionsPerPage: number;
  defaultCurrency?: string;
  showTotalBalanceCard?: boolean;
  showMonthlyIncomeCard?: boolean;
  showMonthlyExpensesCard?: boolean;
  showAverageSpendingCard?: boolean;
  showExpenseChartCard?: boolean;
  showRecentActivityCard?: boolean;
  geminiApiKey?: string; 
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
  subCategoryId?: string; 
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
  color: string; 
  icon?: string; 
  subCategories?: SubCategory[]; // Added to support nested subcategories from API
}

export interface SubCategory {
  id:string;
  userId: string;
  mainCategoryId: string; // This will be populated from main_category from API if needed
  name: string;
  color: string; 
  icon?: string; 
}

export type WalletType = 'Cash' | 'Bank Account' | 'Credit Card' | 'E-Wallet';

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  currency: string; 
  initialAmount: number; 
  type: WalletType;
  icon?: string; 
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
  subCategoryId: string; 
  plannedAmount: number;
  month: number; 
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

export type FeedbackType = 'Technical Issue' | 'Error Report' | 'Suggestion' | 'General Feedback' | 'Other';
export const feedbackTypes: FeedbackType[] = ['Technical Issue', 'Error Report', 'Suggestion', 'General Feedback', 'Other'];


// Mock data types
export type MockDb = {
  users: User[];
  mainCategories: MainCategory[]; // MainCategory will now potentially hold subCategories for mock consistency
  subCategories: SubCategory[]; // This might become less directly used if all subcats are nested
  wallets: Wallet[];
  transactions: Transaction[];
  transfers: Transfer[];
  budgets: Budget[];
  sharedCapitalSessions: SharedCapitalSession[];
  feedbacks: FeedbackItem[]; 
};

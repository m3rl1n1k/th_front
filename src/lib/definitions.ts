
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
  login?: string; // Added login/username field
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
  subCategories?: SubCategory[];
}

export interface SubCategory {
  id:string;
  userId: string;
  mainCategoryId: string;
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
export interface MockDb {
  users: User[];
  mainCategories: MainCategory[];
  subCategories: SubCategory[];
  wallets: Wallet[];
  transactions: Transaction[];
  transfers: Transfer[];
  budgets: Budget[];
  sharedCapitalSessions: SharedCapitalSession[];
  feedbacks: FeedbackItem[];
};

const initialMockDbState: MockDb = {
  users: [{
    id: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
    login: 'testuser',
    settings: {
      transactionsPerPage: 10,
      defaultCurrency: 'USD',
      showTotalBalanceCard: true,
      showMonthlyIncomeCard: true,
      showMonthlyExpensesCard: true,
      showAverageSpendingCard: true,
      showExpenseChartCard: true,
      showRecentActivityCard: true,
    }
  }],
  mainCategories: [
    { id: 'mc1', userId: 'user-123', name: 'Food', color: '#FF6347', icon: 'Utensils',
      subCategories: [
        { id: 'sc1', userId: 'user-123', mainCategoryId: 'mc1', name: 'Groceries', color: '#FFA07A', icon: 'ShoppingCart' },
        { id: 'sc2', userId: 'user-123', mainCategoryId: 'mc1', name: 'Restaurants', color: '#FA8072', icon: 'Utensils' },
      ]
    },
    { id: 'mc2', userId: 'user-123', name: 'Transport', color: '#4682B4', icon: 'Car',
      subCategories: [
        { id: 'sc3', userId: 'user-123', mainCategoryId: 'mc2', name: 'Gas', color: '#B0C4DE', icon: 'Fuel' },
      ]
    },
    { id: 'mc3', userId: 'user-123', name: 'Housing', color: '#2E8B57', icon: 'Home',
      subCategories: [
         { id: 'sc4', userId: 'user-123', mainCategoryId: 'mc3', name: 'Rent', color: '#90EE90', icon: 'Home' },
      ]
    },
    { id: 'mc4', userId: 'user-123', name: 'Entertainment', color: '#8A2BE2', icon: 'Film',
      subCategories: [
        { id: 'sc5', userId: 'user-123', mainCategoryId: 'mc4', name: 'Movies', color: '#9370DB', icon: 'Ticket'}
      ]
    }
  ],
  subCategories: [
    { id: 'sc1', userId: 'user-123', mainCategoryId: 'mc1', name: 'Groceries', color: '#FFA07A', icon: 'ShoppingCart' },
    { id: 'sc2', userId: 'user-123', mainCategoryId: 'mc1', name: 'Restaurants', color: '#FA8072', icon: 'Utensils' },
    { id: 'sc3', userId: 'user-123', mainCategoryId: 'mc2', name: 'Gas', color: '#B0C4DE', icon: 'Fuel' },
    { id: 'sc4', userId: 'user-123', mainCategoryId: 'mc3', name: 'Rent', color: '#90EE90', icon: 'Home' },
    { id: 'sc5', userId: 'user-123', mainCategoryId: 'mc4', name: 'Movies', color: '#9370DB', icon: 'Ticket'}
  ],
  wallets: [
    { id: 'w1', userId: 'user-123', name: 'Main Bank', currency: 'USD', initialAmount: 500000, type: 'Bank Account', icon: 'Landmark' },
    { id: 'w2', userId: 'user-123', name: 'Cash', currency: 'USD', initialAmount: 30000, type: 'Cash', icon: 'Wallet' },
    { id: 'w3', userId: 'user-123', name: 'Savings PLN', currency: 'PLN', initialAmount: 588968, type: 'Bank Account', icon: 'PiggyBank' },
    { id: 'w4', userId: 'user-123', name: 'Euro Cash', currency: 'EUR', initialAmount: 70000, type: 'Cash', icon: 'Euro' },
  ],
  transactions: [
    { id: 't1', userId: 'user-123', subCategoryId: 'sc1', walletId: 'w1', type: 'Expense', frequency: 'One-time', amount: 5575, createdAt: new Date('2023-10-01'), description: 'Weekly groceries' },
    { id: 't2', userId: 'user-123', subCategoryId: 'sc3', walletId: 'w2', type: 'Expense', frequency: 'One-time', amount: 4000, createdAt: new Date('2023-10-03'), description: 'Fuel' },
    { id: 't3', userId: 'user-123', walletId: 'w1', type: 'Income', frequency: 'Monthly', amount: 300000, createdAt: new Date('2023-10-05'), description: 'Salary' },
    { id: 't4', userId: 'user-123', subCategoryId: 'sc1', walletId: 'w1', type: 'Expense', frequency: 'Weekly', amount: 2250, createdAt: new Date(new Date().setDate(new Date().getDate() - 10)), description: 'Weekly Snack Box' },
    { id: 't5', userId: 'user-123', subCategoryId: 'sc3', walletId: 'w2', type: 'Expense', frequency: 'Daily', amount: 500, createdAt: new Date(new Date().setDate(new Date().getDate() - 5)), description: 'Daily Coffee' },
  ],
  transfers: [
    { id: 'tr1', userId: 'user-123', fromWalletId: 'w1', toWalletId: 'w2', amount: 10000, createdAt: new Date('2023-10-02'), description: 'ATM Withdrawal' }
  ],
  budgets: [
    { id: 'b1', userId: 'user-123', subCategoryId: 'sc1', plannedAmount: 20000, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date() },
    { id: 'b2', userId: 'user-123', subCategoryId: 'sc3', plannedAmount: 10000, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date() },
  ],
  sharedCapitalSessions: [],
  feedbacks: [],
};

// In-memory store for mock data
export let MOCK_DB: MockDb = JSON.parse(JSON.stringify(initialMockDbState));

// Function to reset MOCK_DB to its initial state by mutating its properties.
// This is "dangerous" because it directly mutates the global MOCK_DB object.
export function _dangerouslyResetMockDbContent(newState?: MockDb): void {
  const stateToResetTo = newState || initialMockDbState;
  // Clear existing arrays/objects and repopulate to avoid reassigning MOCK_DB itself
  (Object.keys(MOCK_DB) as Array<keyof MockDb>).forEach(key => {
    if (Array.isArray(MOCK_DB[key])) {
      (MOCK_DB[key] as any[]) = [];
    } else if (typeof MOCK_DB[key] === 'object' && MOCK_DB[key] !== null) {
      // For non-array objects, if any top-level (not needed for current MOCK_DB structure)
      // You might need a more sophisticated clear if structure is complex
    }
  });

  // Deep copy new state into MOCK_DB properties
  const deepCopiedState = JSON.parse(JSON.stringify(stateToResetTo));
  (Object.keys(deepCopiedState) as Array<keyof MockDb>).forEach(key => {
    MOCK_DB[key] = deepCopiedState[key] as any;
  });

   // Optionally, remove keys from MOCK_DB that are not in deepCopiedState
   (Object.keys(MOCK_DB) as Array<keyof MockDb>).forEach(key => {
    if (!(key in deepCopiedState)) {
      delete MOCK_DB[key];
    }
  });
}

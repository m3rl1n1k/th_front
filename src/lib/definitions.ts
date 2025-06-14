
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
  login?: string;
  settings?: UserSettings;
}

export type TransactionType = 'Income' | 'Expense';
export type TransactionTypeOption = { key: number; label: TransactionType };

export type TransactionFrequency = 'One-time' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface Transaction {
  id: string;
  userId: string;
  subCategoryId?: string;
  walletId: string;
  type: TransactionType;
  frequency: TransactionFrequency;
  amount: number; // Stored as cents/smallest unit
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
  initialAmount: number; // Stored as cents/smallest unit
  type: WalletType;
  icon?: string;
}

export interface Transfer {
  id: string;
  userId: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number; // Stored as cents/smallest unit
  createdAt: Date;
  description?: string;
}

export interface Budget {
  id: string;
  userId: string;
  subCategoryId: string;
  plannedAmount: number; // Stored as cents/smallest unit
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

const today = new Date();
const yesterday = new Date(new Date().setDate(today.getDate() - 1));
const fiveDaysAgo = new Date(new Date().setDate(today.getDate() - 5));
const tenDaysAgo = new Date(new Date().setDate(today.getDate() - 10));
const lastMonth = new Date(new Date().setMonth(today.getMonth() - 1));
const twoMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 2));


const initialMockDbState: MockDb = {
  users: [{
    id: 'user-123',
    email: 'user@example.com',
    name: 'Demo User',
    login: 'demouser',
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
    { id: 'mc1', userId: 'user-123', name: 'Food & Dining', color: '#FF6347', icon: 'Utensils',
      subCategories: [
        { id: 'sc1', userId: 'user-123', mainCategoryId: 'mc1', name: 'Groceries', color: '#FFA07A', icon: 'ShoppingCart' },
        { id: 'sc2', userId: 'user-123', mainCategoryId: 'mc1', name: 'Restaurants', color: '#FA8072', icon: 'Utensils' },
        { id: 'sc1_3', userId: 'user-123', mainCategoryId: 'mc1', name: 'Coffee Shops', color: '#E9967A', icon: 'Coffee' },
      ]
    },
    { id: 'mc2', userId: 'user-123', name: 'Transportation', color: '#4682B4', icon: 'Car',
      subCategories: [
        { id: 'sc3', userId: 'user-123', mainCategoryId: 'mc2', name: 'Fuel/Gas', color: '#B0C4DE', icon: 'Fuel' },
        { id: 'sc2_2', userId: 'user-123', mainCategoryId: 'mc2', name: 'Public Transit', color: '#ADD8E6', icon: 'Bus' },
        { id: 'sc2_3', userId: 'user-123', mainCategoryId: 'mc2', name: 'Ride Sharing', color: '#87CEEB', icon: 'Car' },
      ]
    },
    { id: 'mc3', userId: 'user-123', name: 'Housing', color: '#2E8B57', icon: 'Home',
      subCategories: [
         { id: 'sc4', userId: 'user-123', mainCategoryId: 'mc3', name: 'Rent/Mortgage', color: '#90EE90', icon: 'Home' },
         { id: 'sc3_2', userId: 'user-123', mainCategoryId: 'mc3', name: 'Home Maintenance', color: '#98FB98', icon: 'Wrench' },
      ]
    },
    { id: 'mc4', userId: 'user-123', name: 'Entertainment', color: '#8A2BE2', icon: 'Film',
      subCategories: [
        { id: 'sc5', userId: 'user-123', mainCategoryId: 'mc4', name: 'Movies & Shows', color: '#9370DB', icon: 'Ticket'},
        { id: 'sc4_2', userId: 'user-123', mainCategoryId: 'mc4', name: 'Concerts & Events', color: '#BA55D3', icon: 'Music' },
        { id: 'sc4_3', userId: 'user-123', mainCategoryId: 'mc4', name: 'Hobbies', color: '#DA70D6', icon: 'Palette' },
      ]
    },
    { id: 'mc5', userId: 'user-123', name: 'Utilities', color: '#FFD700', icon: 'Lightbulb',
      subCategories: [
        { id: 'sc5_1', userId: 'user-123', mainCategoryId: 'mc5', name: 'Electricity', color: '#FFFACD', icon: 'Lightbulb' },
        { id: 'sc5_2', userId: 'user-123', mainCategoryId: 'mc5', name: 'Internet & Cable', color: '#FAFAD2', icon: 'Wifi' },
        { id: 'sc5_3', userId: 'user-123', mainCategoryId: 'mc5', name: 'Water', color: '#F0E68C', icon: 'Waves' },
      ]
    },
     { id: 'mc6', userId: 'user-123', name: 'Healthcare', color: '#DC143C', icon: 'Heart',
      subCategories: [
        { id: 'sc6_1', userId: 'user-123', mainCategoryId: 'mc6', name: 'Doctor Visits', color: '#FFB6C1', icon: 'Heart' },
        { id: 'sc6_2', userId: 'user-123', mainCategoryId: 'mc6', name: 'Pharmacy', color: '#FFA07A', icon: 'Pill' },
      ]
    },
    { id: 'mc7', userId: 'user-123', name: 'Personal Care', color: '#00CED1', icon: 'ShoppingBag',
      subCategories: [
        { id: 'sc7_1', userId: 'user-123', mainCategoryId: 'mc7', name: 'Haircuts', color: '#AFEEEE', icon: 'Scissors' },
        { id: 'sc7_2', userId: 'user-123', mainCategoryId: 'mc7', name: 'Toiletries', color: '#40E0D0', icon: 'ShoppingBag' },
      ]
    },
    { id: 'mc8', userId: 'user-123', name: 'Income Categories', color: '#32CD32', icon: 'Briefcase',
      subCategories: [
        { id: 'sc8_1', userId: 'user-123', mainCategoryId: 'mc8', name: 'Salary', color: '#98FB98', icon: 'DollarSign' },
        { id: 'sc8_2', userId: 'user-123', mainCategoryId: 'mc8', name: 'Freelance Income', color: '#90EE90', icon: 'Briefcase' },
      ]
    }
  ],
  subCategories: [
    { id: 'sc1', userId: 'user-123', mainCategoryId: 'mc1', name: 'Groceries', color: '#FFA07A', icon: 'ShoppingCart' },
    { id: 'sc2', userId: 'user-123', mainCategoryId: 'mc1', name: 'Restaurants', color: '#FA8072', icon: 'Utensils' },
    { id: 'sc1_3', userId: 'user-123', mainCategoryId: 'mc1', name: 'Coffee Shops', color: '#E9967A', icon: 'Coffee' },
    { id: 'sc3', userId: 'user-123', mainCategoryId: 'mc2', name: 'Fuel/Gas', color: '#B0C4DE', icon: 'Fuel' },
    { id: 'sc2_2', userId: 'user-123', mainCategoryId: 'mc2', name: 'Public Transit', color: '#ADD8E6', icon: 'Bus' },
    { id: 'sc2_3', userId: 'user-123', mainCategoryId: 'mc2', name: 'Ride Sharing', color: '#87CEEB', icon: 'Car' },
    { id: 'sc4', userId: 'user-123', mainCategoryId: 'mc3', name: 'Rent/Mortgage', color: '#90EE90', icon: 'Home' },
    { id: 'sc3_2', userId: 'user-123', mainCategoryId: 'mc3', name: 'Home Maintenance', color: '#98FB98', icon: 'Wrench' },
    { id: 'sc5', userId: 'user-123', mainCategoryId: 'mc4', name: 'Movies & Shows', color: '#9370DB', icon: 'Ticket'},
    { id: 'sc4_2', userId: 'user-123', mainCategoryId: 'mc4', name: 'Concerts & Events', color: '#BA55D3', icon: 'Music' },
    { id: 'sc4_3', userId: 'user-123', mainCategoryId: 'mc4', name: 'Hobbies', color: '#DA70D6', icon: 'Palette' },
    { id: 'sc5_1', userId: 'user-123', mainCategoryId: 'mc5', name: 'Electricity', color: '#FFFACD', icon: 'Lightbulb' },
    { id: 'sc5_2', userId: 'user-123', mainCategoryId: 'mc5', name: 'Internet & Cable', color: '#FAFAD2', icon: 'Wifi' },
    { id: 'sc5_3', userId: 'user-123', mainCategoryId: 'mc5', name: 'Water', color: '#F0E68C', icon: 'Waves' },
    { id: 'sc6_1', userId: 'user-123', mainCategoryId: 'mc6', name: 'Doctor Visits', color: '#FFB6C1', icon: 'Heart' },
    { id: 'sc6_2', userId: 'user-123', mainCategoryId: 'mc6', name: 'Pharmacy', color: '#FFA07A', icon: 'Pill' },
    { id: 'sc7_1', userId: 'user-123', mainCategoryId: 'mc7', name: 'Haircuts', color: '#AFEEEE', icon: 'Scissors' },
    { id: 'sc7_2', userId: 'user-123', mainCategoryId: 'mc7', name: 'Toiletries', color: '#40E0D0', icon: 'ShoppingBag' },
    { id: 'sc8_1', userId: 'user-123', mainCategoryId: 'mc8', name: 'Salary', color: '#98FB98', icon: 'DollarSign' },
    { id: 'sc8_2', userId: 'user-123', mainCategoryId: 'mc8', name: 'Freelance Income', color: '#90EE90', icon: 'Briefcase' },
  ],
  wallets: [
    { id: 'w1', userId: 'user-123', name: 'Main Bank (USD)', currency: 'USD', initialAmount: 500000, type: 'Bank Account', icon: 'Landmark' },
    { id: 'w2', userId: 'user-123', name: 'Cash (USD)', currency: 'USD', initialAmount: 30000, type: 'Cash', icon: 'Wallet' },
    { id: 'w3', userId: 'user-123', name: 'Euro Account', currency: 'EUR', initialAmount: 250000, type: 'Bank Account', icon: 'Euro' },
    { id: 'w4', userId: 'user-123', name: 'Visa Gold Card', currency: 'USD', initialAmount: 0, type: 'Credit Card', icon: 'CreditCard' },
    { id: 'w5', userId: 'user-123', name: 'PayPal (EUR)', currency: 'EUR', initialAmount: 15000, type: 'E-Wallet', icon: 'BadgeDollarSign' },
  ],
  transactions: [
    // Income
    { id: 't_inc1', userId: 'user-123', subCategoryId: 'sc8_1', walletId: 'w1', type: 'Income', frequency: 'Monthly', amount: 350000, createdAt: new Date(new Date(today).setDate(1)), description: 'Monthly Salary' },
    { id: 't_inc2', userId: 'user-123', subCategoryId: 'sc8_2', walletId: 'w5', type: 'Income', frequency: 'One-time', amount: 50000, createdAt: tenDaysAgo, description: 'Freelance Project X' },
    // Expenses - Food & Dining
    { id: 't1', userId: 'user-123', subCategoryId: 'sc1', walletId: 'w1', type: 'Expense', frequency: 'One-time', amount: 5575, createdAt: today, description: 'Weekly groceries' },
    { id: 't_exp_food1', userId: 'user-123', subCategoryId: 'sc2', walletId: 'w4', type: 'Expense', frequency: 'One-time', amount: 3500, createdAt: yesterday, description: 'Dinner with friends' },
    { id: 't_exp_food2', userId: 'user-123', subCategoryId: 'sc1_3', walletId: 'w2', type: 'Expense', frequency: 'Daily', amount: 450, createdAt: today, description: 'Morning Coffee' },
    // Expenses - Transportation
    { id: 't2', userId: 'user-123', subCategoryId: 'sc3', walletId: 'w2', type: 'Expense', frequency: 'One-time', amount: 4000, createdAt: fiveDaysAgo, description: 'Fuel for car' },
    { id: 't_exp_trans1', userId: 'user-123', subCategoryId: 'sc2_2', walletId: 'w2', type: 'Expense', frequency: 'Weekly', amount: 1500, createdAt: tenDaysAgo, description: 'Metro Pass' },
    // Expenses - Housing
    { id: 't_exp_house1', userId: 'user-123', subCategoryId: 'sc4', walletId: 'w1', type: 'Expense', frequency: 'Monthly', amount: 120000, createdAt: new Date(new Date(today).setDate(1)), description: 'Rent Payment' },
    // Expenses - Utilities
    { id: 't_exp_util1', userId: 'user-123', subCategoryId: 'sc5_1', walletId: 'w1', type: 'Expense', frequency: 'Monthly', amount: 7500, createdAt: new Date(new Date(today).setDate(15)), description: 'Electricity Bill' },
    { id: 't_exp_util2', userId: 'user-123', subCategoryId: 'sc5_2', walletId: 'w1', type: 'Expense', frequency: 'Monthly', amount: 5000, createdAt: new Date(new Date(today).setDate(5)), description: 'Internet Bill' },
    // Expenses - Entertainment
    { id: 't_exp_ent1', userId: 'user-123', subCategoryId: 'sc5', walletId: 'w4', type: 'Expense', frequency: 'One-time', amount: 1200, createdAt: lastMonth, description: 'Cinema Tickets' },
    // Uncategorized Expense
    { id: 't_exp_uncat1', userId: 'user-123', walletId: 'w2', type: 'Expense', frequency: 'One-time', amount: 2000, createdAt: yesterday, description: 'Miscellaneous Purchase' },
    // Recurring test for average spending
    { id: 't_recur_daily', userId: 'user-123', subCategoryId: 'sc1_3', walletId: 'w2', type: 'Expense', frequency: 'Daily', amount: 300, createdAt: twoMonthsAgo, description: 'Daily Newspaper' },
    { id: 't_recur_weekly', userId: 'user-123', subCategoryId: 'sc1', walletId: 'w1', type: 'Expense', frequency: 'Weekly', amount: 1000, createdAt: new Date(new Date(twoMonthsAgo).setDate(twoMonthsAgo.getDate()+3)), description: 'Weekend Treat' },

  ],
  transfers: [
    { id: 'tr1', userId: 'user-123', fromWalletId: 'w1', toWalletId: 'w2', amount: 10000, createdAt: fiveDaysAgo, description: 'ATM Withdrawal' },
    { id: 'tr2', userId: 'user-123', fromWalletId: 'w3', toWalletId: 'w5', amount: 5000, createdAt: yesterday, description: 'Move to PayPal' }
  ],
  budgets: [
    // Over budget
    { id: 'b1', userId: 'user-123', subCategoryId: 'sc1', plannedAmount: 20000, month: today.getMonth() + 1, year: today.getFullYear(), createdAt: today }, // Groceries - current spending is 5575 + 1000 (weekly) = 6575
    // Under budget
    { id: 'b2', userId: 'user-123', subCategoryId: 'sc3', plannedAmount: 10000, month: today.getMonth() + 1, year: today.getFullYear(), createdAt: today }, // Fuel - current spending is 4000
    // For a different month
    { id: 'b3', userId: 'user-123', subCategoryId: 'sc2', plannedAmount: 15000, month: lastMonth.getMonth() + 1, year: lastMonth.getFullYear(), createdAt: lastMonth }, // Restaurants last month
    { id: 'b4', userId: 'user-123', subCategoryId: 'sc5_1', plannedAmount: 6000, month: today.getMonth() + 1, year: today.getFullYear(), createdAt: today }, // Electricity - current spending 7500 (over)
  ],
  sharedCapitalSessions: [
    {id: 'shs1', userId: 'user-123', partnerEmail: 'partner1@example.com', isActive: true, createdAt: tenDaysAgo, updatedAt: tenDaysAgo },
    {id: 'shs2', userId: 'user-123', partnerEmail: 'partner2@example.com', isActive: false, createdAt: new Date(new Date().setDate(today.getDate() - 30)), updatedAt: new Date(new Date().setDate(today.getDate() - 20))},
  ],
  feedbacks: [
    {id: 'fb1', userId: 'user-123', feedbackType: 'Suggestion', subject: 'Dark Mode Idea', message: 'A dark mode theme would be amazing for nighttime use!', userEmail: 'user@example.com', status: 'pending', createdAt: fiveDaysAgo},
    {id: 'fb2', userId: 'user-123', feedbackType: 'Error Report', subject: 'Calculation error on dashboard', message: 'The total balance seems off by $10.', userEmail: 'user@example.com', status: 'active', createdAt: yesterday},
    {id: 'fb3', userId: 'user-123', feedbackType: 'Technical Issue', subject: 'Login button not working on Firefox', message: 'I tried to login using Firefox version X, and the button was unresponsive.', status: 'closed', createdAt: tenDaysAgo},
    {id: 'fb4', userId: 'user-123', feedbackType: 'General Feedback', subject: 'Love the app!', message: 'Just wanted to say this app is great and very helpful for managing my finances.', userEmail: 'user@example.com', status: 'pending', createdAt: today},
  ],
};

// In-memory store for mock data
export let MOCK_DB: MockDb = JSON.parse(JSON.stringify(initialMockDbState));

// Function to reset MOCK_DB to its initial state by mutating its properties.
// This is "dangerous" because it directly mutates the global MOCK_DB object.
export function _dangerouslyResetMockDbContent(newState?: MockDb): void {
  const stateToResetTo = JSON.parse(JSON.stringify(newState || initialMockDbState)); // Deep copy the state to reset to

  // Clear existing arrays in MOCK_DB
  (Object.keys(MOCK_DB) as Array<keyof MockDb>).forEach(key => {
    if (Array.isArray(MOCK_DB[key])) {
      (MOCK_DB[key] as any[]).length = 0; // Clear array
    } else if (typeof MOCK_DB[key] === 'object' && MOCK_DB[key] !== null) {
      // For non-array objects, if any top-level (not needed for current MOCK_DB structure)
      // You might need a more sophisticated clear if structure is complex
    }
  });

  // Repopulate MOCK_DB with the new state's data
  (Object.keys(stateToResetTo) as Array<keyof MockDb>).forEach(key => {
    if (Array.isArray(stateToResetTo[key])) {
      (MOCK_DB[key] as any[]) = [...(stateToResetTo[key] as any[])]; // Spread to copy array contents
    } else {
      MOCK_DB[key] = stateToResetTo[key] as any; // Assign other types directly
    }
  });

   // Optionally, remove keys from MOCK_DB that are not in stateToResetTo
   (Object.keys(MOCK_DB) as Array<keyof MockDb>).forEach(key => {
    if (!(key in stateToResetTo)) {
      delete MOCK_DB[key];
    }
  });
}

    

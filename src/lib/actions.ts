
'use server';
import type { MainCategory, SubCategory, Transaction, Wallet, Transfer, MockDb, User, UserSettings, Budget, SharedCapitalSession, TransactionFrequency, FeedbackItem, FeedbackStatus, FeedbackType } from './definitions';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, getAuthToken } from './auth'; // Import getCurrentUser and getAuthToken
import { cookies as nextCookies } from 'next/headers'; // Renamed to avoid conflict if 'cookies' is used as a variable

// TODO: USER: Replace with your actual API base URL, ideally from an environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'; // Example

// In-memory store for mock data (to be replaced by API calls)
let MOCK_DB: MockDb = { // MOCK_DB is no longer exported
  users: [{
    id: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
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
    { id: 'mc1', userId: 'user-123', name: 'Food', color: '#FF6347' },
    { id: 'mc2', userId: 'user-123', name: 'Transport', color: '#4682B4' },
    { id: 'mc3', userId: 'user-123', name: 'Housing', color: '#2E8B57' },
    { id: 'mc4', userId: 'user-123', name: 'Entertainment', color: '#8A2BE2'}
  ],
  subCategories: [
    { id: 'sc1', userId: 'user-123', mainCategoryId: 'mc1', name: 'Groceries', color: '#FFA07A' },
    { id: 'sc2', userId: 'user-123', mainCategoryId: 'mc1', name: 'Restaurants', color: '#FA8072' },
    { id: 'sc3', userId: 'user-123', mainCategoryId: 'mc2', name: 'Gas', color: '#B0C4DE' },
    { id: 'sc4', userId: 'user-123', mainCategoryId: 'mc3', name: 'Rent', color: '#90EE90' },
    { id: 'sc5', userId: 'user-123', mainCategoryId: 'mc4', name: 'Movies', color: '#9370DB'}
  ],
  wallets: [
    { id: 'w1', userId: 'user-123', name: 'Main Bank', currency: 'USD', initialAmount: 5000, type: 'Bank Account' },
    { id: 'w2', userId: 'user-123', name: 'Cash', currency: 'USD', initialAmount: 300, type: 'Cash' },
    { id: 'w3', userId: 'user-123', name: 'Savings PLN', currency: 'PLN', initialAmount: 5889.68, type: 'Bank Account' },
    { id: 'w4', userId: 'user-123', name: 'Euro Cash', currency: 'EUR', initialAmount: 700, type: 'Cash' },
  ],
  transactions: [
    { id: 't1', userId: 'user-123', subCategoryId: 'sc1', walletId: 'w1', type: 'Expense', frequency: 'One-time', amount: 55.75, createdAt: new Date('2023-10-01'), description: 'Weekly groceries' },
    { id: 't2', userId: 'user-123', subCategoryId: 'sc3', walletId: 'w2', type: 'Expense', frequency: 'One-time', amount: 40.00, createdAt: new Date('2023-10-03'), description: 'Fuel' },
    { id: 't3', userId: 'user-123', walletId: 'w1', type: 'Income', frequency: 'Monthly', amount: 3000.00, createdAt: new Date('2023-10-05'), description: 'Salary' }, // Uncategorized income
    { id: 't4', userId: 'user-123', subCategoryId: 'sc1', walletId: 'w1', type: 'Expense', frequency: 'Weekly', amount: 22.50, createdAt: new Date(new Date().setDate(new Date().getDate() - 10)), description: 'Weekly Snack Box' },
    { id: 't5', userId: 'user-123', subCategoryId: 'sc3', walletId: 'w2', type: 'Expense', frequency: 'Daily', amount: 5.00, createdAt: new Date(new Date().setDate(new Date().getDate() - 5)), description: 'Daily Coffee' },

  ],
  transfers: [
    { id: 'tr1', userId: 'user-123', fromWalletId: 'w1', toWalletId: 'w2', amount: 100, createdAt: new Date('2023-10-02'), description: 'ATM Withdrawal' }
  ],
  budgets: [
    { id: 'b1', userId: 'user-123', subCategoryId: 'sc1', plannedAmount: 200, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date() }, // Budget for Groceries
    { id: 'b2', userId: 'user-123', subCategoryId: 'sc3', plannedAmount: 100, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date() }, // Budget for Gas
  ],
  sharedCapitalSessions: [],
  feedbacks: [], // Initialize feedbacks array
};

// --- Helper for API calls ---
async function fetchAPI(endpoint: string, options: RequestInit = {}): Promise<{ data: any | null, error: { message: string, status?: number } | null }> {
  try {
    const token = await getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(`API Error (${response.status}) on ${endpoint}: ${errorBody}`); // Changed to console.warn
      return { data: null, error: { message: `API request failed: ${response.statusText} - ${errorBody}`, status: response.status } };
    }

    if (response.status === 204) { // No Content
      return { data: null, error: null };
    }
    const responseData = await response.json();
    return { data: responseData, error: null };

  } catch (networkError: any) {
    console.warn(`Network/Fetch Error for ${endpoint}:`, networkError.message); // Changed to console.warn
    return { data: null, error: { message: networkError.message || 'Network request failed' } };
  }
}


// --- User Settings Actions ---
export async function getUserSettings(): Promise<UserSettings | undefined> {
  try {
    const user = await getCurrentUser();
    return user?.settings;
  } catch (error) {
    console.warn('Failed to fetch user settings (mock):', error); // Changed to console.warn
    const MOCK_USER_ID = 'user-123';
    const user = MOCK_DB.users.find(u => u.id === MOCK_USER_ID);
    return user?.settings;
  }
}

export async function updateUserSettings(newSettings: Partial<UserSettings>): Promise<User | null> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");

    const userIndex = MOCK_DB.users.findIndex(u => u.id === MOCK_USER_ID);
    if (userIndex === -1) throw new Error("User not found");

    // Ensure existing settings are preserved
    const currentUserSettings = MOCK_DB.users[userIndex].settings || {};
    MOCK_DB.users[userIndex].settings = { ...currentUserSettings, ...newSettings };

    revalidatePath('/settings');
    revalidatePath('/profile');
    revalidatePath('/transactions');
    revalidatePath('/dashboard'); // Dashboard depends on these settings
    return MOCK_DB.users[userIndex];
  } catch (error) {
    console.error('Failed to update user settings:', error);
    throw error;
  }
}

// --- User Profile Actions ---
export async function updateUserProfile(userId: string, data: { name?: string }): Promise<User | null> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID || MOCK_USER_ID !== userId) throw new Error("Unauthorized or user mismatch");

    const userIndex = MOCK_DB.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");

    if (data.name) {
      MOCK_DB.users[userIndex].name = data.name;
    }

    revalidatePath('/profile');
    revalidatePath('/(app)/layout', 'layout');
    return MOCK_DB.users[userIndex];
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{success: boolean, message: string}> {
  console.log(`Attempting to change password for user ${userId}. Current: ${currentPassword}, New: ${newPassword}`);
  const MOCK_USER_ID = (await getCurrentUser())?.id;
  if (!MOCK_USER_ID || MOCK_USER_ID !== userId) {
    return { success: false, message: "Unauthorized or user mismatch." };
  }
  if (currentPassword === "password123_wrong") {
     return { success: false, message: "Incorrect current password." };
  }
  console.log(`Mock password change successful for user ${userId}.`);
  return { success: true, message: "Password changed successfully." };
}


// --- Main Category Actions ---
export async function getMainCategories(): Promise<MainCategory[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  const mockData = MOCK_DB.mainCategories.filter(mc => mc.userId === MOCK_USER_ID);

  const result = await fetchAPI('/main-categories');
  if (result.error || !result.data) {
    console.warn(`getMainCategories: API call failed (Error: ${result.error?.message}). Falling back to mock data.`);
    return mockData;
  }
  try {
    return result.data as MainCategory[];
  } catch (processingError: any) {
    console.error(`getMainCategories: Error processing data from API (Error: ${processingError.message}). Falling back to mock data.`);
    return mockData;
  }
}

export async function createMainCategory(data: Omit<MainCategory, 'id' | 'userId'>): Promise<MainCategory> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    const newCategory: MainCategory = { ...data, id: `mc${Date.now()}`, userId: MOCK_USER_ID };
    MOCK_DB.mainCategories.push(newCategory);
    revalidatePath('/categories');
    return newCategory;
  } catch (error) {
    console.error('Failed to create main category:', error);
    throw error;
  }
}

export async function updateMainCategory(id: string, data: Partial<Omit<MainCategory, 'id' | 'userId'>>): Promise<MainCategory | null> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    const index = MOCK_DB.mainCategories.findIndex(c => c.id === id && c.userId === MOCK_USER_ID);
    if (index === -1) return null;
    MOCK_DB.mainCategories[index] = { ...MOCK_DB.mainCategories[index], ...data };
    revalidatePath('/categories');
    return MOCK_DB.mainCategories[index];
  } catch (error) {
    console.error('Failed to update main category:', error);
    throw error;
  }
}

export async function deleteMainCategory(id: string): Promise<void> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    MOCK_DB.mainCategories = MOCK_DB.mainCategories.filter(c => c.id !== id || c.userId !== MOCK_USER_ID);
    MOCK_DB.subCategories = MOCK_DB.subCategories.filter(sc => sc.mainCategoryId !== id || sc.userId !== MOCK_USER_ID);
    revalidatePath('/categories');
    revalidatePath('/budgets'); // Budgets might be affected if they were linked to main categories indirectly
  } catch (error) {
    console.error('Failed to delete main category:', error);
    throw error;
  }
}

// --- Sub Category Actions ---
export async function getSubCategories(mainCategoryId?: string): Promise<SubCategory[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  let mockData = MOCK_DB.subCategories.filter(sc => sc.userId === MOCK_USER_ID);
  if (mainCategoryId) {
    mockData = mockData.filter(sc => sc.mainCategoryId === mainCategoryId);
  }

  let endpoint = '/sub-categories';
  if (mainCategoryId) {
    endpoint += `?mainCategoryId=${mainCategoryId}`;
  }
  const result = await fetchAPI(endpoint);

  if (result.error || !result.data) {
    console.warn(`getSubCategories: API call failed (Error: ${result.error?.message}). Falling back to mock data.`);
    return mockData;
  }
  try {
    return result.data as SubCategory[];
  } catch (processingError: any) {
    console.error(`getSubCategories: Error processing data from API (Error: ${processingError.message}). Falling back to mock data.`);
    return mockData;
  }
}

export async function createSubCategory(data: Omit<SubCategory, 'id' | 'userId'>): Promise<SubCategory> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    const newCategory: SubCategory = { ...data, id: `sc${Date.now()}`, userId: MOCK_USER_ID };
    MOCK_DB.subCategories.push(newCategory);
    revalidatePath('/categories');
    revalidatePath('/budgets'); // Budgets are now linked to sub-categories
    return newCategory;
  } catch (error) {
    console.error('Failed to create sub category:', error);
    throw error;
  }
}

export async function updateSubCategory(id: string, data: Partial<Omit<SubCategory, 'id' | 'userId'>>): Promise<SubCategory | null> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    const index = MOCK_DB.subCategories.findIndex(c => c.id === id && c.userId === MOCK_USER_ID);
    if (index === -1) return null;
    MOCK_DB.subCategories[index] = { ...MOCK_DB.subCategories[index], ...data };
    revalidatePath('/categories');
    revalidatePath('/budgets'); // Budgets are now linked to sub-categories
    return MOCK_DB.subCategories[index];
  } catch (error) {
    console.error('Failed to update sub category:', error);
    throw error;
  }
}

export async function deleteSubCategory(id: string): Promise<void> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    MOCK_DB.subCategories = MOCK_DB.subCategories.filter(c => c.id !== id || c.userId !== MOCK_USER_ID);
    // Also delete budgets associated with this sub-category
    MOCK_DB.budgets = MOCK_DB.budgets.filter(b => b.subCategoryId !== id || b.userId !== MOCK_USER_ID);
    revalidatePath('/categories');
    revalidatePath('/budgets');
  } catch (error) {
    console.error('Failed to delete sub category:', error);
    throw error;
  }
}


// --- Wallet Actions ---
export async function getWallets(): Promise<Wallet[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  const mockData = MOCK_DB.wallets.filter(w => w.userId === MOCK_USER_ID);

  const result = await fetchAPI('/wallets');
  if (result.error || !result.data) {
    console.warn(`getWallets: API call failed (Error: ${result.error?.message}). Falling back to mock data.`);
    return mockData;
  }
  try {
    return result.data as Wallet[];
  } catch (processingError: any) {
    console.error(`getWallets: Error processing data from API (Error: ${processingError.message}). Falling back to mock data.`);
    return mockData;
  }
}

export async function createWallet(data: Omit<Wallet, 'id' | 'userId'>): Promise<Wallet> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    const newWallet: Wallet = { ...data, id: `w${Date.now()}`, userId: MOCK_USER_ID };
    MOCK_DB.wallets.push(newWallet);
    revalidatePath('/wallets');
    revalidatePath('/capital');
    return newWallet;
  } catch (error) {
    console.error('Failed to create wallet:', error);
    throw error;
  }
}

export async function updateWallet(id: string, data: Partial<Omit<Wallet, 'id' | 'userId'>>): Promise<Wallet | null> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    const index = MOCK_DB.wallets.findIndex(w => w.id === id && w.userId === MOCK_USER_ID);
    if (index === -1) return null;
    MOCK_DB.wallets[index] = { ...MOCK_DB.wallets[index], ...data };
    revalidatePath('/wallets');
    revalidatePath('/capital');
    return MOCK_DB.wallets[index];
  } catch (error) {
    console.error('Failed to update wallet:', error);
    throw error;
  }
}

export async function deleteWallet(id: string): Promise<void> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    MOCK_DB.wallets = MOCK_DB.wallets.filter(w => w.id !== id || w.userId !== MOCK_USER_ID);
    revalidatePath('/wallets');
    revalidatePath('/capital');
  } catch (error) {
    console.error('Failed to delete wallet:', error);
    throw error;
  }
}


// --- Transaction Actions ---
export async function getTransactions(): Promise<Transaction[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  const mockTransactions = MOCK_DB.transactions
    .filter(t => t.userId === MOCK_USER_ID)
    .map(t => ({ ...t, createdAt: new Date(t.createdAt) }))
    .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());

  const result = await fetchAPI('/transactions');

  if (result.error || !result.data) {
    console.warn(`getTransactions: API call failed or returned no data (Error: ${result.error?.message}). Falling back to mock data.`);
    return mockTransactions;
  }

  try {
    return (result.data as any[]).map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }))
                         .sort((a: Transaction, b: Transaction) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (processingError: any) {
    console.error(`getTransactions: Error processing data from API (Error: ${processingError.message}). Falling back to mock data.`);
    return mockTransactions;
  }
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'userId'>): Promise<Transaction> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    const newTransaction: Transaction = { ...data, id: `t${Date.now()}`, userId: MOCK_USER_ID, createdAt: new Date(data.createdAt) };
    MOCK_DB.transactions.push(newTransaction);
    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/budgets');
    return newTransaction;
  } catch (error) {
    console.error('Failed to create transaction:', error);
    throw error;
  }
}

export async function updateTransaction(id: string, data: Partial<Omit<Transaction, 'id' | 'userId'>>): Promise<Transaction | null> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    const index = MOCK_DB.transactions.findIndex(t => t.id === id && t.userId === MOCK_USER_ID);
    if (index === -1) return null;
    const updatedData = { ...MOCK_DB.transactions[index], ...data };
    if (data.createdAt) {
      updatedData.createdAt = new Date(data.createdAt);
    }
    MOCK_DB.transactions[index] = updatedData;
    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/budgets');
    return MOCK_DB.transactions[index];
  } catch (error) {
    console.error('Failed to update transaction:', error);
    throw error;
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    MOCK_DB.transactions = MOCK_DB.transactions.filter(t => t.id !== id || t.userId !== MOCK_USER_ID);
    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/budgets');
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    throw error;
  }
}

export async function stopRecurringTransaction(transactionId: string): Promise<Transaction | null> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    const index = MOCK_DB.transactions.findIndex(t => t.id === transactionId && t.userId === MOCK_USER_ID);
    if (index === -1) return null;

    MOCK_DB.transactions[index].frequency = 'One-time';
    revalidatePath('/transactions');
    return MOCK_DB.transactions[index];
  } catch (error) {
    console.error('Failed to stop recurring transaction:', error);
    throw error;
  }
}


// --- Transfer Actions ---
export async function getTransfers(): Promise<Transfer[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  const mockTransfers = MOCK_DB.transfers
    .filter(t => t.userId === MOCK_USER_ID)
    .map(t => ({ ...t, createdAt: new Date(t.createdAt) }))
    .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());

  const result = await fetchAPI('/transfers');
  if (result.error || !result.data) {
    console.warn(`getTransfers: API call failed (Error: ${result.error?.message}). Falling back to mock data.`);
    return mockTransfers;
  }
  try {
    return (result.data as any[]).map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }))
                     .sort((a: Transfer,b: Transfer) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (processingError: any) {
    console.error(`getTransfers: Error processing data from API (Error: ${processingError.message}). Falling back to mock data.`);
    return mockTransfers;
  }
}

export async function createTransfer(data: Omit<Transfer, 'id' | 'userId'>): Promise<Transfer> {
   try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    const newTransfer: Transfer = { ...data, id: `tr${Date.now()}`, userId: MOCK_USER_ID, createdAt: new Date(data.createdAt) };
    MOCK_DB.transfers.push(newTransfer);
    revalidatePath('/transfers');
    return newTransfer;
  } catch (error) {
    console.error('Failed to create transfer:', error);
    throw error;
  }
}

export async function deleteTransfer(id: string): Promise<void> {
  try {
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");
    MOCK_DB.transfers = MOCK_DB.transfers.filter(t => t.id !== id || t.userId !== MOCK_USER_ID);
    revalidatePath('/transfers');
  } catch (error) {
    console.error('Failed to delete transfer:', error);
    throw error;
  }
}

// --- Budget Actions ---
export async function getBudgets(month?: number, year?: number): Promise<Budget[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  let budgets = MOCK_DB.budgets.filter(b => b.userId === MOCK_USER_ID);
  if (month && year) {
    budgets = budgets.filter(b => b.month === month && b.year === year);
  }
  // Sort by year, then month, then subCategoryId
  return budgets.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    return a.subCategoryId.localeCompare(b.subCategoryId);
  });
}

export async function createBudget(data: Omit<Budget, 'id' | 'userId' | 'createdAt'>): Promise<Budget> {
  const MOCK_USER_ID = (await getCurrentUser())?.id;
  if (!MOCK_USER_ID) throw new Error("User not authenticated");
  const newBudget: Budget = { ...data, id: `b${Date.now()}`, userId: MOCK_USER_ID, createdAt: new Date() };
  MOCK_DB.budgets.push(newBudget);
  revalidatePath('/budgets');
  return newBudget;
}

export async function updateBudget(id: string, data: Partial<Omit<Budget, 'id' | 'userId' | 'createdAt'>>): Promise<Budget | null> {
  const MOCK_USER_ID = (await getCurrentUser())?.id;
  if (!MOCK_USER_ID) return null;
  const index = MOCK_DB.budgets.findIndex(b => b.id === id && b.userId === MOCK_USER_ID);
  if (index === -1) return null;
  MOCK_DB.budgets[index] = { ...MOCK_DB.budgets[index], ...data };
  revalidatePath('/budgets');
  return MOCK_DB.budgets[index];
}

export async function deleteBudget(id: string): Promise<void> {
  const MOCK_USER_ID = (await getCurrentUser())?.id;
  if (!MOCK_USER_ID) return;
  MOCK_DB.budgets = MOCK_DB.budgets.filter(b => b.id !== id || b.userId !== MOCK_USER_ID);
  revalidatePath('/budgets');
}

// --- Shared Capital Actions ---
export async function getSharedCapitalSession(): Promise<SharedCapitalSession | null> {
  const MOCK_USER_ID = (await getCurrentUser())?.id;
  if (!MOCK_USER_ID) return null;
  const session = MOCK_DB.sharedCapitalSessions
    .filter(s => s.userId === MOCK_USER_ID && s.isActive)
    .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  return session || null;
}

export async function startSharedCapitalSession(partnerEmail: string): Promise<SharedCapitalSession> {
  const MOCK_USER_ID = (await getCurrentUser())?.id;
  if (!MOCK_USER_ID) throw new Error("User not authenticated");

  MOCK_DB.sharedCapitalSessions.forEach(s => {
    if (s.userId === MOCK_USER_ID) {
      s.isActive = false;
      s.updatedAt = new Date();
    }
  });

  const newSession: SharedCapitalSession = {
    id: `scs-${Date.now()}`,
    userId: MOCK_USER_ID,
    partnerEmail,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  MOCK_DB.sharedCapitalSessions.push(newSession);
  revalidatePath('/capital');
  return newSession;
}

export async function stopSharedCapitalSession(): Promise<SharedCapitalSession | null> {
  const MOCK_USER_ID = (await getCurrentUser())?.id;
  if (!MOCK_USER_ID) return null;

  const activeSession = MOCK_DB.sharedCapitalSessions.find(s => s.userId === MOCK_USER_ID && s.isActive);
  if (activeSession) {
    activeSession.isActive = false;
    activeSession.updatedAt = new Date();
    revalidatePath('/capital');
    return activeSession;
  }
  return null;
}

// --- Feedback Actions ---
export async function getFeedbacks(): Promise<FeedbackItem[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  // Sort by creation date, newest first
  return MOCK_DB.feedbacks
    .filter(f => f.userId === MOCK_USER_ID)
    .sort((a, b) => b.createdAt.getTime() - new Date(a.createdAt).getTime());
}

export async function addFeedback(
  feedbackData: Omit<FeedbackItem, 'id' | 'userId' | 'createdAt' | 'status'>
): Promise<FeedbackItem> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("User not authenticated to submit feedback.");
  }
  const newFeedbackId = `FBK-${Date.now()}`;
  const feedbackToStore: FeedbackItem = {
    id: newFeedbackId,
    userId: currentUser.id,
    feedbackType: feedbackData.feedbackType,
    subject: feedbackData.subject,
    message: feedbackData.message,
    userEmail: feedbackData.userEmail,
    status: 'pending' as FeedbackStatus, // Default status
    createdAt: new Date(),
  };
  MOCK_DB.feedbacks.push(feedbackToStore);
  console.log('Feedback stored via action:', feedbackToStore); // For debugging
  revalidatePath('/view-feedback');
  return feedbackToStore;
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<FeedbackItem | null> {
  const MOCK_USER_ID = (await getCurrentUser())?.id;
  if (!MOCK_USER_ID) throw new Error("User not authenticated");

  const index = MOCK_DB.feedbacks.findIndex(f => f.id === id && f.userId === MOCK_USER_ID);
  if (index === -1) {
    console.error(`Feedback item with id ${id} not found for user ${MOCK_USER_ID}`);
    return null;
  }
  MOCK_DB.feedbacks[index].status = status;
  revalidatePath('/view-feedback'); // Path for the new feedback page
  return MOCK_DB.feedbacks[index];
}

// --- Locale Actions ---
export async function setLocaleCookie(locale: string, currentPath: string) {
  const cookieStore = nextCookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: 'lax',
    // secure: process.env.NODE_ENV === 'production', // Uncomment in production if using HTTPS
  });
  revalidatePath(currentPath); // Revalidate the current path
  revalidatePath('/', 'layout'); // Revalidate the root layout
}


// Helper to reset DB for testing if needed - not for production
export async function resetMockDb(initialDbState: MockDb): Promise<void> {
  MOCK_DB = JSON.parse(JSON.stringify(initialDbState));
}

    

    
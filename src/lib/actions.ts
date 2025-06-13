
'use server';
import type { MainCategory, SubCategory, Transaction, Wallet, Transfer, MockDb, User, UserSettings, Budget, SharedCapitalSession } from './definitions';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, getAuthToken } from './auth'; // Import getCurrentUser and getAuthToken

// TODO: USER: Replace with your actual API base URL, ideally from an environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'; // Example

// In-memory store for mock data (to be replaced by API calls)
let MOCK_DB: MockDb = {
  users: [{ id: 'user-123', email: 'user@example.com', name: 'Test User', settings: { transactionsPerPage: 10 } }],
  mainCategories: [
    { id: 'mc1', userId: 'user-123', name: 'Food', color: '#FF6347' },
    { id: 'mc2', userId: 'user-123', name: 'Transport', color: '#4682B4' },
    { id: 'mc3', userId: 'user-123', name: 'Housing', color: '#2E8B57' },
  ],
  subCategories: [
    { id: 'sc1', userId: 'user-123', mainCategoryId: 'mc1', name: 'Groceries', color: '#FFA07A' },
    { id: 'sc2', userId: 'user-123', mainCategoryId: 'mc1', name: 'Restaurants', color: '#FA8072' },
    { id: 'sc3', userId: 'user-123', mainCategoryId: 'mc2', name: 'Gas', color: '#B0C4DE' },
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
    { id: 't3', userId: 'user-123', subCategoryId: 'sc2', walletId: 'w1', type: 'Income', frequency: 'Monthly', amount: 3000.00, createdAt: new Date('2023-10-05'), description: 'Salary' },
  ],
  transfers: [
    { id: 'tr1', userId: 'user-123', fromWalletId: 'w1', toWalletId: 'w2', amount: 100, createdAt: new Date('2023-10-02'), description: 'ATM Withdrawal' }
  ],
  budgets: [
    { id: 'b1', userId: 'user-123', mainCategoryId: 'mc1', plannedAmount: 500, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date() },
    { id: 'b2', userId: 'user-123', mainCategoryId: 'mc2', plannedAmount: 150, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date() },
  ],
  sharedCapitalSessions: [],
};

// --- Helper for API calls ---
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const currentUser = await getCurrentUser(); // Or however you manage user session/ID
  const token = await getAuthToken(); // Get the auth token

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error (${response.status}) on ${endpoint}: ${errorBody}`);
    throw new Error(`API request failed: ${response.statusText} - ${errorBody}`);
  }

  if (response.status === 204) { // No Content
    return null;
  }
  return response.json();
}


// --- User Settings Actions ---
export async function getUserSettings(): Promise<UserSettings | undefined> {
  try {
    const user = await getCurrentUser(); 
    return user?.settings;
  } catch (error) {
    console.error('Failed to fetch user settings:', error);
    const MOCK_USER_ID = 'user-123';
    const user = MOCK_DB.users.find(u => u.id === MOCK_USER_ID);
    return user?.settings;
  }
}

export async function updateUserSettings(newSettings: Partial<UserSettings>): Promise<User | null> {
  try {
    const updatedUser = await fetchAPI('/users/settings', { 
      method: 'PATCH', 
      body: JSON.stringify(newSettings),
    });
    revalidatePath('/settings');
    revalidatePath('/transactions');
    return updatedUser;
  } catch (error) {
    console.error('Failed to update user settings:', error);
    throw error; 
  }
}

// --- User Profile Actions ---
export async function updateUserProfile(userId: string, data: { name?: string }): Promise<User | null> {
  try {
    const updatedUser = await fetchAPI(`/users/${userId}/profile`, { 
      method: 'PATCH', 
      body: JSON.stringify(data),
    });
    revalidatePath('/profile');
    revalidatePath('/(app)/layout', 'layout');
    return updatedUser;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
}


// --- Main Category Actions ---
export async function getMainCategories(): Promise<MainCategory[]> {
  try {
    return await fetchAPI('/main-categories'); 
  } catch (error) {
    console.error('Failed to fetch main categories:', error);
    return MOCK_DB.mainCategories.filter(mc => mc.userId === 'user-123'); 
  }
}

export async function createMainCategory(data: Omit<MainCategory, 'id' | 'userId'>): Promise<MainCategory> {
  try {
    const newCategory = await fetchAPI('/main-categories', { 
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/categories');
    return newCategory;
  } catch (error) {
    console.error('Failed to create main category:', error);
    throw error;
  }
}

export async function updateMainCategory(id: string, data: Partial<Omit<MainCategory, 'id' | 'userId'>>): Promise<MainCategory | null> {
  try {
    const updatedCategory = await fetchAPI(`/main-categories/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(data),
    });
    revalidatePath('/categories');
    return updatedCategory;
  } catch (error) {
    console.error('Failed to update main category:', error);
    throw error;
  }
}

export async function deleteMainCategory(id: string): Promise<void> {
  try {
    await fetchAPI(`/main-categories/${id}`, { method: 'DELETE' }); 
    revalidatePath('/categories');
  } catch (error) {
    console.error('Failed to delete main category:', error);
    throw error;
  }
}

// --- Sub Category Actions ---
export async function getSubCategories(mainCategoryId?: string): Promise<SubCategory[]> {
  try {
    let endpoint = '/sub-categories';
    if (mainCategoryId) {
      endpoint += `?mainCategoryId=${mainCategoryId}`; 
    }
    return await fetchAPI(endpoint); 
  } catch (error) {
    console.error('Failed to fetch sub categories:', error);
    return MOCK_DB.subCategories.filter(sc => sc.userId === 'user-123'); 
  }
}

export async function createSubCategory(data: Omit<SubCategory, 'id' | 'userId'>): Promise<SubCategory> {
  try {
    const newCategory = await fetchAPI('/sub-categories', { 
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/categories');
    return newCategory;
  } catch (error) {
    console.error('Failed to create sub category:', error);
    throw error;
  }
}

export async function updateSubCategory(id: string, data: Partial<Omit<SubCategory, 'id' | 'userId'>>): Promise<SubCategory | null> {
  try {
    const updatedCategory = await fetchAPI(`/sub-categories/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(data),
    });
    revalidatePath('/categories');
    return updatedCategory;
  } catch (error) {
    console.error('Failed to update sub category:', error);
    throw error;
  }
}

export async function deleteSubCategory(id: string): Promise<void> {
  try {
    await fetchAPI(`/sub-categories/${id}`, { method: 'DELETE' }); 
    revalidatePath('/categories');
  } catch (error) {
    console.error('Failed to delete sub category:', error);
    throw error;
  }
}


// --- Wallet Actions ---
export async function getWallets(): Promise<Wallet[]> {
  try {
    const wallets = await fetchAPI('/wallets'); 
    return wallets;
  } catch (error) {
    console.error('Failed to fetch wallets:', error);
    return MOCK_DB.wallets.filter(w => w.userId === 'user-123');
  }
}

export async function createWallet(data: Omit<Wallet, 'id' | 'userId'>): Promise<Wallet> {
  try {
    const newWallet = await fetchAPI('/wallets', { 
      method: 'POST',
      body: JSON.stringify(data),
    });
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
    const updatedWallet = await fetchAPI(`/wallets/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(data),
    });
    revalidatePath('/wallets');
    revalidatePath('/capital');
    return updatedWallet;
  } catch (error) {
    console.error('Failed to update wallet:', error);
    throw error;
  }
}

export async function deleteWallet(id: string): Promise<void> {
  try {
    await fetchAPI(`/wallets/${id}`, { method: 'DELETE' }); 
    revalidatePath('/wallets');
    revalidatePath('/capital');
  } catch (error) {
    console.error('Failed to delete wallet:', error);
    throw error;
  }
}


// --- Transaction Actions ---
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const transactions = await fetchAPI('/transactions'); 
    return transactions.map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }))
                       .sort((a: Transaction, b: Transaction) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return MOCK_DB.transactions.filter(t => t.userId === 'user-123').sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()); 
  }
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'userId'>): Promise<Transaction> {
  try {
    const newTransaction = await fetchAPI('/transactions', { 
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/budgets');
    return { ...newTransaction, createdAt: new Date(newTransaction.createdAt) };
  } catch (error) {
    console.error('Failed to create transaction:', error);
    throw error;
  }
}

export async function updateTransaction(id: string, data: Partial<Omit<Transaction, 'id' | 'userId'>>): Promise<Transaction | null> {
  try {
    const updatedTransaction = await fetchAPI(`/transactions/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(data),
    });
    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/budgets');
    return { ...updatedTransaction, createdAt: new Date(updatedTransaction.createdAt) };
  } catch (error) {
    console.error('Failed to update transaction:', error);
    throw error;
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    await fetchAPI(`/transactions/${id}`, { method: 'DELETE' }); 
    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/budgets');
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    throw error;
  }
}

// --- Transfer Actions ---
export async function getTransfers(): Promise<Transfer[]> {
  try {
    const transfers = await fetchAPI('/transfers'); 
    return transfers.map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }))
                     .sort((a: Transfer,b: Transfer) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Failed to fetch transfers:', error);
    return MOCK_DB.transfers.filter(t => t.userId === 'user-123').sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()); 
  }
}

export async function createTransfer(data: Omit<Transfer, 'id' | 'userId'>): Promise<Transfer> {
  try {
    const newTransfer = await fetchAPI('/transfers', { 
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/transfers');
    return { ...newTransfer, createdAt: new Date(newTransfer.createdAt) };
  } catch (error) {
    console.error('Failed to create transfer:', error);
    throw error;
  }
}

export async function deleteTransfer(id: string): Promise<void> {
  try {
    await fetchAPI(`/transfers/${id}`, { method: 'DELETE' }); 
    revalidatePath('/transfers');
  } catch (error) {
    console.error('Failed to delete transfer:', error);
    throw error;
  }
}

// --- Budget Actions ---
export async function getBudgets(month?: number, year?: number): Promise<Budget[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id;
  if (!MOCK_USER_ID) return [];
  let budgets = MOCK_DB.budgets.filter(b => b.userId === MOCK_USER_ID);
  if (month && year) {
    budgets = budgets.filter(b => b.month === month && b.year === year);
  }
  return budgets.sort((a, b) => new Date(a.year, a.month - 1).getTime() - new Date(b.year, b.month - 1).getTime() || a.mainCategoryId.localeCompare(b.mainCategoryId));
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
  // For mock: find the latest active session for the user
  const session = MOCK_DB.sharedCapitalSessions
    .filter(s => s.userId === MOCK_USER_ID && s.isActive)
    .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  return session || null;
}

export async function startSharedCapitalSession(partnerEmail: string): Promise<SharedCapitalSession> {
  const MOCK_USER_ID = (await getCurrentUser())?.id;
  if (!MOCK_USER_ID) throw new Error("User not authenticated");

  // Deactivate any existing sessions for this user
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


// Helper to reset DB for testing if needed - not for production
export async function resetMockDb(initialDbState: MockDb): Promise<void> {
  MOCK_DB = JSON.parse(JSON.stringify(initialDbState)); // Deep copy to avoid reference issues
}


'use server';
import type { MainCategory, SubCategory, Transaction, Wallet, Transfer, MockDb, User, UserSettings, Budget, SharedCapitalSession, TransactionFrequency, FeedbackItem, FeedbackStatus, FeedbackType } from './definitions';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, getAuthToken } from './auth'; 
import { cookies as nextCookies } from 'next/headers'; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'; 

// In-memory store for mock data (to be replaced by API calls)
let MOCK_DB: MockDb = { 
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
  mainCategories: [ // Mock data now includes nested subCategories
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
  // subCategories is still here for mock consistency if needed, but primary source is nested
  subCategories: [ 
    { id: 'sc1', userId: 'user-123', mainCategoryId: 'mc1', name: 'Groceries', color: '#FFA07A', icon: 'ShoppingCart' },
    { id: 'sc2', userId: 'user-123', mainCategoryId: 'mc1', name: 'Restaurants', color: '#FA8072', icon: 'Utensils' },
    { id: 'sc3', userId: 'user-123', mainCategoryId: 'mc2', name: 'Gas', color: '#B0C4DE', icon: 'Fuel' },
    { id: 'sc4', userId: 'user-123', mainCategoryId: 'mc3', name: 'Rent', color: '#90EE90', icon: 'Home' },
    { id: 'sc5', userId: 'user-123', mainCategoryId: 'mc4', name: 'Movies', color: '#9370DB', icon: 'Ticket'}
  ],
  wallets: [
    { id: 'w1', userId: 'user-123', name: 'Main Bank', currency: 'USD', initialAmount: 5000, type: 'Bank Account', icon: 'Landmark' },
    { id: 'w2', userId: 'user-123', name: 'Cash', currency: 'USD', initialAmount: 300, type: 'Cash', icon: 'Wallet' },
    { id: 'w3', userId: 'user-123', name: 'Savings PLN', currency: 'PLN', initialAmount: 5889.68, type: 'Bank Account', icon: 'PiggyBank' },
    { id: 'w4', userId: 'user-123', name: 'Euro Cash', currency: 'EUR', initialAmount: 700, type: 'Cash', icon: 'Euro' },
  ],
  transactions: [
    { id: 't1', userId: 'user-123', subCategoryId: 'sc1', walletId: 'w1', type: 'Expense', frequency: 'One-time', amount: 55.75, createdAt: new Date('2023-10-01'), description: 'Weekly groceries' },
    { id: 't2', userId: 'user-123', subCategoryId: 'sc3', walletId: 'w2', type: 'Expense', frequency: 'One-time', amount: 40.00, createdAt: new Date('2023-10-03'), description: 'Fuel' },
    { id: 't3', userId: 'user-123', walletId: 'w1', type: 'Income', frequency: 'Monthly', amount: 3000.00, createdAt: new Date('2023-10-05'), description: 'Salary' }, 
    { id: 't4', userId: 'user-123', subCategoryId: 'sc1', walletId: 'w1', type: 'Expense', frequency: 'Weekly', amount: 22.50, createdAt: new Date(new Date().setDate(new Date().getDate() - 10)), description: 'Weekly Snack Box' },
    { id: 't5', userId: 'user-123', subCategoryId: 'sc3', walletId: 'w2', type: 'Expense', frequency: 'Daily', amount: 5.00, createdAt: new Date(new Date().setDate(new Date().getDate() - 5)), description: 'Daily Coffee' },
  ],
  transfers: [
    { id: 'tr1', userId: 'user-123', fromWalletId: 'w1', toWalletId: 'w2', amount: 100, createdAt: new Date('2023-10-02'), description: 'ATM Withdrawal' }
  ],
  budgets: [
    { id: 'b1', userId: 'user-123', subCategoryId: 'sc1', plannedAmount: 200, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date() }, 
    { id: 'b2', userId: 'user-123', subCategoryId: 'sc3', plannedAmount: 100, month: new Date().getMonth() + 1, year: new Date().getFullYear(), createdAt: new Date() }, 
  ],
  sharedCapitalSessions: [],
  feedbacks: [], 
};

// --- Helper for API calls ---
async function fetchAPI(endpoint: string, options: RequestInit = {}): Promise<{ data: any | null, error: { message: string, status?: number } | null }> {
  try {
    const token = await getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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
      let errorMessage = `API request failed: ${response.statusText}`;
       try {
        const parsedError = JSON.parse(errorBody);
        if (parsedError && parsedError.message) {
            errorMessage = parsedError.message;
        } else if (parsedError) {
            errorMessage = JSON.stringify(parsedError); // Fallback if no message field
        } else {
             errorMessage = errorBody || response.statusText;
        }
      } catch (e) {
        errorMessage = errorBody || response.statusText;
      }
      console.warn(`API Error (${response.status}) on ${endpoint}: ${errorMessage}`); 
      return { data: null, error: { message: errorMessage, status: response.status } };
    }

    if (response.status === 204) { 
      return { data: null, error: null };
    }
    const responseData = await response.json();
    return { data: responseData, error: null };

  } catch (networkError: any) {
    console.warn(`Network/Fetch Error for ${endpoint}:`, networkError.message); 
    return { data: null, error: { message: networkError.message || 'Network request failed' } };
  }
}


// --- User Settings Actions ---
export async function getUserSettings(): Promise<UserSettings | undefined> {
  try {
    const user = await getCurrentUser();
    return user?.settings;
  } catch (error) {
    console.warn('Failed to fetch user settings (mock):', error); 
    const MOCK_USER_ID = 'user-123';
    const user = MOCK_DB.users.find(u => u.id === MOCK_USER_ID);
    return user?.settings;
  }
}

export async function updateUserSettings(newSettings: Partial<UserSettings>): Promise<User | null> {
  try {
    // In a real app, this would be an API call:
    // const result = await fetchAPI('/users/me/settings', { method: 'PUT', body: JSON.stringify(newSettings) });
    // if (result.error || !result.data) throw new Error(result.error?.message || "Failed to update settings via API");
    // MOCK implementation:
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated");

    const userIndex = MOCK_DB.users.findIndex(u => u.id === MOCK_USER_ID);
    if (userIndex === -1) throw new Error("User not found");

    const currentUserSettings = MOCK_DB.users[userIndex].settings || {};
    MOCK_DB.users[userIndex].settings = { ...currentUserSettings, ...newSettings };

    revalidatePath('/settings');
    revalidatePath('/profile');
    revalidatePath('/transactions');
    revalidatePath('/dashboard'); 
    return MOCK_DB.users[userIndex];
  } catch (error) {
    console.error('Failed to update user settings:', error);
    throw error;
  }
}

// --- User Profile Actions ---
export async function updateUserProfile(userId: string, data: { name?: string }): Promise<User | null> {
  try {
    // API Call: PUT /api/users/me/profile
    // const result = await fetchAPI('/users/me/profile', { method: 'PUT', body: JSON.stringify(data) });
    // if (result.error || !result.data) throw new Error(result.error?.message || "Failed to update profile via API");
    // MOCK Implementation:
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
  // API Call: POST /api/users/me/change-password
  // const result = await fetchAPI('/users/me/change-password', { method: 'POST', body: JSON.stringify({currentPassword, newPassword}) });
  // if (result.error) return { success: false, message: result.error.message };
  // return { success: true, message: result.data?.message || "Password changed successfully." };
  // MOCK Implementation:
  console.log(`Attempting to change password for user ${userId}. Current: ${currentPassword}, New: ${newPassword}`);
  const MOCK_USER_ID = (await getCurrentUser())?.id;
  if (!MOCK_USER_ID || MOCK_USER_ID !== userId) {
    return { success: false, message: "Unauthorized or user mismatch." };
  }
  if (currentPassword === "password123_wrong") { // Example of incorrect current password for mock
     return { success: false, message: "Incorrect current password." };
  }
  console.log(`Mock password change successful for user ${userId}.`);
  return { success: true, message: "Password changed successfully." };
}


// --- Main Category Actions ---
export async function getMainCategories(): Promise<MainCategory[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123'; // Fallback for unauthenticated scenarios if any
  // Mock data now includes nested subcategories, mimicking the new API structure
  const mockData = MOCK_DB.mainCategories
    .filter(mc => mc.userId === MOCK_USER_ID)
    .map(mc => ({
      ...mc,
      subCategories: MOCK_DB.subCategories.filter(sc => sc.mainCategoryId === mc.id && sc.userId === MOCK_USER_ID)
    }));
  
  // API call updated to /main/categories
  const result = await fetchAPI('/main/categories'); 
  if (result.error || !result.data) {
    console.warn(`getMainCategories: API call failed (Error: ${result.error?.message}). Falling back to mock data.`);
    return mockData;
  }
  try {
    // API is expected to return MainCategory[] where each can have subCategories nested
    // The definition of MainCategory already includes `subCategories?: SubCategory[]`
    return result.data as MainCategory[];
  } catch (processingError: any) {
    console.error(`getMainCategories: Error processing data from API (Error: ${processingError.message}). Falling back to mock data.`);
    return mockData;
  }
}

export async function createMainCategory(data: Omit<MainCategory, 'id' | 'userId' | 'subCategories'>): Promise<MainCategory> {
  // API Call: POST /main/categories
  const apiData = { name: data.name, color: data.color, icon: data.icon };
  const result = await fetchAPI('/main/categories', { method: 'POST', body: JSON.stringify(apiData) });
  if (result.error || !result.data) {
    console.error('Failed to create main category via API:', result.error?.message);
    // Fallback to mock for now, or throw error
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated for mock operation");
    const newCategory: MainCategory = { ...data, id: `mc${Date.now()}`, userId: MOCK_USER_ID, subCategories: [] };
    MOCK_DB.mainCategories.push(newCategory);
    revalidatePath('/categories');
    return newCategory; // Return mock data on API failure
  }
  revalidatePath('/categories');
  return result.data as MainCategory;
}

export async function updateMainCategory(id: string, data: Partial<Omit<MainCategory, 'id' | 'userId' | 'subCategories'>>): Promise<MainCategory | null> {
  const apiData = { name: data.name, color: data.color, icon: data.icon };
  const result = await fetchAPI(`/main/categories/${id}`, { method: 'PUT', body: JSON.stringify(apiData) });
  if (result.error) {
    console.error('Failed to update main category via API:', result.error.message);
    return null; // Or handle mock update as fallback
  }
  revalidatePath('/categories');
  return result.data as MainCategory | null;
}

export async function deleteMainCategory(id: string): Promise<void> {
  const result = await fetchAPI(`/main/categories/${id}`, { method: 'DELETE' });
  if (result.error) {
    console.error('Failed to delete main category via API:', result.error.message);
    // Optionally implement mock fallback or throw
    // Mock fallback:
    // const MOCK_USER_ID = (await getCurrentUser())?.id;
    // if (!MOCK_USER_ID) throw new Error("User not authenticated for mock operation");
    // MOCK_DB.mainCategories = MOCK_DB.mainCategories.filter(c => c.id !== id || c.userId !== MOCK_USER_ID);
    // MOCK_DB.subCategories = MOCK_DB.subCategories.filter(sc => sc.mainCategoryId !== id || sc.userId !== MOCK_USER_ID);
    throw new Error(result.error.message); // Re-throw for now
  }
  revalidatePath('/categories');
  revalidatePath('/budgets'); 
}

// --- Sub Category Actions ---
export async function getSubCategories(mainCategoryId?: string): Promise<SubCategory[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';

  // Fetch all main categories (which include nested subcategories)
  const allMainCategories = await getMainCategories(); 

  let subCategories: SubCategory[] = [];

  if (mainCategoryId) {
    const foundMain = allMainCategories.find(mc => mc.id === mainCategoryId);
    subCategories = foundMain?.subCategories || [];
  } else {
    // Flatten all subcategories from all main categories
    allMainCategories.forEach(mc => {
      if (mc.subCategories) {
        subCategories.push(...mc.subCategories);
      }
    });
  }
  // Ensure subcategories also have userId if filtering by it is needed client-side, though API should handle it
  return subCategories.map(sc => ({ ...sc, userId: MOCK_USER_ID })); 
}

export async function createSubCategory(data: Omit<SubCategory, 'id' | 'userId'>): Promise<SubCategory> {
  const apiData = {
    name: data.name,
    main_category: data.mainCategoryId, // API expects main_category
    color: data.color,
    icon: data.icon,
  };
  const result = await fetchAPI('/sub/categories', { method: 'POST', body: JSON.stringify(apiData) });
  if (result.error || !result.data) {
    console.error('Failed to create sub category via API:', result.error?.message);
    // Fallback to mock
    const MOCK_USER_ID = (await getCurrentUser())?.id;
    if (!MOCK_USER_ID) throw new Error("User not authenticated for mock operation");
    const newCategory: SubCategory = { ...data, id: `sc${Date.now()}`, userId: MOCK_USER_ID };
    MOCK_DB.subCategories.push(newCategory);
    // Also update the parent main category's subCategories array in MOCK_DB
    const parentMain = MOCK_DB.mainCategories.find(mc => mc.id === data.mainCategoryId);
    if (parentMain) {
        if (!parentMain.subCategories) parentMain.subCategories = [];
        parentMain.subCategories.push(newCategory);
    }
    revalidatePath('/categories');
    revalidatePath('/budgets');
    return newCategory;
  }
  revalidatePath('/categories');
  revalidatePath('/budgets');
  return result.data as SubCategory;
}

export async function updateSubCategory(id: string, data: Partial<Omit<SubCategory, 'id' | 'userId'>>): Promise<SubCategory | null> {
  const apiData: any = { name: data.name, color: data.color, icon: data.icon };
  if (data.mainCategoryId) {
    apiData.main_category = data.mainCategoryId; // API expects main_category
  }
  const result = await fetchAPI(`/sub/categories/${id}`, { method: 'PUT', body: JSON.stringify(apiData) });
  if (result.error) {
    console.error('Failed to update sub category via API:', result.error.message);
    return null;
  }
  revalidatePath('/categories');
  revalidatePath('/budgets');
  return result.data as SubCategory | null;
}

export async function deleteSubCategory(id: string): Promise<void> {
  const result = await fetchAPI(`/sub/categories/${id}`, { method: 'DELETE' });
  if (result.error) {
    console.error('Failed to delete sub category via API:', result.error.message);
    throw new Error(result.error.message);
  }
  // MOCK_DB.subCategories = MOCK_DB.subCategories.filter(c => c.id !== id || c.userId !== MOCK_USER_ID);
  // MOCK_DB.budgets = MOCK_DB.budgets.filter(b => b.subCategoryId !== id || b.userId !== MOCK_USER_ID);
  revalidatePath('/categories');
  revalidatePath('/budgets');
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
  const result = await fetchAPI('/wallets', {method: 'POST', body: JSON.stringify(data)});
  if (result.error || !result.data) {
     console.error('Failed to create wallet via API:', result.error?.message);
     throw new Error(result.error?.message || "API Error creating wallet");
  }
  revalidatePath('/wallets');
  revalidatePath('/capital');
  return result.data as Wallet;
}

export async function updateWallet(id: string, data: Partial<Omit<Wallet, 'id' | 'userId'>>): Promise<Wallet | null> {
  const result = await fetchAPI(`/wallets/${id}`, {method: 'PUT', body: JSON.stringify(data)});
  if (result.error) {
    console.error('Failed to update wallet via API:', result.error.message);
    return null;
  }
  revalidatePath('/wallets');
  revalidatePath('/capital');
  return result.data as Wallet | null;
}

export async function deleteWallet(id: string): Promise<void> {
  const result = await fetchAPI(`/wallets/${id}`, {method: 'DELETE'});
  if (result.error) {
    console.error('Failed to delete wallet via API:', result.error.message);
    throw new Error(result.error.message);
  }
  revalidatePath('/wallets');
  revalidatePath('/capital');
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
  const result = await fetchAPI('/transactions', {method: 'POST', body: JSON.stringify({...data, createdAt: data.createdAt.toISOString()})});
   if (result.error || !result.data) {
     console.error('Failed to create transaction via API:', result.error?.message);
     throw new Error(result.error?.message || "API Error creating transaction");
  }
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/budgets');
  return {...result.data, createdAt: new Date(result.data.createdAt)} as Transaction;
}

export async function updateTransaction(id: string, data: Partial<Omit<Transaction, 'id' | 'userId'>>): Promise<Transaction | null> {
  const result = await fetchAPI(`/transactions/${id}`, {method: 'PUT', body: JSON.stringify(data.createdAt ? {...data, createdAt: new Date(data.createdAt).toISOString()} : data)});
  if (result.error) {
    console.error('Failed to update transaction via API:', result.error.message);
    return null;
  }
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/budgets');
  return {...result.data, createdAt: new Date(result.data.createdAt)} as Transaction | null;
}

export async function deleteTransaction(id: string): Promise<void> {
  const result = await fetchAPI(`/transactions/${id}`, {method: 'DELETE'});
  if (result.error) {
    console.error('Failed to delete transaction via API:', result.error.message);
    throw new Error(result.error.message);
  }
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/budgets');
}

export async function stopRecurringTransaction(transactionId: string): Promise<Transaction | null> {
  const result = await fetchAPI(`/transactions/${transactionId}/stop-recurring`, {method: 'POST'}); // Or PUT
  if (result.error) {
    console.error('Failed to stop recurring transaction via API:', result.error.message);
    return null;
  }
  revalidatePath('/transactions');
  return {...result.data, createdAt: new Date(result.data.createdAt)} as Transaction | null;
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
   const result = await fetchAPI('/transfers', {method: 'POST', body: JSON.stringify({...data, createdAt: data.createdAt.toISOString()})});
   if (result.error || !result.data) {
     console.error('Failed to create transfer via API:', result.error?.message);
     throw new Error(result.error?.message || "API Error creating transfer");
  }
  revalidatePath('/transfers');
  return {...result.data, createdAt: new Date(result.data.createdAt)} as Transfer;
}

export async function deleteTransfer(id: string): Promise<void> {
  const result = await fetchAPI(`/transfers/${id}`, {method: 'DELETE'});
  if (result.error) {
    console.error('Failed to delete transfer via API:', result.error.message);
    throw new Error(result.error.message);
  }
  revalidatePath('/transfers');
}

// --- Budget Actions ---
export async function getBudgets(month?: number, year?: number): Promise<Budget[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  let query = '';
  if (month && year) {
    query = `?month=${month}&year=${year}`;
  }
  const result = await fetchAPI(`/budgets${query}`);

  const mockData = MOCK_DB.budgets.filter(b => b.userId === MOCK_USER_ID && (month ? b.month === month : true) && (year ? b.year === year : true))
                                 .sort((a, b) => (a.year !== b.year) ? a.year - b.year : (a.month !== b.month) ? a.month - b.month : a.subCategoryId.localeCompare(b.subCategoryId));

  if (result.error || !result.data) {
    console.warn(`getBudgets: API call failed (Error: ${result.error?.message}). Falling back to mock data.`);
    return mockData;
  }
  try {
    return (result.data as any[]).map(b => ({...b, createdAt: new Date(b.createdAt)}))
                                 .sort((a: Budget, b: Budget) => (a.year !== b.year) ? a.year - b.year : (a.month !== b.month) ? a.month - b.month : a.subCategoryId.localeCompare(b.subCategoryId));
  } catch (processingError: any) {
     console.error(`getBudgets: Error processing data from API (Error: ${processingError.message}). Falling back to mock data.`);
     return mockData;
  }
}

export async function createBudget(data: Omit<Budget, 'id' | 'userId' | 'createdAt'>): Promise<Budget> {
  const result = await fetchAPI('/budgets', {method: 'POST', body: JSON.stringify(data)});
  if (result.error || !result.data) {
     console.error('Failed to create budget via API:', result.error?.message);
     throw new Error(result.error?.message || "API Error creating budget");
  }
  revalidatePath('/budgets');
  return {...result.data, createdAt: new Date(result.data.createdAt)} as Budget;
}

export async function updateBudget(id: string, data: Partial<Omit<Budget, 'id' | 'userId' | 'createdAt'>>): Promise<Budget | null> {
  const result = await fetchAPI(`/budgets/${id}`, {method: 'PUT', body: JSON.stringify(data)});
  if (result.error) {
    console.error('Failed to update budget via API:', result.error.message);
    return null;
  }
  revalidatePath('/budgets');
  return {...result.data, createdAt: new Date(result.data.createdAt)} as Budget | null;
}

export async function deleteBudget(id: string): Promise<void> {
  const result = await fetchAPI(`/budgets/${id}`, {method: 'DELETE'});
  if (result.error) {
    console.error('Failed to delete budget via API:', result.error.message);
    throw new Error(result.error.message);
  }
  revalidatePath('/budgets');
}

// --- Shared Capital Actions ---
export async function getSharedCapitalSession(): Promise<SharedCapitalSession | null> {
  const result = await fetchAPI('/shared-capital/session');
  if (result.error) {
     console.warn(`getSharedCapitalSession: API call failed (Error: ${result.error?.message}). Mock DB has no active session.`);
     return null; // Mock DB usually empty, so API error means null
  }
  if (!result.data) return null; // API returned 204 or null explicitly
  try {
      return {...result.data, createdAt: new Date(result.data.createdAt), updatedAt: new Date(result.data.updatedAt)} as SharedCapitalSession;
  } catch(e) {
      console.error("Error processing shared capital session data", e);
      return null;
  }
}

export async function startSharedCapitalSession(partnerEmail: string): Promise<SharedCapitalSession> {
  const result = await fetchAPI('/shared-capital/session', {method: 'POST', body: JSON.stringify({partnerEmail})});
  if (result.error || !result.data) {
    console.error('Failed to start shared capital session via API:', result.error?.message);
    throw new Error(result.error?.message || "API Error starting session");
  }
  revalidatePath('/capital');
  return {...result.data, createdAt: new Date(result.data.createdAt), updatedAt: new Date(result.data.updatedAt)} as SharedCapitalSession;
}

export async function stopSharedCapitalSession(): Promise<SharedCapitalSession | null> {
   const result = await fetchAPI('/shared-capital/session', {method: 'DELETE'});
   if (result.error) {
    console.error('Failed to stop shared capital session via API:', result.error.message);
    return null; // API might return 204 on success which fetchAPI handles as data:null
  }
  revalidatePath('/capital');
  // If API returns 204, result.data will be null. If it returns the updated (inactive) session:
  return result.data ? {...result.data, createdAt: new Date(result.data.createdAt), updatedAt: new Date(result.data.updatedAt)} as SharedCapitalSession : null;
}

// --- Feedback Actions ---
export async function getFeedbacks(): Promise<FeedbackItem[]> {
  const result = await fetchAPI('/feedbacks');
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  const mockData = MOCK_DB.feedbacks
    .filter(f => f.userId === MOCK_USER_ID)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (result.error || !result.data) {
    console.warn(`getFeedbacks: API call failed (Error: ${result.error?.message}). Falling back to mock data.`);
    return mockData;
  }
  try {
      return (result.data as any[]).map(f => ({...f, createdAt: new Date(f.createdAt)}))
                                   .sort((a:FeedbackItem, b:FeedbackItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch(processingError: any) {
      console.error(`getFeedbacks: Error processing API data (Error: ${processingError.message}). Falling back to mock data.`);
      return mockData;
  }
}

export async function addFeedback(
  feedbackData: Omit<FeedbackItem, 'id' | 'userId' | 'createdAt' | 'status'>
): Promise<FeedbackItem> {
  const currentUser = await getCurrentUser(); // Ensures user is authenticated for API call
  if (!currentUser) {
    throw new Error("User not authenticated to submit feedback.");
  }
  // API doesn't need userId or createdAt, status is defaulted by backend
  const result = await fetchAPI('/feedbacks', {method: 'POST', body: JSON.stringify(feedbackData)});
  if (result.error || !result.data) {
    console.error('Failed to add feedback via API:', result.error?.message);
    throw new Error(result.error?.message || "API Error submitting feedback");
  }
  revalidatePath('/view-feedback');
  return {...result.data, createdAt: new Date(result.data.createdAt)} as FeedbackItem;
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<FeedbackItem | null> {
  const result = await fetchAPI(`/feedbacks/${id}/status`, {method: 'PUT', body: JSON.stringify({status})});
  if (result.error) {
    console.error(`Failed to update feedback status for ${id} via API:`, result.error.message);
    return null;
  }
  revalidatePath('/view-feedback'); 
  return result.data ? {...result.data, createdAt: new Date(result.data.createdAt)} as FeedbackItem : null;
}

// --- Locale Actions ---
export async function setLocaleCookie(locale: string, currentPath: string) {
  const cookieStore = nextCookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, 
    sameSite: 'lax',
  });
  revalidatePath(currentPath); 
  revalidatePath('/', 'layout'); 
}


// Helper to reset DB for testing if needed - not for production
export async function resetMockDb(initialDbState: MockDb): Promise<void> {
  MOCK_DB = JSON.parse(JSON.stringify(initialDbState));
}


'use server';
import type { MainCategory, SubCategory, Transaction, Wallet, Transfer, User, UserSettings, Budget, SharedCapitalSession, TransactionFrequency, FeedbackItem, FeedbackStatus, FeedbackType, WalletType, TransactionType } from './definitions';
import { MOCK_DB, _dangerouslyResetMockDbContent, type MockDb } from './definitions';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, getAuthToken } from './auth';
import { cookies as nextCookies } from 'next/headers';
import {
  API_MAIN_CATEGORIES, API_MAIN_CATEGORIES_ID,
  API_SUB_CATEGORIES, API_SUB_CATEGORIES_ID,
  API_WALLETS, API_WALLETS_ID, API_WALLET_TYPES,
  API_TRANSACTIONS, API_TRANSACTIONS_ID, API_TRANSACTIONS_STOP_RECURRING, API_TRANSACTION_TYPES,
  API_TRANSFERS, API_TRANSFERS_ID,
  API_BUDGETS, API_BUDGETS_ID,
  API_SHARED_CAPITAL_SESSION,
  API_FEEDBACKS, API_FEEDBACKS_ID_STATUS
} from './apiConstants';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

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
            errorMessage = JSON.stringify(parsedError);
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
    console.warn(`Network/Fetch Error for ${endpoint}: ${networkError.message}. Returning 'null' data and no error, which will lead to empty data being used by callers.`);
    return { data: null, error: null }; // On fetch failure, return null data and no error
  }
}


// --- User Settings Actions ---
export async function getUserSettings(): Promise<UserSettings | undefined> {
  try {
    const user = await getCurrentUser();
    return user?.settings;
  } catch (error) {
    console.warn('Failed to fetch user settings (mock):', error);
    const user = MOCK_DB.users.find(u => u.id === 'user-123');
    return user?.settings;
  }
}

export async function updateUserSettings(newSettings: Partial<UserSettings>): Promise<User | null> {
  try {
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
  const apiCallLogPrefix = 'getMainCategories: API call';
  const { data: resultData, error } = await fetchAPI(API_MAIN_CATEGORIES);

  const mockFallback = async (): Promise<MainCategory[]> => {
      console.warn(`${apiCallLogPrefix} failed or returned unexpected data. Falling back to mock data.`);
      return MOCK_DB.mainCategories
        .filter(mc => mc.userId === MOCK_USER_ID)
        .map(mc => ({
          ...mc,
          subCategories: Array.isArray(mc.subCategories) ? mc.subCategories.filter(sc => sc.userId === MOCK_USER_ID) :
                         MOCK_DB.subCategories.filter(sc => sc.mainCategoryId === mc.id && sc.userId === MOCK_USER_ID)
        }));
  }

  if (error) {
    console.error(`${apiCallLogPrefix} resulted in error (Status: ${error.status}, Message: ${error.message}). Falling back to mock data.`);
    return mockFallback();
  }
  if (resultData === null) {
      console.info(`${apiCallLogPrefix} returned null data (e.g. 204 No Content or fetch failure). Returning empty list.`);
      return [];
  }

  try {
    let actualDataArray = resultData;
    // Check if resultData is an object and has a common wrapper key for the list
    if (typeof resultData === 'object' && !Array.isArray(resultData)) {
      if (resultData.mainCategories && Array.isArray(resultData.mainCategories)) {
        actualDataArray = resultData.mainCategories;
      } else if (resultData.categories && Array.isArray(resultData.categories)) {
        actualDataArray = resultData.categories;
      } else if (resultData.data && Array.isArray(resultData.data)) {
        actualDataArray = resultData.data;
      } else {
        console.warn(`${apiCallLogPrefix} returned object but not a recognized list wrapper. Data:`, resultData);
        return []; // Return empty if structure is unrecognized
      }
    }

    if (!Array.isArray(actualDataArray)) {
      console.warn(`${apiCallLogPrefix} returned data in an unexpected format (Type: ${typeof actualDataArray}, Data: ${JSON.stringify(actualDataArray)}). Returning empty list.`);
      return [];
    }

    // Ensure subCategories is always an array
    return (actualDataArray as MainCategory[]).map(mc => ({
      ...mc,
      subCategories: Array.isArray(mc.subCategories) ? mc.subCategories : []
    }));
  } catch (processingError: any) {
     console.error(`${apiCallLogPrefix} error processing data (Error: ${processingError.message}). Falling back to mock data.`);
     return mockFallback();
  }
}


export async function createMainCategory(data: Omit<MainCategory, 'id' | 'userId' | 'subCategories'>): Promise<MainCategory> {
  const apiData = { name: data.name, color: data.color, icon: data.icon };
  const {data: resultData, error} = await fetchAPI(API_MAIN_CATEGORIES, { method: 'POST', body: JSON.stringify(apiData) });
  if (error || !resultData) {
    console.error('Failed to create main category via API:', error?.message);
    throw new Error(error?.message || "API Error creating main category");
  }
  revalidatePath('/categories');
  return resultData as MainCategory;
}

export async function updateMainCategory(id: string, data: Partial<Omit<MainCategory, 'id' | 'userId' | 'subCategories'>>): Promise<MainCategory | null> {
  const apiData = { name: data.name, color: data.color, icon: data.icon };
  const {data: resultData, error} = await fetchAPI(API_MAIN_CATEGORIES_ID(id), { method: 'PUT', body: JSON.stringify(apiData) });
  if (error) {
    console.error('Failed to update main category via API:', error.message);
    return null;
  }
  revalidatePath('/categories');
  return resultData as MainCategory | null;
}

export async function deleteMainCategory(id: string): Promise<void> {
  const { error } = await fetchAPI(API_MAIN_CATEGORIES_ID(id), { method: 'DELETE' });
  if (error) {
    console.error('Failed to delete main category via API:', error.message);
    throw new Error(error.message);
  }
  revalidatePath('/categories');
  revalidatePath('/budgets');
}

// --- Sub Category Actions ---
export async function getSubCategories(mainCategoryIdFilter?: string): Promise<SubCategory[]> {
  const allMainCategories = await getMainCategories(); // This will now always return an array
  if (!Array.isArray(allMainCategories)) { // Defensive check, though getMainCategories should ensure it
      console.warn("getMainCategories did not return an array for getSubCategories. Returning empty list.");
      return [];
  }
  let subCategoriesResult: SubCategory[] = [];

  if (mainCategoryIdFilter) {
    const foundMain = allMainCategories.find(mc => mc.id === mainCategoryIdFilter);
    if (foundMain && Array.isArray(foundMain.subCategories)) {
      subCategoriesResult = foundMain.subCategories;
    } else {
      // If main category not found or subCategories is not an array, result remains empty
      subCategoriesResult = [];
    }
  } else {
    // If no filter, collect all subcategories from all main categories
    allMainCategories.forEach(mc => {
      if (mc.subCategories && Array.isArray(mc.subCategories)) {
        subCategoriesResult.push(...mc.subCategories);
      }
    });
  }
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  return subCategoriesResult.map(sc => ({ ...sc, userId: sc.userId || MOCK_USER_ID }));
}


export async function createSubCategory(data: Omit<SubCategory, 'id' | 'userId'>): Promise<SubCategory> {
  const apiData = {
    name: data.name,
    main_category: data.mainCategoryId, // Use main_category as per API doc
    color: data.color,
    icon: data.icon,
  };
  const {data: resultData, error} = await fetchAPI(API_SUB_CATEGORIES, { method: 'POST', body: JSON.stringify(apiData) });
  if (error || !resultData) {
    console.error('Failed to create sub category via API:', error?.message);
     throw new Error(error?.message || "API Error creating sub category");
  }
  revalidatePath('/categories');
  revalidatePath('/budgets');
  return resultData as SubCategory;
}

export async function updateSubCategory(id: string, data: Partial<Omit<SubCategory, 'id' | 'userId'>>): Promise<SubCategory | null> {
  const apiData: any = { name: data.name, color: data.color, icon: data.icon };
  if (data.mainCategoryId) {
    apiData.main_category = data.mainCategoryId; // Use main_category
  }
  const {data: resultData, error} = await fetchAPI(API_SUB_CATEGORIES_ID(id), { method: 'PUT', body: JSON.stringify(apiData) });
  if (error) {
    console.error('Failed to update sub category via API:', error.message);
    return null;
  }
  revalidatePath('/categories');
  revalidatePath('/budgets');
  return resultData as SubCategory | null;
}

export async function deleteSubCategory(id: string): Promise<void> {
  const { error } = await fetchAPI(API_SUB_CATEGORIES_ID(id), { method: 'DELETE' });
  if (error) {
    console.error('Failed to delete sub category via API:', error.message);
    throw new Error(error.message);
  }
  revalidatePath('/categories');
  revalidatePath('/budgets');
}


// --- Wallet Actions ---
export async function getWallets(): Promise<Wallet[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  const { data: resultData, error } = await fetchAPI(API_WALLETS);

  const mockFallback = async (): Promise<Wallet[]> => {
    console.warn(`getWallets: API call failed or returned unexpected data. Falling back to mock data.`);
    return MOCK_DB.wallets.filter(w => w.userId === MOCK_USER_ID).map(w => ({...w, initialAmount: w.initialAmount / 100}));
  };

  if (error) {
    console.error(`getWallets: API call resulted in error (Status: ${error.status}, Message: ${error.message}). Falling back to mock data.`);
    return mockFallback();
  }
  if (resultData === null) {
      console.info(`getWallets: API call returned null data (e.g. 204 No Content or fetch failure). Returning empty list.`);
      return [];
  }
  try {
    let actualDataArray = resultData;
    if (typeof resultData === 'object' && !Array.isArray(resultData)) {
      if (resultData.wallets && Array.isArray(resultData.wallets)) {
        actualDataArray = resultData.wallets;
      } else if (resultData.data && Array.isArray(resultData.data)) { // Common wrapper
         actualDataArray = resultData.data;
      } else {
        console.warn(`getWallets: API returned object but not a recognized list wrapper. Data:`, resultData);
        return [];
      }
    }

    if (!Array.isArray(actualDataArray)) {
      console.warn(`getWallets: API returned non-array data. Type: ${typeof actualDataArray}, Data: ${JSON.stringify(actualDataArray)}. Returning empty array.`);
      return [];
    }
    return (actualDataArray as Wallet[]).map(w => ({...w, initialAmount: w.initialAmount / 100}));
  } catch (processingError: any) {
    console.error(`getWallets: Error processing data from API (Error: ${processingError.message}). Falling back to mock data.`);
    return mockFallback();
  }
}

export async function createWallet(data: Omit<Wallet, 'id' | 'userId'>): Promise<Wallet> {
  const payload = { ...data, initialAmount: Math.round(data.initialAmount * 100) };
  const {data: resultData, error} = await fetchAPI(API_WALLETS, {method: 'POST', body: JSON.stringify(payload)});
   if (error || !resultData) {
     console.error('Failed to create wallet via API:', error?.message);
     throw new Error(error?.message || "API Error creating wallet");
  }
  revalidatePath('/wallets');
  revalidatePath('/capital');
  return {...resultData, initialAmount: resultData.initialAmount / 100 } as Wallet;
}

export async function updateWallet(id: string, data: Partial<Omit<Wallet, 'id' | 'userId'>>): Promise<Wallet | null> {
  const payload = { ...data };
  if (typeof payload.initialAmount === 'number') {
    payload.initialAmount = Math.round(payload.initialAmount * 100);
  }
  const {data: resultData, error} = await fetchAPI(API_WALLETS_ID(id), {method: 'PUT', body: JSON.stringify(payload)});
  if (error) {
    console.error('Failed to update wallet via API:', error.message);
    return null;
  }
  revalidatePath('/wallets');
  revalidatePath('/capital');
  return resultData ? {...resultData, initialAmount: resultData.initialAmount / 100} as Wallet | null : null;
}

export async function deleteWallet(id: string): Promise<void> {
  const { error } = await fetchAPI(API_WALLETS_ID(id), {method: 'DELETE'});
  if (error) {
    console.error('Failed to delete wallet via API:', error.message);
    throw new Error(error.message);
  }
  revalidatePath('/wallets');
  revalidatePath('/capital');
}


// --- Transaction Actions ---
export async function getTransactions(): Promise<Transaction[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  const { data: resultData, error } = await fetchAPI(API_TRANSACTIONS);

  const mockFallback = async (): Promise<Transaction[]> => {
    console.warn(`getTransactions: API call failed or returned unexpected data. Falling back to mock data.`);
     return MOCK_DB.transactions
      .filter(t => t.userId === MOCK_USER_ID)
      .map(t => ({ ...t, amount: t.amount / 100, createdAt: new Date(t.createdAt) }))
      .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  if (error) {
    console.error(`getTransactions: API call resulted in error (Status: ${error.status}, Message: ${error.message}). Falling back to mock data.`);
    return mockFallback();
  }
  if (resultData === null) {
    console.info(`getTransactions: API call returned null data (e.g. 204 No Content or fetch failure). Returning empty list.`);
    return [];
  }

  try {
    let actualDataArray = resultData;
    if (typeof resultData === 'object' && !Array.isArray(resultData)) {
      if (resultData.transactions && Array.isArray(resultData.transactions)) {
        actualDataArray = resultData.transactions;
      } else if (resultData.data && Array.isArray(resultData.data)) { // Common wrapper
        actualDataArray = resultData.data;
      } else {
        console.warn(`getTransactions: API returned object but not a recognized list wrapper. Data:`, resultData);
        return [];
      }
    }

    if (!Array.isArray(actualDataArray)) {
      console.warn(`getTransactions: API returned non-array data. Type: ${typeof actualDataArray}, Data: ${JSON.stringify(actualDataArray)}. Returning empty array.`);
      return [];
    }
    return (actualDataArray as any[]).map((t: any) => ({ ...t, amount: t.amount / 100, createdAt: new Date(t.createdAt) }))
                         .sort((a: Transaction, b: Transaction) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (processingError: any) {
    console.error(`getTransactions: Error processing data from API (Error: ${processingError.message}). Falling back to mock data.`);
    return mockFallback();
  }
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'userId'>): Promise<Transaction> {
  const payload = { ...data, amount: Math.round(data.amount * 100), createdAt: data.createdAt.toISOString() };
  const {data: resultData, error} = await fetchAPI(API_TRANSACTIONS, {method: 'POST', body: JSON.stringify(payload)});
   if (error || !resultData) {
     console.error('Failed to create transaction via API:', error?.message);
     throw new Error(error?.message || "API Error creating transaction");
  }
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/budgets');
  revalidatePath('/standard-reports');
  return {...resultData, amount: resultData.amount / 100, createdAt: new Date(resultData.createdAt)} as Transaction;
}

export async function updateTransaction(id: string, data: Partial<Omit<Transaction, 'id' | 'userId'>>): Promise<Transaction | null> {
  const payload = { ...data };
  if (typeof payload.amount === 'number') {
    payload.amount = Math.round(payload.amount * 100);
  }
  if (payload.createdAt) {
    payload.createdAt = new Date(payload.createdAt).toISOString() as any; // Type assertion
  }
  const {data: resultData, error} = await fetchAPI(API_TRANSACTIONS_ID(id), {method: 'PUT', body: JSON.stringify(payload)});
  if (error) {
    console.error('Failed to update transaction via API:', error.message);
    return null;
  }
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/budgets');
  revalidatePath('/standard-reports');
  return resultData ? {...resultData, amount: resultData.amount / 100, createdAt: new Date(resultData.createdAt)} as Transaction | null : null;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await fetchAPI(API_TRANSACTIONS_ID(id), {method: 'DELETE'});
  if (error) {
    console.error('Failed to delete transaction via API:', error.message);
    throw new Error(error.message);
  }
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/budgets');
  revalidatePath('/standard-reports');
}

export async function stopRecurringTransaction(transactionId: string): Promise<Transaction | null> {
  const {data: resultData, error} = await fetchAPI(API_TRANSACTIONS_STOP_RECURRING(transactionId), {method: 'POST'});
  if (error) {
    console.error('Failed to stop recurring transaction via API:', error.message);
    return null;
  }
  revalidatePath('/transactions');
  return resultData ? {...resultData, amount: resultData.amount / 100, createdAt: new Date(resultData.createdAt)} as Transaction | null : null;
}


// --- Transfer Actions ---
export async function getTransfers(): Promise<Transfer[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  const { data: resultData, error } = await fetchAPI(API_TRANSFERS);

  const mockFallback = async (): Promise<Transfer[]> => {
     console.warn(`getTransfers: API call failed or returned unexpected data. Falling back to mock data.`);
     return MOCK_DB.transfers
      .filter(t => t.userId === MOCK_USER_ID)
      .map(t => ({ ...t, amount: t.amount / 100, createdAt: new Date(t.createdAt) }))
      .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  if (error) {
     console.error(`getTransfers: API call resulted in error (Status: ${error.status}, Message: ${error.message}). Falling back to mock data.`);
     return mockFallback();
  }
  if (resultData === null) {
    console.info(`getTransfers: API call returned null data (e.g. 204 No Content or fetch failure). Returning empty list.`);
    return [];
  }
  try {
    let actualDataArray = resultData;
    if (typeof resultData === 'object' && !Array.isArray(resultData)) {
       if (resultData.transfers && Array.isArray(resultData.transfers)) {
        actualDataArray = resultData.transfers;
      } else if (resultData.data && Array.isArray(resultData.data)) { // Common wrapper
        actualDataArray = resultData.data;
      } else {
        console.warn(`getTransfers: API returned object but not a recognized list wrapper. Data:`, resultData);
        return [];
      }
    }

    if (!Array.isArray(actualDataArray)) {
      console.warn(`getTransfers: API returned non-array data. Type: ${typeof actualDataArray}, Data: ${JSON.stringify(actualDataArray)}. Returning empty array.`);
      return [];
    }
    return (actualDataArray as any[]).map((t: any) => ({ ...t, amount: t.amount / 100, createdAt: new Date(t.createdAt) }))
                     .sort((a: Transfer,b: Transfer) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (processingError: any) {
    console.error(`getTransfers: Error processing data from API (Error: ${processingError.message}). Falling back to mock data.`);
    return mockFallback();
  }
}

export async function createTransfer(data: Omit<Transfer, 'id' | 'userId'>): Promise<Transfer> {
   const payload = { ...data, amount: Math.round(data.amount * 100), createdAt: data.createdAt.toISOString() };
   const {data: resultData, error} = await fetchAPI(API_TRANSFERS, {method: 'POST', body: JSON.stringify(payload)});
   if (error || !resultData) {
     console.error('Failed to create transfer via API:', error?.message);
     throw new Error(error?.message || "API Error creating transfer");
  }
  revalidatePath('/transfers');
  revalidatePath('/capital');
  return {...resultData, amount: resultData.amount / 100, createdAt: new Date(resultData.createdAt)} as Transfer;
}

export async function deleteTransfer(id: string): Promise<void> {
  const { error } = await fetchAPI(API_TRANSFERS_ID(id), {method: 'DELETE'});
  if (error) {
    console.error('Failed to delete transfer via API:', error.message);
    throw new Error(error.message);
  }
  revalidatePath('/transfers');
  revalidatePath('/capital');
}

// --- Budget Actions ---
export async function getBudgets(month?: number, year?: number): Promise<Budget[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  let query = '';
  if (month && year) {
    query = `?month=${month}&year=${year}`;
  }
  const { data: resultData, error } = await fetchAPI(`${API_BUDGETS}${query}`);

  const mockFallback = async (): Promise<Budget[]> => {
    console.warn(`getBudgets: API call failed or returned unexpected data. Falling back to mock data.`);
    return MOCK_DB.budgets
      .filter(b => b.userId === MOCK_USER_ID && (month ? b.month === month : true) && (year ? b.year === year : true))
      .map(b => ({...b, plannedAmount: b.plannedAmount / 100, createdAt: new Date(b.createdAt)}))
      .sort((a, b) => (a.year !== b.year) ? a.year - b.year : (a.month !== b.month) ? a.month - b.month : a.subCategoryId.localeCompare(b.subCategoryId));
  };

  if (error) {
    console.error(`getBudgets: API call resulted in error (Status: ${error.status}, Message: ${error.message}). Falling back to mock data.`);
    return mockFallback();
  }
  if (resultData === null) {
    console.info(`getBudgets: API call returned null data (e.g. 204 No Content or fetch failure). Returning empty list.`);
    return [];
  }
  try {
    let actualDataArray = resultData;
    if (typeof resultData === 'object' && !Array.isArray(resultData)) {
      if (resultData.budgets && Array.isArray(resultData.budgets)) {
        actualDataArray = resultData.budgets;
      } else if (resultData.data && Array.isArray(resultData.data)) { // Common wrapper
        actualDataArray = resultData.data;
      } else {
        console.warn(`getBudgets: API returned object but not a recognized list wrapper. Data:`, resultData);
        return [];
      }
    }

    if (!Array.isArray(actualDataArray)) {
      console.warn(`getBudgets: API returned non-array data. Type: ${typeof actualDataArray}, Data: ${JSON.stringify(actualDataArray)}. Returning empty array.`);
      return [];
    }
    return (actualDataArray as any[]).map(b => ({...b, plannedAmount: b.plannedAmount / 100, createdAt: new Date(b.createdAt)}))
                                 .sort((a: Budget, b: Budget) => (a.year !== b.year) ? a.year - b.year : (a.month !== b.month) ? a.month - b.month : a.subCategoryId.localeCompare(b.subCategoryId));
  } catch (processingError: any) {
     console.error(`getBudgets: Error processing data from API (Error: ${processingError.message}). Falling back to mock data.`);
    return mockFallback();
  }
}

export async function createBudget(data: Omit<Budget, 'id' | 'userId' | 'createdAt'>): Promise<Budget> {
  const payload = { ...data, plannedAmount: Math.round(data.plannedAmount * 100) };
  const {data: resultData, error} = await fetchAPI(API_BUDGETS, {method: 'POST', body: JSON.stringify(payload)});
  if (error || !resultData) {
     console.error('Failed to create budget via API:', error?.message);
     throw new Error(error?.message || "API Error creating budget");
  }
  revalidatePath('/budgets');
  return {...resultData, plannedAmount: resultData.plannedAmount / 100, createdAt: new Date(resultData.createdAt)} as Budget;
}

export async function updateBudget(id: string, data: Partial<Omit<Budget, 'id' | 'userId' | 'createdAt'>>): Promise<Budget | null> {
  const payload = { ...data };
  if (typeof payload.plannedAmount === 'number') {
    payload.plannedAmount = Math.round(payload.plannedAmount * 100);
  }
  const {data: resultData, error} = await fetchAPI(API_BUDGETS_ID(id), {method: 'PUT', body: JSON.stringify(payload)});
  if (error) {
    console.error('Failed to update budget via API:', error.message);
    return null;
  }
  revalidatePath('/budgets');
  return resultData ? {...resultData, plannedAmount: resultData.plannedAmount / 100, createdAt: new Date(resultData.createdAt)} as Budget | null : null;
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await fetchAPI(API_BUDGETS_ID(id), {method: 'DELETE'});
  if (error) {
    console.error('Failed to delete budget via API:', error.message);
    throw new Error(error.message);
  }
  revalidatePath('/budgets');
}

// --- Shared Capital Actions ---
export async function getSharedCapitalSession(): Promise<SharedCapitalSession | null> {
  const {data: resultData, error} = await fetchAPI(API_SHARED_CAPITAL_SESSION);
  if (error) {
     console.warn(`getSharedCapitalSession: API call failed (Error: ${error?.message}). Mock DB has no active session.`);
     return null; // Return null if API call failed
  }
  if (!resultData) return null;
  try {
      return {...resultData, createdAt: new Date(resultData.createdAt), updatedAt: new Date(resultData.updatedAt)} as SharedCapitalSession;
  } catch(e) {
      console.error("Error processing shared capital session data", e);
      return null;
  }
}

export async function startSharedCapitalSession(partnerEmail: string): Promise<SharedCapitalSession> {
  const {data: resultData, error} = await fetchAPI(API_SHARED_CAPITAL_SESSION, {method: 'POST', body: JSON.stringify({partnerEmail})});
  if (error || !resultData) {
    console.error('Failed to start shared capital session via API:', error?.message);
    throw new Error(error?.message || "API Error starting session");
  }
  revalidatePath('/capital');
  return {...resultData, createdAt: new Date(resultData.createdAt), updatedAt: new Date(resultData.updatedAt)} as SharedCapitalSession;
}

export async function stopSharedCapitalSession(): Promise<SharedCapitalSession | null> {
   const {data: resultData, error} = await fetchAPI(API_SHARED_CAPITAL_SESSION, {method: 'DELETE'});
   if (error) {
    console.error('Failed to stop shared capital session via API:', error.message);
    return null;
  }
  revalidatePath('/capital');
  return resultData ? {...resultData, createdAt: new Date(resultData.createdAt), updatedAt: new Date(resultData.updatedAt)} as SharedCapitalSession : null;
}

// --- Feedback Actions ---
export async function getFeedbacks(): Promise<FeedbackItem[]> {
  const MOCK_USER_ID = (await getCurrentUser())?.id || 'user-123';
  const { data: resultData, error } = await fetchAPI(API_FEEDBACKS);

  const mockFallback = async (): Promise<FeedbackItem[]> => {
    console.warn(`getFeedbacks: API call failed or returned unexpected data. Falling back to mock data.`);
    return MOCK_DB.feedbacks
        .filter(f => f.userId === MOCK_USER_ID)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  if (error) {
    console.error(`getFeedbacks: API call resulted in error (Status: ${error.status}, Message: ${error.message}). Falling back to mock data.`);
    return mockFallback();
  }
  if (resultData === null) {
    console.info(`getFeedbacks: API call returned null data (e.g. 204 No Content or fetch failure). Returning empty list.`);
    return [];
  }
  try {
      let actualDataArray = resultData;
      if (typeof resultData === 'object' && !Array.isArray(resultData)) {
        if (resultData.feedbacks && Array.isArray(resultData.feedbacks)) {
          actualDataArray = resultData.feedbacks;
        } else if (resultData.data && Array.isArray(resultData.data)) { // Common wrapper
          actualDataArray = resultData.data;
        } else {
            console.warn(`getFeedbacks: API returned object but not a recognized list wrapper. Data:`, resultData);
            return [];
        }
      }

      if (!Array.isArray(actualDataArray)) {
        console.warn(`getFeedbacks: API returned non-array data. Type: ${typeof actualDataArray}, Data: ${JSON.stringify(actualDataArray)}. Returning empty array.`);
        return [];
      }
      return (actualDataArray as any[]).map(f => ({...f, createdAt: new Date(f.createdAt)}))
                                   .sort((a:FeedbackItem, b:FeedbackItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch(processingError: any) {
      console.error(`getFeedbacks: Error processing API data (Error: ${processingError.message}). Falling back to mock data.`);
      return mockFallback();
  }
}

export async function addFeedback(
  feedbackData: Omit<FeedbackItem, 'id' | 'userId' | 'createdAt' | 'status'>
): Promise<FeedbackItem> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("User not authenticated to submit feedback.");
  }
  const {data: resultData, error} = await fetchAPI(API_FEEDBACKS, {method: 'POST', body: JSON.stringify(feedbackData)});
  if (error || !resultData) {
    console.error('Failed to add feedback via API:', error?.message);
    throw new Error(error?.message || "API Error submitting feedback");
  }
  revalidatePath('/view-feedback');
  return {...resultData, createdAt: new Date(resultData.createdAt)} as FeedbackItem;
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<FeedbackItem | null> {
  const {data: resultData, error} = await fetchAPI(API_FEEDBACKS_ID_STATUS(id), {method: 'PUT', body: JSON.stringify({status})});
  if (error) {
    console.error(`Failed to update feedback status for ${id} via API:`, error.message);
    return null;
  }
  revalidatePath('/view-feedback');
  return resultData ? {...resultData, createdAt: new Date(resultData.createdAt)} as FeedbackItem : null;
}

// --- Locale Actions ---
export async function setLocaleCookie(locale: string, currentPath: string) {
  const cookieStore = nextCookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: 'lax',
  });
  revalidatePath(currentPath);
  revalidatePath('/', 'layout');
}


// Helper to reset DB for testing if needed - not for production
export async function resetMockDb(initialDbState: MockDb): Promise<void> {
  _dangerouslyResetMockDbContent(initialDbState);
}

// Helper to format API type names (e.g., BANK_ACCOUNT -> Bank Account)
function formatApiTypeName(apiName: string): string {
  if (!apiName || typeof apiName !== 'string') return 'Unknown';
  return apiName
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// --- Wallet & Transaction Type Fetching ---
export async function getWalletTypes(): Promise<WalletType[]> {
  const { data, error } = await fetchAPI(API_WALLET_TYPES);
  const defaultTypes: WalletType[] = ['Cash', 'Bank Account', 'Credit Card', 'E-Wallet'];
  if (error || !data) {
    console.warn('Failed to fetch wallet types from API, returning default types:', error?.message);
    return defaultTypes;
  }
  try {
    let typesObject;
    if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0].types === 'object') {
      typesObject = data[0].types;
    } else if (typeof data === 'object' && data !== null && data.types && typeof data.types === 'object') {
      typesObject = data.types;
    } else if (Array.isArray(data) && data.every(item => typeof item === 'string')) { // Fallback for simple array of strings
      return data.map(formatApiTypeName) as WalletType[];
    }

    if (typesObject) {
      const typeKeys = Object.keys(typesObject);
      return typeKeys.map(formatApiTypeName) as WalletType[];
    }
    console.warn('Wallet types API response format not recognized, returning default types.', data);
    return defaultTypes;
  } catch (e) {
    console.error('Error processing wallet types from API:', e);
    return defaultTypes;
  }
}

export async function getTransactionTypes(): Promise<TransactionType[]> {
  const { data, error } = await fetchAPI(API_TRANSACTION_TYPES);
  const defaultTypes: TransactionType[] = ['Income', 'Expense'];
  if (error || !data) {
    console.warn('Failed to fetch transaction types from API, returning default types:', error?.message);
    return defaultTypes;
  }
  try {
    let typesObject;
    if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0].types === 'object') {
       typesObject = data[0].types;
    } else if (typeof data === 'object' && data !== null && data.types && typeof data.types === 'object') {
       typesObject = data.types;
    } else if (Array.isArray(data) && data.every(item => typeof item === 'string')) { // Fallback for simple array of strings
      return (data as string[])
        .map(formatApiTypeName)
        .filter(type => type === 'Income' || type === 'Expense') as TransactionType[];
    }

    if (typesObject) {
       const typeKeys = Object.keys(typesObject);
        return typeKeys
          .map(formatApiTypeName)
          .filter(type => type === 'Income' || type === 'Expense') as TransactionType[];
    }
    console.warn('Transaction types API response format not recognized, returning default types.', data);
    return defaultTypes;
  } catch (e) {
    console.error('Error processing transaction types from API:', e);
    return defaultTypes;
  }
}

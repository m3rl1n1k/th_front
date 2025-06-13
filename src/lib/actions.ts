
'use server';
import type { MainCategory, SubCategory, Transaction, Wallet, Transfer, MockDb, User, UserSettings } from './definitions';
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
  ],
  subCategories: [
    { id: 'sc1', userId: 'user-123', mainCategoryId: 'mc1', name: 'Groceries', color: '#FFA07A' },
    { id: 'sc2', userId: 'user-123', mainCategoryId: 'mc1', name: 'Restaurants', color: '#FA8072' },
    { id: 'sc3', userId: 'user-123', mainCategoryId: 'mc2', name: 'Gas', color: '#B0C4DE' },
  ],
  wallets: [
    { id: 'w1', userId: 'user-123', name: 'Main Bank', currency: 'USD', initialAmount: 5000, type: 'Bank Account' },
    { id: 'w2', userId: 'user-123', name: 'Cash', currency: 'USD', initialAmount: 300, type: 'Cash' },
  ],
  transactions: [
    { id: 't1', userId: 'user-123', subCategoryId: 'sc1', walletId: 'w1', type: 'Expense', frequency: 'One-time', amount: 55.75, createdAt: new Date('2023-10-01'), description: 'Weekly groceries' },
    { id: 't2', userId: 'user-123', subCategoryId: 'sc3', walletId: 'w2', type: 'Expense', frequency: 'One-time', amount: 40.00, createdAt: new Date('2023-10-03'), description: 'Fuel' },
    { id: 't3', userId: 'user-123', subCategoryId: 'sc2', walletId: 'w1', type: 'Income', frequency: 'Monthly', amount: 3000.00, createdAt: new Date('2023-10-05'), description: 'Salary' },
  ],
  transfers: [
    { id: 'tr1', userId: 'user-123', fromWalletId: 'w1', toWalletId: 'w2', amount: 100, createdAt: new Date('2023-10-02'), description: 'ATM Withdrawal' }
  ],
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
  
  // If your API needs userId in the body or as a query param, add it here
  // For example, if options.body is an object:
  // if (currentUser && options.body && typeof options.body === 'string') {
  //   try {
  //     const body = JSON.parse(options.body);
  //     body.userId = currentUser.id;
  //     options.body = JSON.stringify(body);
  //   } catch (e) { /* ignore */ }
  // }


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
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return undefined;
  // const user = MOCK_DB.users.find(u => u.id === MOCK_USER_ID);
  // return user?.settings;
  
  // TODO: USER: Replace with API call
  try {
    // Assuming user settings are part of the user object or a separate endpoint
    // This example assumes it's part of the user object fetched via /auth/me or similar
    const user = await getCurrentUser(); // This might internally call an API
    return user?.settings;
  } catch (error) {
    console.error('Failed to fetch user settings:', error);
    // Fallback to mock or default if API fails and you want graceful degradation
    const MOCK_USER_ID = 'user-123';
    const user = MOCK_DB.users.find(u => u.id === MOCK_USER_ID);
    return user?.settings;
  }
}

export async function updateUserSettings(newSettings: Partial<UserSettings>): Promise<User | null> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return null;
  // const userIndex = MOCK_DB.users.findIndex(u => u.id === MOCK_USER_ID);
  // if (userIndex === -1) return null;

  // MOCK_DB.users[userIndex].settings = {
  //   ...MOCK_DB.users[userIndex].settings,
  //   ...newSettings,
  // } as UserSettings; 
  // revalidatePath('/settings');
  // revalidatePath('/transactions'); 
  // return MOCK_DB.users[userIndex];

  // TODO: USER: Replace with API call
  try {
    const updatedUser = await fetchAPI('/users/settings', { // Replace with your endpoint
      method: 'PATCH', // or PUT
      body: JSON.stringify(newSettings),
    });
    revalidatePath('/settings');
    revalidatePath('/transactions');
    return updatedUser;
  } catch (error) {
    console.error('Failed to update user settings:', error);
    throw error; // Re-throw or handle as needed
  }
}

// --- User Profile Actions ---
export async function updateUserProfile(userId: string, data: { name?: string }): Promise<User | null> {
  // const userIndex = MOCK_DB.users.findIndex(u => u.id === userId);
  // if (userIndex === -1) {
  //   console.error(`User with id ${userId} not found for profile update.`);
  //   return null;
  // }
  // let updated = false;
  // if (data.name !== undefined && MOCK_DB.users[userIndex].name !== data.name) {
  //   MOCK_DB.users[userIndex].name = data.name;
  //   updated = true;
  // }
  // if (updated) {
  //   const currentUser = await getCurrentUser();
  //   if (currentUser && currentUser.id === userId) {
  //     currentUser.name = data.name; 
  //   }
  //   revalidatePath('/profile');
  //   revalidatePath('/(app)/layout', 'layout');
  // }
  // return MOCK_DB.users[userIndex];

  // TODO: USER: Replace with API call
  try {
    // Assuming your API uses the userId in the URL or gets it from the token
    const updatedUser = await fetchAPI(`/users/${userId}/profile`, { // Replace with your endpoint
      method: 'PATCH', // or PUT
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
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return [];
  // return MOCK_DB.mainCategories.filter(mc => mc.userId === MOCK_USER_ID);

  // TODO: USER: Replace with API call
  try {
    return await fetchAPI('/main-categories'); // Replace with your endpoint
  } catch (error) {
    console.error('Failed to fetch main categories:', error);
    return MOCK_DB.mainCategories.filter(mc => mc.userId === 'user-123'); // Fallback to mock
  }
}

export async function createMainCategory(data: Omit<MainCategory, 'id' | 'userId'>): Promise<MainCategory> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) throw new Error("User not authenticated");
  // const newCategory: MainCategory = { ...data, id: `mc${Date.now()}`, userId: MOCK_USER_ID };
  // MOCK_DB.mainCategories.push(newCategory);
  // revalidatePath('/categories');
  // return newCategory;

  // TODO: USER: Replace with API call
  try {
    const newCategory = await fetchAPI('/main-categories', { // Replace with your endpoint
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
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return null;
  // const index = MOCK_DB.mainCategories.findIndex(mc => mc.id === id && mc.userId === MOCK_USER_ID);
  // if (index === -1) return null;
  // MOCK_DB.mainCategories[index] = { ...MOCK_DB.mainCategories[index], ...data };
  // revalidatePath('/categories');
  // return MOCK_DB.mainCategories[index];

  // TODO: USER: Replace with API call
  try {
    const updatedCategory = await fetchAPI(`/main-categories/${id}`, { // Replace with your endpoint
      method: 'PATCH', // or PUT
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
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return;
  // MOCK_DB.mainCategories = MOCK_DB.mainCategories.filter(mc => mc.id !== id || mc.userId !== MOCK_USER_ID);
  // MOCK_DB.subCategories = MOCK_DB.subCategories.filter(sc => sc.mainCategoryId !== id || sc.userId !== MOCK_USER_ID);
  // revalidatePath('/categories');

  // TODO: USER: Replace with API call
  try {
    await fetchAPI(`/main-categories/${id}`, { method: 'DELETE' }); // Replace with your endpoint
    revalidatePath('/categories');
  } catch (error) {
    console.error('Failed to delete main category:', error);
    throw error;
  }
}

// --- Sub Category Actions ---
export async function getSubCategories(mainCategoryId?: string): Promise<SubCategory[]> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return [];
  // let categories = MOCK_DB.subCategories.filter(sc => sc.userId === MOCK_USER_ID);
  // if (mainCategoryId) {
  //   categories = categories.filter(sc => sc.mainCategoryId === mainCategoryId);
  // }
  // return categories;
  
  // TODO: USER: Replace with API call
  try {
    let endpoint = '/sub-categories';
    if (mainCategoryId) {
      endpoint += `?mainCategoryId=${mainCategoryId}`; // Adjust query param as needed
    }
    return await fetchAPI(endpoint); // Replace with your endpoint
  } catch (error) {
    console.error('Failed to fetch sub categories:', error);
    return MOCK_DB.subCategories.filter(sc => sc.userId === 'user-123'); // Fallback
  }
}

export async function createSubCategory(data: Omit<SubCategory, 'id' | 'userId'>): Promise<SubCategory> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) throw new Error("User not authenticated");
  // const newCategory: SubCategory = { ...data, id: `sc${Date.now()}`, userId: MOCK_USER_ID };
  // MOCK_DB.subCategories.push(newCategory);
  // revalidatePath('/categories');
  // return newCategory;

  // TODO: USER: Replace with API call
  try {
    const newCategory = await fetchAPI('/sub-categories', { // Replace with your endpoint
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
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return null;
  // const index = MOCK_DB.subCategories.findIndex(sc => sc.id === id && sc.userId === MOCK_USER_ID);
  // if (index === -1) return null;
  // MOCK_DB.subCategories[index] = { ...MOCK_DB.subCategories[index], ...data };
  // revalidatePath('/categories');
  // return MOCK_DB.subCategories[index];

  // TODO: USER: Replace with API call
  try {
    const updatedCategory = await fetchAPI(`/sub-categories/${id}`, { // Replace with your endpoint
      method: 'PATCH', // or PUT
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
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return;
  // MOCK_DB.subCategories = MOCK_DB.subCategories.filter(sc => sc.id !== id || sc.userId !== MOCK_USER_ID);
  // revalidatePath('/categories');

  // TODO: USER: Replace with API call
  try {
    await fetchAPI(`/sub-categories/${id}`, { method: 'DELETE' }); // Replace with your endpoint
    revalidatePath('/categories');
  } catch (error) {
    console.error('Failed to delete sub category:', error);
    throw error;
  }
}


// --- Wallet Actions ---
export async function getWallets(): Promise<Wallet[]> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return [];
  // return MOCK_DB.wallets.filter(w => w.userId === MOCK_USER_ID);

  // TODO: USER: Replace with API call
  try {
    const wallets = await fetchAPI('/wallets'); // Replace '/wallets' with your actual endpoint
    return wallets;
  } catch (error) {
    console.error('Failed to fetch wallets:', error);
    // Fallback to mock data or empty array if API fails
    return MOCK_DB.wallets.filter(w => w.userId === 'user-123');
  }
}

export async function createWallet(data: Omit<Wallet, 'id' | 'userId'>): Promise<Wallet> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) throw new Error("User not authenticated");
  // const newWallet: Wallet = { ...data, id: `w${Date.now()}`, userId: MOCK_USER_ID };
  // MOCK_DB.wallets.push(newWallet);
  // revalidatePath('/wallets');
  // return newWallet;

  // TODO: USER: Replace with API call
  try {
    const newWallet = await fetchAPI('/wallets', { // Replace with your endpoint
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/wallets');
    return newWallet;
  } catch (error) {
    console.error('Failed to create wallet:', error);
    throw error;
  }
}

export async function updateWallet(id: string, data: Partial<Omit<Wallet, 'id' | 'userId'>>): Promise<Wallet | null> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return null;
  // const index = MOCK_DB.wallets.findIndex(w => w.id === id && w.userId === MOCK_USER_ID);
  // if (index === -1) return null;
  // MOCK_DB.wallets[index] = { ...MOCK_DB.wallets[index], ...data };
  // revalidatePath('/wallets');
  // return MOCK_DB.wallets[index];

  // TODO: USER: Replace with API call
  try {
    const updatedWallet = await fetchAPI(`/wallets/${id}`, { // Replace with your endpoint
      method: 'PATCH', // or PUT
      body: JSON.stringify(data),
    });
    revalidatePath('/wallets');
    return updatedWallet;
  } catch (error) {
    console.error('Failed to update wallet:', error);
    throw error;
  }
}

export async function deleteWallet(id: string): Promise<void> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return;
  // MOCK_DB.wallets = MOCK_DB.wallets.filter(w => w.id !== id || w.userId !== MOCK_USER_ID);
  // revalidatePath('/wallets');

  // TODO: USER: Replace with API call
  try {
    await fetchAPI(`/wallets/${id}`, { method: 'DELETE' }); // Replace with your endpoint
    revalidatePath('/wallets');
  } catch (error) {
    console.error('Failed to delete wallet:', error);
    throw error;
  }
}


// --- Transaction Actions ---
export async function getTransactions(): Promise<Transaction[]> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return [];
  // return MOCK_DB.transactions.filter(t => t.userId === MOCK_USER_ID).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  // TODO: USER: Replace with API call
  try {
    const transactions = await fetchAPI('/transactions'); // Replace with your endpoint
    // Ensure createdAt is a Date object if your API returns strings
    return transactions.map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }))
                       .sort((a: Transaction, b: Transaction) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return MOCK_DB.transactions.filter(t => t.userId === 'user-123').sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()); // Fallback
  }
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'userId'>): Promise<Transaction> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) throw new Error("User not authenticated");
  // const newTransaction: Transaction = { ...data, id: `t${Date.now()}`, userId: MOCK_USER_ID };
  // MOCK_DB.transactions.push(newTransaction);
  // revalidatePath('/transactions');
  // return newTransaction;

  // TODO: USER: Replace with API call
  try {
    const newTransaction = await fetchAPI('/transactions', { // Replace with your endpoint
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/transactions');
    return { ...newTransaction, createdAt: new Date(newTransaction.createdAt) };
  } catch (error) {
    console.error('Failed to create transaction:', error);
    throw error;
  }
}

export async function updateTransaction(id: string, data: Partial<Omit<Transaction, 'id' | 'userId'>>): Promise<Transaction | null> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return null;
  // const index = MOCK_DB.transactions.findIndex(t => t.id === id && t.userId === MOCK_USER_ID);
  // if (index === -1) return null;
  // MOCK_DB.transactions[index] = { ...MOCK_DB.transactions[index], ...data };
  // revalidatePath('/transactions');
  // return MOCK_DB.transactions[index];

  // TODO: USER: Replace with API call
  try {
    const updatedTransaction = await fetchAPI(`/transactions/${id}`, { // Replace with your endpoint
      method: 'PATCH', // or PUT
      body: JSON.stringify(data),
    });
    revalidatePath('/transactions');
    return { ...updatedTransaction, createdAt: new Date(updatedTransaction.createdAt) };
  } catch (error) {
    console.error('Failed to update transaction:', error);
    throw error;
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return;
  // MOCK_DB.transactions = MOCK_DB.transactions.filter(t => t.id !== id || t.userId !== MOCK_USER_ID);
  // revalidatePath('/transactions');

  // TODO: USER: Replace with API call
  try {
    await fetchAPI(`/transactions/${id}`, { method: 'DELETE' }); // Replace with your endpoint
    revalidatePath('/transactions');
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    throw error;
  }
}

// --- Transfer Actions ---
export async function getTransfers(): Promise<Transfer[]> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return [];
  // return MOCK_DB.transfers.filter(t => t.userId === MOCK_USER_ID).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());

  // TODO: USER: Replace with API call
  try {
    const transfers = await fetchAPI('/transfers'); // Replace with your endpoint
    return transfers.map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }))
                     .sort((a: Transfer,b: Transfer) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Failed to fetch transfers:', error);
    return MOCK_DB.transfers.filter(t => t.userId === 'user-123').sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()); // Fallback
  }
}

export async function createTransfer(data: Omit<Transfer, 'id' | 'userId'>): Promise<Transfer> {
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) throw new Error("User not authenticated");
  // const newTransfer: Transfer = { ...data, id: `tr${Date.now()}`, userId: MOCK_USER_ID };
  // MOCK_DB.transfers.push(newTransfer);
  // revalidatePath('/transfers');
  // return newTransfer;

  // TODO: USER: Replace with API call
  try {
    const newTransfer = await fetchAPI('/transfers', { // Replace with your endpoint
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
  // const MOCK_USER_ID = (await getCurrentUser())?.id;
  // if (!MOCK_USER_ID) return;
  // MOCK_DB.transfers = MOCK_DB.transfers.filter(t => t.id !== id || t.userId !== MOCK_USER_ID);
  // revalidatePath('/transfers');

  // TODO: USER: Replace with API call
  try {
    await fetchAPI(`/transfers/${id}`, { method: 'DELETE' }); // Replace with your endpoint
    revalidatePath('/transfers');
  } catch (error) {
    console.error('Failed to delete transfer:', error);
    throw error;
  }
}

// Helper to reset DB for testing if needed - not for production
export async function resetMockDb(initialDbState: MockDb): Promise<void> {
  MOCK_DB = JSON.parse(JSON.stringify(initialDbState)); // Deep copy to avoid reference issues
}

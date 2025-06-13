
'use server';
import type { MainCategory, SubCategory, Transaction, Wallet, Transfer, MockDb, User, UserSettings } from './definitions';
import { revalidatePath } from 'next/cache';

// In-memory store for mock data
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

const MOCK_USER_ID = 'user-123'; // Assume all operations are for this user

// --- User Settings Actions ---
export async function getUserSettings(): Promise<UserSettings | undefined> {
  const user = MOCK_DB.users.find(u => u.id === MOCK_USER_ID);
  return user?.settings;
}

export async function updateUserSettings(newSettings: Partial<UserSettings>): Promise<User | null> {
  const userIndex = MOCK_DB.users.findIndex(u => u.id === MOCK_USER_ID);
  if (userIndex === -1) return null;

  MOCK_DB.users[userIndex].settings = {
    ...MOCK_DB.users[userIndex].settings,
    ...newSettings,
  } as UserSettings; // Ensure settings is not undefined after partial update

  revalidatePath('/settings');
  revalidatePath('/transactions'); // Revalidate transactions page as it will use this setting
  return MOCK_DB.users[userIndex];
}


// --- Main Category Actions ---
export async function getMainCategories(): Promise<MainCategory[]> {
  return MOCK_DB.mainCategories.filter(mc => mc.userId === MOCK_USER_ID);
}

export async function createMainCategory(data: Omit<MainCategory, 'id' | 'userId'>): Promise<MainCategory> {
  const newCategory: MainCategory = { ...data, id: `mc${Date.now()}`, userId: MOCK_USER_ID };
  MOCK_DB.mainCategories.push(newCategory);
  revalidatePath('/categories');
  return newCategory;
}

export async function updateMainCategory(id: string, data: Partial<Omit<MainCategory, 'id' | 'userId'>>): Promise<MainCategory | null> {
  const index = MOCK_DB.mainCategories.findIndex(mc => mc.id === id && mc.userId === MOCK_USER_ID);
  if (index === -1) return null;
  MOCK_DB.mainCategories[index] = { ...MOCK_DB.mainCategories[index], ...data };
  revalidatePath('/categories');
  return MOCK_DB.mainCategories[index];
}

export async function deleteMainCategory(id: string): Promise<void> {
  MOCK_DB.mainCategories = MOCK_DB.mainCategories.filter(mc => mc.id !== id || mc.userId !== MOCK_USER_ID);
  // Also delete associated subcategories
  MOCK_DB.subCategories = MOCK_DB.subCategories.filter(sc => sc.mainCategoryId !== id || sc.userId !== MOCK_USER_ID);
  revalidatePath('/categories');
}

// --- Sub Category Actions ---
export async function getSubCategories(mainCategoryId?: string): Promise<SubCategory[]> {
  let categories = MOCK_DB.subCategories.filter(sc => sc.userId === MOCK_USER_ID);
  if (mainCategoryId) {
    categories = categories.filter(sc => sc.mainCategoryId === mainCategoryId);
  }
  return categories;
}

export async function createSubCategory(data: Omit<SubCategory, 'id' | 'userId'>): Promise<SubCategory> {
  const newCategory: SubCategory = { ...data, id: `sc${Date.now()}`, userId: MOCK_USER_ID };
  MOCK_DB.subCategories.push(newCategory);
  revalidatePath('/categories');
  return newCategory;
}

export async function updateSubCategory(id: string, data: Partial<Omit<SubCategory, 'id' | 'userId'>>): Promise<SubCategory | null> {
  const index = MOCK_DB.subCategories.findIndex(sc => sc.id === id && sc.userId === MOCK_USER_ID);
  if (index === -1) return null;
  MOCK_DB.subCategories[index] = { ...MOCK_DB.subCategories[index], ...data };
  revalidatePath('/categories');
  return MOCK_DB.subCategories[index];
}

export async function deleteSubCategory(id: string): Promise<void> {
  MOCK_DB.subCategories = MOCK_DB.subCategories.filter(sc => sc.id !== id || sc.userId !== MOCK_USER_ID);
  revalidatePath('/categories');
}


// --- Wallet Actions ---
export async function getWallets(): Promise<Wallet[]> {
  return MOCK_DB.wallets.filter(w => w.userId === MOCK_USER_ID);
}

export async function createWallet(data: Omit<Wallet, 'id' | 'userId'>): Promise<Wallet> {
  const newWallet: Wallet = { ...data, id: `w${Date.now()}`, userId: MOCK_USER_ID };
  MOCK_DB.wallets.push(newWallet);
  revalidatePath('/wallets');
  return newWallet;
}

export async function updateWallet(id: string, data: Partial<Omit<Wallet, 'id' | 'userId'>>): Promise<Wallet | null> {
  const index = MOCK_DB.wallets.findIndex(w => w.id === id && w.userId === MOCK_USER_ID);
  if (index === -1) return null;
  MOCK_DB.wallets[index] = { ...MOCK_DB.wallets[index], ...data };
  revalidatePath('/wallets');
  return MOCK_DB.wallets[index];
}

export async function deleteWallet(id: string): Promise<void> {
  MOCK_DB.wallets = MOCK_DB.wallets.filter(w => w.id !== id || w.userId !== MOCK_USER_ID);
  // Consider implications for transactions/transfers linked to this wallet
  revalidatePath('/wallets');
}


// --- Transaction Actions ---
export async function getTransactions(): Promise<Transaction[]> {
  return MOCK_DB.transactions.filter(t => t.userId === MOCK_USER_ID).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'userId'>): Promise<Transaction> {
  const newTransaction: Transaction = { ...data, id: `t${Date.now()}`, userId: MOCK_USER_ID };
  MOCK_DB.transactions.push(newTransaction);
  revalidatePath('/transactions');
  return newTransaction;
}

export async function updateTransaction(id: string, data: Partial<Omit<Transaction, 'id' | 'userId'>>): Promise<Transaction | null> {
  const index = MOCK_DB.transactions.findIndex(t => t.id === id && t.userId === MOCK_USER_ID);
  if (index === -1) return null;
  MOCK_DB.transactions[index] = { ...MOCK_DB.transactions[index], ...data };
  revalidatePath('/transactions');
  return MOCK_DB.transactions[index];
}

export async function deleteTransaction(id: string): Promise<void> {
  MOCK_DB.transactions = MOCK_DB.transactions.filter(t => t.id !== id || t.userId !== MOCK_USER_ID);
  revalidatePath('/transactions');
}

// --- Transfer Actions ---
export async function getTransfers(): Promise<Transfer[]> {
  return MOCK_DB.transfers.filter(t => t.userId === MOCK_USER_ID).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createTransfer(data: Omit<Transfer, 'id' | 'userId'>): Promise<Transfer> {
  const newTransfer: Transfer = { ...data, id: `tr${Date.now()}`, userId: MOCK_USER_ID };
  MOCK_DB.transfers.push(newTransfer);
  revalidatePath('/transfers');
  // In a real app, you'd also update wallet balances here
  return newTransfer;
}

export async function deleteTransfer(id: string): Promise<void> {
  MOCK_DB.transfers = MOCK_DB.transfers.filter(t => t.id !== id || t.userId !== MOCK_USER_ID);
  revalidatePath('/transfers');
  // In a real app, you'd also revert wallet balance changes here
}

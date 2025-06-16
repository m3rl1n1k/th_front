
// All API endpoints used in the application

// Replace with your actual backend base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export const URLS = {
  // Auth
  login: `${API_BASE_URL}/login_check`,
  logout: `${API_BASE_URL}/auth/logout`,
  me: `${API_BASE_URL}/user`,

  // Dashboard
  dashboardTotalBalance: `${API_BASE_URL}/dashboard/total-balance`,
  dashboardMonthlyIncome: `${API_BASE_URL}/dashboard/monthly-income`,
  dashboardMonthExpenses: `${API_BASE_URL}/dashboard/average-expenses`,
  dashboardMonthlyExpensesByCategory: `${API_BASE_URL}/dashboard/monthly-expenses-by-category`,


  // Transactions
  transactions: `${API_BASE_URL}/transactions`,
  transactionById: (id: string | number) => `${API_BASE_URL}/transactions/${id}`,
  transactionTypes: `${API_BASE_URL}/transactions/types`,
  transactionFrequencies: `${API_BASE_URL}/transactions/frequency`,
  transactionCategoriesFlat: `${API_BASE_URL}/transactions/categories`, // Deprecated or for specific use


  // Repeated Transactions (New)
  repeatedTransactionsList: `${API_BASE_URL}/repeated-transactions`,
  repeatedTransactionById: (id: string | number) => `${API_BASE_URL}/transactions/repeated/${id}`,
  toggleRepeatedTransactionStatus: (id: string | number) => `${API_BASE_URL}/transactions/repeated/${id}/status/toggle`,


  // User Profile
  userProfile: `${API_BASE_URL}/profile`, // Assuming this is GET /users/me from docs, or a specific /profile if exists

  // Wallets
  wallets: `${API_BASE_URL}/wallets`,
  walletTypes: `${API_BASE_URL}/wallets/types`,

  // Categories Page & Management
  mainCategories: `${API_BASE_URL}/main/categories`, // GET main categories (hierarchical)
  createMainCategory: `${API_BASE_URL}/main/categories`, // POST new main category
  createSubCategory: (mainCategoryId: string | number) => `${API_BASE_URL}/main/categories/${mainCategoryId}/subcategories`,
};


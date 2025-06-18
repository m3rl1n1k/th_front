
// All API endpoints used in the application

// Replace with your actual backend base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export const URLS = {
  // Auth
  login: `${API_BASE_URL}/login_check`,
  register: `${API_BASE_URL}/auth/register`,
  logout: `${API_BASE_URL}/auth/logout`,
  me: `${API_BASE_URL}/user`,

  // Dashboard
  dashboardTotalBalance: `${API_BASE_URL}/dashboard/total-balance`,
  dashboardMonthlyIncome: `${API_BASE_URL}/dashboard/monthly-income`,
  dashboardMonthExpenses: `${API_BASE_URL}/dashboard/average-expenses`,
  dashboardChartTotalExpense: `${API_BASE_URL}/dashboard/chart/total-expense`,
  dashboardLastTransactions: (limit: number) => `${API_BASE_URL}/dashboard/last-transactions/${limit}`,


  // Transactions
  transactions: `${API_BASE_URL}/transactions`,
  transactionById: (id: string | number) => `${API_BASE_URL}/transactions/${id}`,
  transactionTypes: `${API_BASE_URL}/transactions/types`,
  transactionFrequencies: `${API_BASE_URL}/transactions/frequency`,


  // Repeated Transactions
  repeatedTransactionsList: `${API_BASE_URL}/repeated-transactions`,
  toggleRepeatedTransactionStatus: (id: string | number) => `${API_BASE_URL}/transactions/repeated/${id}/status/toggle`,
  deleteRepeatedTransaction: (id: string | number) => `${API_BASE_URL}/transactions/repeated/${id}`,


  // User Profile
  userProfile: `${API_BASE_URL}/user`,
  changePassword: `${API_BASE_URL}/user/change-password`, // New endpoint

  // Wallets
  wallets: `${API_BASE_URL}/wallets`,
  walletById: (id: string | number) => `${API_BASE_URL}/wallets/${id}`,
  createWallet: `${API_BASE_URL}/wallets`,
  walletTypes: `${API_BASE_URL}/wallets/types`,

  // Categories Page & Management
  mainCategories: `${API_BASE_URL}/main/categories`,
  mainCategoryById: (id: string | number) => `${API_BASE_URL}/main/categories/${id}`,
  createMainCategory: `${API_BASE_URL}/main/categories`,
  updateMainCategory: (id: string | number) => `${API_BASE_URL}/main/categories/${id}`,
  deleteMainCategory: (id: string | number) => `${API_BASE_URL}/main/categories/${id}`,

  // SubCategories
  createSubCategory: `${API_BASE_URL}/sub/categories`,
  updateSubCategory: (id: string | number) => `${API_BASE_URL}/sub/categories/${id}`,
  deleteSubCategory: (id: string | number) => `${API_BASE_URL}/sub/categories/${id}`,

  // Transfers
  transferFormData: `${API_BASE_URL}/transfer/form-data`,
  transfersList: `${API_BASE_URL}/transfers`,
  createTransfer: `${API_BASE_URL}/transfers`,
  deleteTransfer: (id: string | number) => `${API_BASE_URL}/transfers/${id}`,

  // General
  currencies: `${API_BASE_URL}/currencies`,

  // Feedback (Mock URLs for now)
  submitFeedback: `${API_BASE_URL}/feedback`, // Example: POST /api/feedback
  getFeedbacks: `${API_BASE_URL}/admin/feedbacks`, // Example: GET /api/admin/feedbacks
};

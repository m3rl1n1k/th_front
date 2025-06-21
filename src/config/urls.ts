
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
  changePassword: `${API_BASE_URL}/user/change-password`,
  userSettings: `${API_BASE_URL}/settings`, // New User Settings URL

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

  // Feedback
  submitFeedback: `${API_BASE_URL}/feedback`,
  getFeedbacks: `${API_BASE_URL}/admin/feedbacks`,

  // Budgets
  getBudgets: `${API_BASE_URL}/budgets`, 
  getBudgetById_DEPRECATED: (id: string | number) => `${API_BASE_URL}/budgets/${id}`, 
  createBudget: `${API_BASE_URL}/budgets`, 
  updateBudget: (date: string, id: string | number) => `${API_BASE_URL}/budgets/summary/${date}/${id}`, 
  deleteBudget: (date: string, id: string | number) => `${API_BASE_URL}/budgets/${date}/${id}`,
  deleteBudgetsForMonth: (monthYear: string) => `${API_BASE_URL}/budgets/${monthYear}`, 
  getBudgetSummaryForMonth: (monthYear: string) => `${API_BASE_URL}/budgets/summary/${monthYear}`,
  getBudgetSummaryItemForEdit: (date: string, id: string | number) => `${API_BASE_URL}/budgets/summary/${date}/${id}`,

  // Capital & Invitations
  createCapital: `${API_BASE_URL}/capitals`,
  getCapitalDetails: (capitalId: string | number) => `${API_BASE_URL}/capital/${capitalId}`,
  deleteCapital: (capitalId: string | number) => `${API_BASE_URL}/capital/${capitalId}`,
  removeUserFromCapital: (userId: string | number) => `${API_BASE_URL}/capital/user/${userId}/remove`, 
  
  getInvitations: `${API_BASE_URL}/invitations`,
  createInvitation: (capitalId: string | number) => `${API_BASE_URL}/capital/${capitalId}/invite`,
  acceptInvitation: (invitationId: string | number) => `${API_BASE_URL}/invitation/${invitationId}/accept`,
  rejectInvitation: (invitationId: string | number) => `${API_BASE_URL}/invitation/${invitationId}/reject`,

  // Reports
  getReportData: (year: number, month: number | string) => `${API_BASE_URL}/report-data?year=${year}&month=${month}`,
};

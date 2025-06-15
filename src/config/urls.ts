
// All API endpoints used in the application

// Replace with your actual backend base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export const URLS = {
  // Auth
  login: `${API_BASE_URL}/auth/login`, // POST { email: string } -> { user: { login: string }, token: string }
  logout: `${API_BASE_URL}/auth/logout`, // POST
  me: `${API_BASE_URL}/users/me`, // GET -> User profile data

  // Dashboard
  dashboardTotalBalance: `${API_BASE_URL}/dashboard/total-balance`, // GET -> { total_balance: number }
  dashboardMonthlyIncome: `${API_BASE_URL}/dashboard/monthly-income`, // GET -> { month_income: number }
  dashboardMonthExpenses: `${API_BASE_URL}/dashboard/average-expenses`, // GET -> { month_expense: number } (assuming this provides total month_expense)


  // Transactions
  transactions: `${API_BASE_URL}/transactions`, // GET (list), POST (create)
  transactionById: (id: string | number) => `${API_BASE_URL}/transactions/${id}`, // GET, PUT, DELETE
  transactionTypes: `${API_BASE_URL}/transactions/types`, // GET -> { types: { [key: string]: string } } Example: { "1": "INCOME", "2": "EXPENSE", "3": "TRANSFER" }

  // User Profile
  userProfile: `${API_BASE_URL}/profile`, // GET, PUT
};


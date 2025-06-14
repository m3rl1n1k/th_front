// src/lib/apiConstants.ts

// Auth
export const API_AUTH_LOGIN = '/auth/login';
export const API_AUTH_ME = '/auth/me';
// If you had a logout endpoint for the API:
// export const API_AUTH_LOGOUT = '/auth/logout';

// User
export const API_USERS_ME_SETTINGS = '/users/me/settings'; // Example, adjust if different
export const API_USERS_ME_PROFILE = '/users/me/profile';   // Example, adjust if different
export const API_USERS_ME_CHANGE_PASSWORD = '/users/me/change-password'; // Example, adjust if different

// Main Categories
export const API_MAIN_CATEGORIES = '/main/categories';
export const API_MAIN_CATEGORIES_ID = (id: string) => `/main/categories/${id}`;

// Sub Categories
export const API_SUB_CATEGORIES = '/sub/categories';
export const API_SUB_CATEGORIES_ID = (id: string) => `/sub/categories/${id}`;

// Wallets
export const API_WALLETS = '/wallets';
export const API_WALLETS_ID = (id: string) => `/wallets/${id}`;

// Transactions
export const API_TRANSACTIONS = '/transactions';
export const API_TRANSACTIONS_ID = (id: string) => `/transactions/${id}`;
export const API_TRANSACTIONS_STOP_RECURRING = (id: string) => `/transactions/${id}/stop-recurring`;

// Transfers
export const API_TRANSFERS = '/transfers';
export const API_TRANSFERS_ID = (id: string) => `/transfers/${id}`;

// Budgets
export const API_BUDGETS = '/budgets';
export const API_BUDGETS_ID = (id: string) => `/budgets/${id}`;

// Shared Capital
export const API_SHARED_CAPITAL_SESSION = '/shared-capital/session';

// Feedback
export const API_FEEDBACKS = '/feedbacks';
export const API_FEEDBACKS_ID_STATUS = (id: string) => `/feedbacks/${id}/status`;

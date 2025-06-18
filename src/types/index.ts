
export interface User {
  id: string | number;
  login: string; // This is the username
  email: string;
  memberSince?: string;
  userCurrency?: {
    code: string;
  };
  roles?: string[];
}

export interface LoginCredentials {
  username: string; // Will contain the email input
  password?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegistrationPayload {
  email: string;
  login: string; // This is the username
  password?: string;
}

export interface RegistrationResponse {
  message?: string;
  user?: User; // Optional: API might return the created user
}

export interface ChangePasswordPayload {
  currentPassword?: string; // Optional in case backend uses session/token to verify user identity primarily
  newPassword: string;
}


export interface TransactionAmount {
  amount: number; // This is in cents from the API
  currency: {
    code: string;
  };
}

export interface TransactionSubCategory {
  id: string | number;
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface TransactionWallet {
  id: string | number;
  name: string;
  number?: string;
}

export interface Transaction {
  id: string | number;
  amount: TransactionAmount;
  currency: {
    code: string;
  };
  exchangeRate: number;
  type: number;
  description: string | null;
  wallet: TransactionWallet;
  subCategory: TransactionSubCategory | null;
  user?: {
    id: string | number;
  };
  source: string | null;
  date: string;
  isRecurring?: boolean;
  frequency?: string; // From API
  frequencyId?: string; // Used internally by form

  typeName?: string;
  categoryName?: string | null;

  walletId?: string;
  categoryId?: string;
}

export interface CreateTransactionPayload {
  amount: number;
  description: string | null;
  typeId: string;
  date: string;
  wallet_id: number;
  category_id: number | null;
  frequencyId: string;
}

export interface UpdateTransactionPayload {
  amount: number;
  description?: string | null;
  typeId: string;
  date: string;
  wallet_id: number;
  category_id?: number | null;
  frequencyId: string;
}


export interface TransactionType {
  id: string;
  name: string;
}

export interface ApiError {
  message: string;
  code?: number;
  errors?: Record<string, string[]>;
  error?: string;
  detail?: string;
  rawResponse?: string;
}


export interface Frequency {
  id: string;
  name: string;
}

export interface WalletDetails {
  id: number;
  name: string;
  amount: TransactionAmount;
  number: string; // Account number
  currency: {
    code: string;
  };
  type: string;
  user: {
    id: number;
  };
  typeName?: string;
}

export interface CreateWalletPayload {
  name: string;
  amount_cents: number;
  currency: string;
  type: string;
}

export interface UpdateWalletPayload {
  name?: string;
  amount_cents?: number;
  currency?: string;
  type?: string;
}


export interface FormCategory {
  id:string;
  name: string;
  icon?: string | null;
  color?: string | null;
}

export type WalletTypeApiResponse = Record<string, string>;

export type WalletTypeMap = Record<string, string>;

export interface SubCategory {
  id: string | number;
  name: string;
  icon: string | null;
  color: string | null;
  mainCategoryId?: string | number; // Ensure this exists for relating back
}

export interface MainCategoryUser {
  id: string | number;
}

export interface MainCategory {
  id: string | number;
  name: string;
  icon: string | null;
  color: string | null;
  user?: MainCategoryUser;
  subCategories: SubCategory[];
}

export interface CreateMainCategoryPayload {
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface UpdateMainCategoryPayload {
  name?: string;
  icon?: string | null;
  color?: string | null;
}

export interface CreateSubCategoryPayload {
  name: string;
  main_category: number;
  icon?: string | null;
  color?: string | null;
}

export interface UpdateSubCategoryPayload {
  name?: string;
  main_category?: number;
  icon?: string | null;
  color?: string | null;
}


export interface RepeatedTransactionEntry {
  id: number | string;
  transaction: {
    id: number | string;
    description?: string | null;
  };
  status: number;
  frequency: string;
  createdAt: string;
  nextExecution: string;

  frequencyName?: string;
  statusName?: string;
}

export interface RepeatedTransactionsApiResponse {
  repeated_transactions: RepeatedTransactionEntry[];
}

export interface MonthlyExpenseByCategoryItem {
  amount: number;
  color?: string;
}

export interface MonthlyExpensesByCategoryResponse {
  month_expense_chart: Record<string, MonthlyExpenseByCategoryItem>;
}

export interface DashboardLastTransactionsResponse {
  last_transactions: Transaction[];
}

export interface CurrenciesApiResponse {
  currencies: Record<string, string>; // e.g. "uae_dirham": "AED"
}

export interface CurrencyInfo {
  code: string; // "AED"
  nameKey: string; // "uae_dirham"
  displayName: string; // "AED - UAE Dirham"
}

// Transfer specific types
export interface TransferUserWallet {
  id: number;
  name: string;
  amount: {
    amount: number; // in cents
  };
  currency: {
    code: string;
  };
}

export interface TransferFormDataResponse {
  user_wallets: TransferUserWallet[];
  capital_wallets: Record<string, TransferUserWallet[]>; // Updated: username as key
}

export interface TransferWalletInfo {
  id: number;
  name: string;
  number: string;
  currency: {
    code: string;
  };
}

export interface TransferListItem {
  id: number;
  outcomeWallet: TransferWalletInfo;
  incomeWallet: TransferWalletInfo;
  amount: number; // in cents
  createdAt: string; // ISO date string
}

export interface TransfersListResponse {
  transfers: TransferListItem[];
}

export interface CreateTransferPayload {
  outcome_wallet_id: number;
  income_wallet_id: number;
  amount_cents: number;
}

// Feedback Types
export enum FeedbackTypeOption {
  BUG_REPORT = 'BUG_REPORT',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  GENERAL_FEEDBACK = 'GENERAL_FEEDBACK',
  QUESTION = 'QUESTION',
}

export interface SubmitFeedbackPayload {
  type: FeedbackTypeOption;
  subject: string;
  message: string;
}

export interface Feedback {
  id: string | number;
  type: FeedbackTypeOption;
  subject: string;
  message: string;
  createdAt: string; // ISO date string
  user?: { // Optional user info
    id: string | number;
    login: string;
  };
}

export interface GetFeedbacksResponse {
  feedbacks: Feedback[];
}

// Budget Types
export interface BudgetSubCategoryInfo {
  id: number;
  name: string;
}
export interface BudgetListItem {
  id: string | number;
  month: string; // e.g., "2024-08"
  plannedAmount: number; // in cents
  actualExpenses: number; // in cents // Assuming this will still be provided by API
  currency: string; // e.g. "PLN"
  subCategory: BudgetSubCategoryInfo;
  categoryName?: string; // Optional: can be populated on frontend for display if needed
}

export interface BudgetListResponse {
  budgets: BudgetListItem[];
}

export interface BudgetDetails extends BudgetListItem {
  // Potentially more details like category breakdowns if implemented
}

export interface CreateBudgetPayload {
  month: string; // YYYY-MM
  plannedAmount: number; // in cents
  currencyCode: string; // For creation, backend might expect currencyCode
  category_id: number;
}

export interface UpdateBudgetPayload {
  plannedAmount: number; // in cents
  category_id?: number; // Optional for updates
}


export type DashboardMode = 'overview' | 'health' | 'finance' | 'health-analysis' | 'finance-analysis';

// ── Health Data Models ──
export interface MealInfo {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  calories: number;
  foods?: { name: string; amount: string; calories: number }[];
}

export interface HealthDataDTO {
  date: string; // ISO date string
  targetCalories: number;
  consumedCalories: number;
  burnedCalories: number;
  sleepMinutes: number;
  exerciseMinutes: number;
  meals: MealInfo[];
}

// ── Finance Data Models ──
export interface AccountInfo {
  id: string;
  name: string;
  balance: number;
  type: 'cash' | 'credit' | 'debit';
}

export interface TransactionInfo {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

export interface CategoryInfo {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export interface DebtInfo {
  id: string;
  personName: string;
  type: 'borrowed' | 'lent';
  amount: number;
  remainingAmount: number;
  dueDate: string;
}

export interface SubscriptionInfo {
  id: string;
  name: string;
  amount: number;
  nextBillingDate: string;
}

export interface FinanceDataDTO {
  totalBalance: number;
  monthlyBudget: number;
  dailySpend: number;
  accounts: AccountInfo[];
  recentTransactions: TransactionInfo[];
  categories: CategoryInfo[];
  debts: DebtInfo[];
  subscriptions: SubscriptionInfo[];
}


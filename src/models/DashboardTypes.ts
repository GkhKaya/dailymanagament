import { 
  MealType, 
  AccountType, 
  TransactionType, 
  CategoryType, 
  DebtDirection 
} from './Enums';

export type DashboardMode = 'overview' | 'health' | 'finance' | 'health-analysis' | 'finance-analysis';

// ── Health Data Models ──
export interface MealInfo {
  id: string;
  type: MealType;
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
  protein: number;
  carbs: number;
  fat: number;
  meals: MealInfo[];
}

// ── Finance Data Models ──
export interface AccountInfo {
  id: string;
  name: string;
  balance: number;
  type: AccountType;
  include_in_total_balance?: boolean;
}

export interface TransactionInfo {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: TransactionType;
}

export interface CategoryInfo {
  id: string;
  name: string;
  type: CategoryType;
}

export interface DebtInfo {
  id: string;
  personName: string;
  direction: DebtDirection;
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


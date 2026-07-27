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
  protein?: number;  // Öğün toplam proteini
  carbs?: number;    // Öğün toplam karbonhidratı
  fat?: number;      // Öğün toplam yağı
  foods?: { id: string; name: string; amount: string; calories: number; protein_g?: number; carbs_g?: number; fat_g?: number; sugar_g?: number; sugar?: number }[];
}

export interface HealthDataDTO {
  date: string; // ISO date string
  targetCalories: number;
  consumedCalories: number;
  burnedCalories: number;
  caloriesBurnedBmr: number;
  bmrAdded: boolean;
  sleepMinutes: number;
  sleepCalories?: number;
  exerciseMinutes: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: MealInfo[];
  currentWeight?: number;
  weightHistory?: { date: string; weight: number }[];
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
  date: string;       // Formatted date for UI
  rawDate: string;    // ISO string for editing
  type: TransactionType;
  category?: string;
  categoryId?: string;
  accountName?: string;
  accountId?: string;
  source?: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string;
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
  monthlyIncome: number;
  monthlyExpense: number;
  accounts: AccountInfo[];
  recentTransactions: TransactionInfo[];
  categories: CategoryInfo[];
  debts: DebtInfo[];
  subscriptions: SubscriptionInfo[];
}

import { 
  MealType, 
  AccountType, 
  TransactionType, 
  CategoryType, 
  DebtDirection,
  StockTradeType
} from './Enums';

export type DashboardMode = 'overview' | 'health' | 'finance' | 'stocks' | 'health-analysis' | 'finance-analysis' | 'stocks-analysis';

// ── Health Data Models ──
export interface MealInfo {
  id: string;
  type: MealType;
  foodName: string;
  calories: number;
  protein?: number;  // Öğün toplam proteini
  carbs?: number;    // Öğün toplam karbonhidratı
  fat?: number;      // Öğün toplam yağı
  sugar?: number;
  foods?: { id: string; name: string; amount: string; calories: number; protein_g?: number; carbs_g?: number; fat_g?: number; sugar_g?: number }[];
}

export interface ExerciseInfo {
  id: string;
  name: string;
  duration_minutes: number;
  calories_burned: number;
  source?: string;
  step_count?: number;
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
  sugar: number;
  meals: MealInfo[];
  exercises?: ExerciseInfo[];
  currentWeight?: number;
  weightHistory?: { id?: string; date: string; weight: number; note?: string }[];
  hasHealthProfile?: boolean;
  isBmrCalculable?: boolean;
}

// ── Finance Data Models ──
export interface AccountInfo {
  id: string;
  name: string;
  balance: number;
  type: AccountType;
  include_in_total_balance?: boolean;
  credit_card_details?: {
    total_limit: number;
    current_debt: number;
    statement_day: number;
    payment_due_day: number;
  };
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
  relatedAccountName?: string;
  relatedAccountId?: string;
  source?: string;
  createdAt?: string;
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

// ── Stock & Portfolio Data Models ──
export interface StockTradeDTO {
  id: string;
  symbol: string;
  name?: string;
  assetType: 'stock' | 'fund' | 'crypto';
  type: 'buy' | 'sell';
  lots: number;
  price: number;
  total_amount: number;
  date: string;       // Formatted or ISO date
  rawDate: string;    // ISO string
  notes?: string;
  market?: 'bist' | 'us' | 'crypto';
  currency?: string;
  cost_basis?: number;
  total_cost?: number;
  realized_pnl?: number;
  realized_pnl_percent?: number;
  holding_days?: number;
  created_at?: string;
}

export interface StockPositionDTO {
  id: string;
  symbol: string;
  name?: string;
  assetType: 'stock' | 'fund' | 'crypto';
  market?: 'bist' | 'us' | 'crypto';
  currency?: string;
  total_lots: number;
  average_cost: number;
  total_cost: number;
  current_price?: number;
  open_price?: number;
  close_price?: number;
  day_change_percent?: number;
  price_updated_at?: string;
  current_value?: number;
  unrealized_pnl?: number;
  unrealized_pnl_percent?: number;
  last_trade_date?: string;
}

export interface KnownStockDTO {
  symbol: string;
  name: string;
  market?: 'bist' | 'us' | 'crypto';
  currency?: string;
  isCustom?: boolean;
}

export interface StockPortfolioDTO {
  positions: StockPositionDTO[];
  closedPositions: StockPositionDTO[];
  realizedTrades: StockTradeDTO[];
  allTrades: StockTradeDTO[];
  knownStocks: KnownStockDTO[];
  activeMarkets?: string[];
  totals: {
    totalInvestedCost: number;        // Açık pozisyonlardaki toplam maliyet
    totalCurrentValue: number;         // Açık pozisyonlardaki güncel değer (varsa)
    totalUnrealizedPnl: number;        // Açık pozisyonlardaki potansiyel K/Z
    totalUnrealizedPnlPercent: number; // Açık pozisyonlar potansiyel K/Z %
    totalRealizedPnl: number;          // Toplam gerçekleşen kar/zarar ₺
    totalRealizedPnlPercent: number;   // Toplam gerçekleşen kar/zarar %
    winningTradesCount: number;        // Kârlı satış adedi
    losingTradesCount: number;         // Zararlı satış adedi
    winRate: number;                   // Başarı yüzdesi %
    totalBuyVolume: number;            // Toplam yapılan alış hacmi
    totalSellVolume: number;           // Toplam yapılan satış hacmi
    topProfitableSymbol?: { symbol: string; pnl: number };
  };
}

export type PortfolioTrend = "gain" | "loss" | "neutral";

export type RealizedTradeFilter = 'all' | 'stock' | 'fund' | 'crypto';
export type RealizedPeriodFilter = 'all' | 'week' | 'month';

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getTradeCalendarDate(rawDate: string): { year: number; month: number; day: number; date: Date } {
  const isoMatch = typeof rawDate === 'string' ? rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return { year, month, day, date: new Date(year, month, day, 12, 0, 0) };
  }
  const d = new Date(rawDate);
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), date: d };
}

export function filterRealizedTrades<T extends { assetType?: string; rawDate: string; created_at?: string }>(
  trades: T[],
  assetFilter: RealizedTradeFilter,
  period: RealizedPeriodFilter,
  now = new Date(),
  periodOffset = 0
): T[] {
  let start: Date | null = null;
  let end: Date | null = null;

  if (period === 'week') {
    const dayOfWeek = now.getDay() || 7;
    start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek + 1 + (periodOffset * 7));
    start.setHours(0, 0, 0, 0);

    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth() + periodOffset;
    start = new Date(year, month, 1, 0, 0, 0, 0);
    end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  }

  return trades
    .filter((trade) => {
      if (assetFilter !== 'all' && trade.assetType !== assetFilter) {
        return false;
      }
      if (period === 'all' || !start || !end) {
        return true;
      }

      if (period === 'month') {
        const { year, month } = getTradeCalendarDate(trade.rawDate);
        return year === start.getFullYear() && month === start.getMonth();
      }

      if (period === 'week') {
        const { date } = getTradeCalendarDate(trade.rawDate);
        return date >= start && date <= end;
      }

      return true;
    })
    .sort((a, b) => {
      const timeDiff = new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime();
      if (timeDiff !== 0) return timeDiff;
      const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return createB - createA;
    });
}

export function formatRealizedPeriodLabel(
  period: RealizedPeriodFilter,
  offset: number,
  isEn: boolean,
  now = new Date()
): string {
  if (period === 'all') {
    return isEn ? 'All Trades' : 'Tüm İşlemler';
  }

  if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const monthName = isEn ? MONTH_NAMES_EN[d.getMonth()] : MONTH_NAMES_TR[d.getMonth()];
    const base = `${monthName} ${d.getFullYear()}`;
    if (offset === 0) return `${base} (${isEn ? 'This Month' : 'Bu Ay'})`;
    if (offset === -1) return `${base} (${isEn ? 'Last Month' : 'Geçen Ay'})`;
    return base;
  }

  if (period === 'week') {
    const dayOfWeek = now.getDay() || 7;
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek + 1 + (offset * 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const startMonth = isEn ? MONTH_NAMES_EN[start.getMonth()] : MONTH_NAMES_TR[start.getMonth()];
    const endMonth = isEn ? MONTH_NAMES_EN[end.getMonth()] : MONTH_NAMES_TR[end.getMonth()];

    let rangeStr = '';
    if (start.getMonth() === end.getMonth()) {
      rangeStr = `${start.getDate()} - ${end.getDate()} ${endMonth} ${end.getFullYear()}`;
    } else {
      rangeStr = `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${end.getFullYear()}`;
    }

    if (offset === 0) return `${rangeStr} (${isEn ? 'This Week' : 'Bu Hafta'})`;
    if (offset === -1) return `${rangeStr} (${isEn ? 'Last Week' : 'Geçen Hafta'})`;
    return rangeStr;
  }

  return '';
}

export function summarizeRealizedTrades(trades: Array<{ realized_pnl?: number }>) {
  return {
    netPnl: Math.round(trades.reduce((sum, trade) => sum + (trade.realized_pnl || 0), 0) * 100) / 100,
    winningCount: trades.filter((trade) => (trade.realized_pnl || 0) > 0).length,
    losingCount: trades.filter((trade) => (trade.realized_pnl || 0) < 0).length,
  };
}

export function getPortfolioPerformance(currentValue: number, investedCost: number) {
  const pnl = currentValue - investedCost;
  const trend: PortfolioTrend = pnl > 0 ? "gain" : pnl < 0 ? "loss" : "neutral";

  return {
    pnl,
    percent: investedCost > 0 ? (pnl / investedCost) * 100 : 0,
    trend,
  };
}

export function getStockCurrencySymbol(currency: string = 'TRY'): string {
  return currency === 'USD' ? '$' : '₺';
}

export function formatStockCurrency(value: number, currency: string = 'TRY') {
  const safeVal = isNaN(value) ? 0 : value;
  if (currency === 'USD') {
    return `$${safeVal.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${safeVal.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}


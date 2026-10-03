export type CompanyRole = 'owner' | 'admin';
export type CompanyPeriod = 'all' | 'week' | 'month';

export function canManageCompanyMembers(role: CompanyRole | null | undefined) {
  return role === 'owner';
}

export function canDeleteCompany(role: CompanyRole | null | undefined) {
  return role === 'owner';
}

export function canManageCompanyFinance(role: CompanyRole | null | undefined) {
  return role === 'owner' || role === 'admin';
}

export function filterCompanyTransactions<T extends { date: string }>(items: T[], period: CompanyPeriod, now = new Date()) {
  if (period === 'all') return [...items];
  const start = new Date(now);
  const end = new Date(now);
  if (period === 'month') {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCMonth(end.getUTCMonth() + 1, 1);
    end.setUTCHours(0, 0, 0, 0);
  } else {
    const weekday = start.getUTCDay() || 7;
    start.setUTCDate(start.getUTCDate() - weekday + 1);
    start.setUTCHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setUTCDate(end.getUTCDate() + 7);
  }
  return items.filter((item) => {
    const date = new Date(item.date);
    return date >= start && date < end;
  });
}

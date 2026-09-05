export const CATEGORY_NAME_MAP_TR_TO_EN: Record<string, string> = {
  'Market': 'Groceries',
  'Ulaşım': 'Transportation',
  'Eğlence': 'Entertainment',
  'Kafe/Restoran': 'Dining Out',
  'Faturalar': 'Bills & Utilities',
  'Ev/Kira': 'Rent & Housing',
  'Sağlık': 'Healthcare',
  'Maaş': 'Salary',
  'Yatırım Getirisi': 'Investments',
  'Diğer (Gelir)': 'Other Income',
  'Diğer': 'Other'
};

export const CATEGORY_NAME_MAP_EN_TO_TR: Record<string, string> = {
  'Groceries': 'Market',
  'Transportation': 'Ulaşım',
  'Entertainment': 'Eğlence',
  'Dining Out': 'Kafe/Restoran',
  'Bills & Utilities': 'Faturalar',
  'Rent & Housing': 'Ev/Kira',
  'Healthcare': 'Sağlık',
  'Salary': 'Maaş',
  'Investments': 'Yatırım Getirisi',
  'Other Income': 'Diğer (Gelir)',
  'Other': 'Diğer'
};

export function localizeCategoryName(name: string, isEn: boolean): string {
  if (!name) return name;
  if (isEn) {
    return CATEGORY_NAME_MAP_TR_TO_EN[name] || name;
  } else {
    return CATEGORY_NAME_MAP_EN_TO_TR[name] || name;
  }
}

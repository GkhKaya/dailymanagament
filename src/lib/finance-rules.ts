export type FinanceAccount = {
  id?: string;
  type: string;
  balance: number;
  credit_card_details?: { current_debt: number };
};

export type AccountEffect = { balance: number; currentDebt?: number };

export function applyTransactionEffect(account: FinanceAccount, type: 'income' | 'expense', amount: number): AccountEffect {
  const balance = type === 'income' ? account.balance + amount : account.balance - amount;

  if (account.type !== 'credit_card' || !account.credit_card_details) {
    return { balance };
  }

  const currentDebt = type === 'income'
    ? Math.max(0, account.credit_card_details.current_debt - amount)
    : Math.max(0, account.credit_card_details.current_debt + amount);

  return { balance, currentDebt };
}

export function validateTransfer(source: FinanceAccount, target: FinanceAccount, amount: number): { valid: true } | { valid: false; error: string } {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { valid: false, error: 'Transfer tutarı 0’dan büyük olmalıdır.' };
  }
  if (source.type === 'credit_card' || target.type === 'credit_card') {
    return { valid: false, error: 'Kredi kartı transfer için kullanılamaz.' };
  }
  if (source === target || (source.id && target.id && source.id === target.id)) {
    return { valid: false, error: 'Kaynak ve hedef hesap aynı olamaz.' };
  }
  if (source.balance < amount) {
    return { valid: false, error: 'Kaynak hesapta yeterli bakiye yok.' };
  }
  return { valid: true };
}

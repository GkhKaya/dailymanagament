/**
 * Debt (borç/alacak) money rules. "given" = I lent money (alacak), "taken" = I borrowed (borç).
 */

export type DebtDirectionValue = 'given' | 'taken';
export type MoneyFlow = 'in' | 'out';

/**
 * Which way money moves on the chosen account.
 * - Opening a debt: lending sends money out, borrowing brings it in.
 * - A payment: the friend repaying me brings money in, me repaying sends it out.
 */
export function debtFlow(direction: DebtDirectionValue, event: 'open' | 'payment'): MoneyFlow {
  if (direction === 'given') return event === 'open' ? 'out' : 'in';
  return event === 'open' ? 'in' : 'out';
}

export function signedAmount(flow: MoneyFlow, amount: number) {
  return flow === 'in' ? amount : -amount;
}

/** Applies a payment to the remaining amount; rejects non-positive or overpaying amounts. */
export function applyDebtPayment(remaining: number, amount: number): { remaining: number; status: 'partially_paid' | 'closed' } {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Ödeme tutarı 0’dan büyük olmalıdır.');
  const rounded = Math.round(amount * 100) / 100;
  if (rounded - remaining > 0.004) throw new Error('Ödeme tutarı kalan borçtan büyük olamaz.');
  const next = Math.max(0, Math.round((remaining - rounded) * 100) / 100);
  return { remaining: next, status: next === 0 ? 'closed' : 'partially_paid' };
}

/** Remaining amount after the original amount is edited, keeping payments already made. */
export function remainingAfterEdit(newOriginal: number, paidSoFar: number) {
  return Math.max(0, Math.round((newOriginal - paidSoFar) * 100) / 100);
}

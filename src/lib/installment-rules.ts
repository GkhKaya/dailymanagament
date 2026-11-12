/**
 * Installment (taksit) rules: split a purchase into monthly charges and find which are due.
 * Pure functions so they can be unit tested without a database.
 */

/** Splits a total into `count` monthly amounts in kuruş precision; the last one absorbs rounding. */
export function splitInstallments(total: number, count: number): number[] {
  if (!Number.isFinite(total) || total <= 0) throw new Error('Toplam tutar 0’dan büyük olmalıdır.');
  if (!Number.isInteger(count) || count < 1 || count > 60) throw new Error('Taksit sayısı 1 ile 60 arasında olmalıdır.');
  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / count);
  const amounts = Array.from({ length: count }, () => baseCents / 100);
  amounts[count - 1] = (totalCents - baseCents * (count - 1)) / 100;
  return amounts;
}

/** The charge date `monthsAfter` months after `first`, keeping `chargeDay` (clamped to short months). */
export function chargeDateFor(first: Date, chargeDay: number, monthsAfter: number): Date {
  const y = first.getFullYear();
  const m = first.getMonth() + monthsAfter;
  const lastDay = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(chargeDay, lastDay), first.getHours(), first.getMinutes());
}

export type DueCharge = { index: number; date: Date; amount: number };

/**
 * Charges that are due by `now` and not yet paid. `index` is 0-based; installment number is index + 1.
 */
export function dueCharges(plan: { first_charge_date: Date; charge_day: number; paid_count: number; amounts: number[] }, now: Date): DueCharge[] {
  const due: DueCharge[] = [];
  for (let i = plan.paid_count; i < plan.amounts.length; i++) {
    const date = chargeDateFor(plan.first_charge_date, plan.charge_day, i);
    if (date.getTime() > now.getTime()) break;
    due.push({ index: i, date, amount: plan.amounts[i] });
  }
  return due;
}

/** Next unpaid charge date, or null when the plan is finished. */
export function nextChargeDate(plan: { first_charge_date: Date; charge_day: number; paid_count: number; amounts: number[] }): Date | null {
  if (plan.paid_count >= plan.amounts.length) return null;
  return chargeDateFor(plan.first_charge_date, plan.charge_day, plan.paid_count);
}

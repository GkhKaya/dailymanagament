"use client";

import React from 'react';
import { CalendarClock, Trash2 } from 'lucide-react';
import { useInstallmentsViewModel } from '@/viewmodels/useInstallmentsViewModel';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency, getCurrencySymbol } from '@/lib/i18n';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { CategoryInfo } from '@/models/DashboardTypes';

type AccountOption = { id: string; name: string; type?: string };

const inputClass = 'min-h-11 w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-4 text-body text-white focus:border-[var(--inverse-primary)] focus:outline-none';
const labelClass = 'text-caption text-[var(--on-surface-variant)] uppercase tracking-wider';

export function ManageInstallmentsForm({
  accounts,
  categories = [],
  onChanged,
  accountId,
  showAddForm = true,
}: {
  accounts: AccountOption[];
  categories?: CategoryInfo[];
  onChanged?: () => void;
  accountId?: string;
  showAddForm?: boolean;
}) {
  const { locale, isAbroad } = useTranslation();
  const currencySymbol = getCurrencySymbol(locale, isAbroad);
  const vm = useInstallmentsViewModel(accounts, onChanged, accountId);
  const { isEn } = vm;
  const money = (n: number) => formatCurrency(n, locale, isAbroad);
  const fmtDate = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(isEn ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long' });
  };

  const active = vm.installments.filter(i => i.isActive);
  const finished = vm.installments.filter(i => !i.isActive);
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const cardAccounts = accounts.filter(a => a.type === 'credit_card');
  const otherAccounts = accounts.filter(a => a.type !== 'credit_card');

  return (
    <div className="flex flex-col gap-6">
      {showAddForm && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass} htmlFor="inst-name">{isEn ? 'What did you buy?' : 'Ne aldın?'}</label>
            <input id="inst-name" type="text" value={vm.name} onChange={e => vm.setName(e.target.value)} placeholder={isEn ? 'e.g. Headphones' : 'Örn: Kulaklık'} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor="inst-total">{isEn ? 'Total amount' : 'Toplam tutar'}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]">{currencySymbol}</span>
                <input id="inst-total" type="number" inputMode="decimal" min="0.01" step="0.01" value={vm.totalAmount} onChange={e => vm.setTotalAmount(e.target.value)} placeholder="1200" className={`${inputClass} pl-9`} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor="inst-count">{isEn ? 'Installments' : 'Taksit sayısı'}</label>
              <select id="inst-count" value={vm.count} onChange={e => vm.setCount(e.target.value)} className={`${inputClass} appearance-none bg-[var(--surface-container)]`}>
                {[2, 3, 4, 5, 6, 8, 9, 10, 12, 18, 24, 36].map(n => <option key={n} value={n}>{n} {isEn ? 'months' : 'ay'}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor="inst-account">{isEn ? 'Card' : 'Kart'}</label>
              <select id="inst-account" value={vm.selectedAccountId} onChange={e => vm.setSelectedAccountId(e.target.value)} disabled={!!accountId} className={`${inputClass} appearance-none bg-[var(--surface-container)] disabled:opacity-70`}>
                {cardAccounts.length > 0 && <optgroup label={isEn ? 'Credit cards' : 'Kredi kartları'}>{cardAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>}
                {otherAccounts.length > 0 && <optgroup label={isEn ? 'Other accounts' : 'Diğer hesaplar'}>{otherAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor="inst-date">{isEn ? 'First installment date' : 'İlk taksit tarihi'}</label>
              <input id="inst-date" type="date" value={vm.firstChargeDate} onChange={e => vm.setFirstChargeDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          {expenseCategories.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor="inst-category">{isEn ? 'Category (optional)' : 'Kategori (opsiyonel)'}</label>
              <select id="inst-category" value={vm.categoryId} onChange={e => vm.setCategoryId(e.target.value)} className={`${inputClass} appearance-none bg-[var(--surface-container)]`}>
                <option value="">{isEn ? 'No category' : 'Kategorisiz'}</option>
                {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <p className="rounded-xl bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-6 text-[var(--on-surface-variant)]">
            {vm.monthlyPreview
              ? (isEn
                ? <>Every month on day <b className="text-white">{Number(vm.firstChargeDate.slice(8))}</b>, <b className="text-white">{money(vm.monthlyPreview)}</b> is added to the card as an expense, {vm.count} times.{vm.isToday ? ' The first one is charged now.' : ''}</>
                : <>Her ayın <b className="text-white">{Number(vm.firstChargeDate.slice(8))}</b>. günü karttan <b className="text-white">{money(vm.monthlyPreview)}</b> gider olarak düşülür, toplam {vm.count} kez.{vm.isToday ? ' İlk taksit şimdi düşülür.' : ''}</>)
              : (isEn ? 'Enter the total and pick the number of installments.' : 'Toplam tutarı gir ve taksit sayısını seç.')}
          </p>

          <button type="button" onClick={vm.handleAdd} disabled={vm.isSaving} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--primary)] font-bold text-black transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50">
            {vm.isSaving ? <LoadingSpinner size="sm" /> : (isEn ? 'Add installment plan' : 'Taksit planını ekle')}
          </button>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-white">{isEn ? 'Ongoing installments' : 'Devam eden taksitler'}</h3>
        {vm.isLoadingList ? (
          <LoadingSpinner size="sm" />
        ) : active.length === 0 ? (
          <p className="text-sm text-[var(--on-surface-variant)]">{isEn ? 'No ongoing installments.' : 'Devam eden taksit yok.'}</p>
        ) : (
          active.map(i => (
            <div key={i.id} className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold text-white">{i.name}</span>
                  <span className="shrink-0 text-sm font-semibold text-white">{money(i.installmentAmount)} / {isEn ? 'mo' : 'ay'}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                  <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${(i.paidCount / i.installmentCount) * 100}%` }} />
                </div>
                <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-[var(--on-surface-variant)]">
                  <span>{i.paidCount}/{i.installmentCount} {isEn ? 'paid' : 'ödendi'}</span>
                  <span>{isEn ? 'Left' : 'Kalan'}: {money(i.remainingAmount)}</span>
                  {i.nextChargeDate && <span className="inline-flex items-center gap-1"><CalendarClock size={12} />{fmtDate(i.nextChargeDate)}</span>}
                  {!accountId && i.accountName && <span>{i.accountName}</span>}
                </p>
              </div>
              <button type="button" onClick={() => vm.handleDelete(i.id)} aria-label={isEn ? `Stop ${i.name}` : `${i.name} planını durdur`} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--on-surface-variant)] hover:bg-red-500/10 hover:text-red-400">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
        {finished.length > 0 && (
          <details className="mt-1 text-sm text-[var(--on-surface-variant)]">
            <summary className="cursor-pointer py-2">{isEn ? `Finished (${finished.length})` : `Biten taksitler (${finished.length})`}</summary>
            {finished.map(i => (
              <div key={i.id} className="flex justify-between py-1.5">
                <span>{i.name}</span><span>{money(i.totalAmount)} · {i.installmentCount} {isEn ? 'mo' : 'ay'}</span>
              </div>
            ))}
          </details>
        )}
      </section>
    </div>
  );
}

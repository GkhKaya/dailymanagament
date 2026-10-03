'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, CalendarDays, Check, ChevronDown, CircleDollarSign, Landmark, Plus, ReceiptText, Send, Trash2, TrendingDown, TrendingUp, UserPlus, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createCompanyAccountAction, createCompanyAction, createCompanyCategoryAction, deleteCompanyAction,
  deleteCompanyTransactionAction, getCompanyWorkspaceAction, removeCompanyAdminAction,
  respondCompanyInvitationAction, saveCompanyTransactionAction, sendCompanyInvitationAction,
  type CompanyWorkspaceData,
} from '@/actions/company';
import { filterCompanyTransactions, type CompanyPeriod } from '@/lib/company-permissions';

type TransactionDraft = { id?: string; type: 'income' | 'expense'; amount: string; date: string; accountId: string; categoryId: string; description: string };
const today = () => new Date().toISOString().slice(0, 10);
const emptyTransaction = (): TransactionDraft => ({ type: 'expense', amount: '', date: today(), accountId: '', categoryId: '', description: '' });
const inputClass = 'min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none transition focus:border-[var(--primary)]';
const cardClass = 'rounded-2xl border border-white/[0.07] bg-[rgba(255,255,255,0.035)] shadow-[0_16px_50px_rgba(0,0,0,0.16)]';

export function CompanyWorkspace({ initialData, initialError }: { initialData: CompanyWorkspaceData | null; initialError: string | null }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState<CompanyPeriod | 'range'>('month');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [showCreate, setShowCreate] = useState(!initialData?.activeCompany);
  const [showTransaction, setShowTransaction] = useState(false);
  const [transaction, setTransaction] = useState<TransactionDraft>(emptyTransaction());
  const [companyForm, setCompanyForm] = useState({ name: '', taxNumber: '', currency: 'TRY', description: '' });
  const [accountForm, setAccountForm] = useState({ name: '', type: 'bank' as 'cash' | 'bank' | 'other', openingBalance: '0' });
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'expense' as 'income' | 'expense' });
  const [inviteEmail, setInviteEmail] = useState('');

  const active = data?.activeCompany;
  const formatMoney = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: active?.currency || 'TRY', maximumFractionDigits: 2 }).format(value);

  const refresh = (companyId?: string) => new Promise<void>((resolve) => {
    startTransition(() => {
      void (async () => {
      const result = await getCompanyWorkspaceAction(companyId || active?.id);
      if (result.success) setData(result.data); else toast.error(result.error);
      resolve();
      })();
    });
  });

  const visibleTransactions = useMemo(() => {
    const items = data?.transactions || [];
    if (period !== 'range') return filterCompanyTransactions(items, period);
    return items.filter((item) => (!rangeStart || item.date >= `${rangeStart}T00:00:00`) && (!rangeEnd || item.date <= `${rangeEnd}T23:59:59`));
  }, [data?.transactions, period, rangeStart, rangeEnd]);
  const totals = useMemo(() => visibleTransactions.reduce((sum, item) => ({ income: sum.income + (item.type === 'income' ? item.amount : 0), expense: sum.expense + (item.type === 'expense' ? item.amount : 0) }), { income: 0, expense: 0 }), [visibleTransactions]);

  const run = (operation: () => Promise<{ success: boolean; error?: string; companyId?: string }>, successMessage: string, after?: () => void) => {
    startTransition(() => {
      void (async () => {
      const result = await operation();
      if (!result.success) return toast.error(result.error || 'İşlem tamamlanamadı.');
      toast.success(successMessage); after?.(); await refresh(result.companyId || active?.id);
      })();
    });
  };

  const editTransaction = (item: CompanyWorkspaceData['transactions'][number]) => {
    setTransaction({ id: item.id, type: item.type, amount: String(item.amount), date: item.date.slice(0, 10), accountId: item.accountId, categoryId: item.categoryId, description: item.description });
    setShowTransaction(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!data) return <main className="min-h-screen bg-[var(--background)] p-6 text-white"><p>{initialError || 'Şirket alanı yüklenemedi.'}</p></main>;

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-[var(--on-surface)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.push('/dashboard')} aria-label="Panele dön" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10"><ArrowLeft size={18} /></button>
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">DailyM Business</p><h1 className="text-2xl font-black text-white sm:text-3xl">Şirketim</h1></div>
          </div>
          <button type="button" onClick={() => setShowCreate(true)} className="flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-black hover:bg-[var(--primary-hover)]"><Plus size={17} /> Yeni şirket</button>
        </header>

        {data.invitations.length > 0 && <section className={`${cardClass} mb-6 border-[var(--primary)]/25 p-4`}><h2 className="mb-3 flex items-center gap-2 font-bold text-white"><Send size={18} className="text-[var(--primary)]" /> Şirket davetleri</h2><div className="grid gap-2 md:grid-cols-2">{data.invitations.map((invite) => <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/25 p-3"><div><p className="font-semibold text-white">{invite.companyName}</p><p className="text-xs text-white/50">Davet eden: {invite.inviterEmail}</p></div><div className="flex gap-2"><button disabled={isPending} onClick={() => run(() => respondCompanyInvitationAction(invite.id, 'rejected'), 'Davet reddedildi.')} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 text-white"><X size={17} /></button><button disabled={isPending} onClick={() => run(() => respondCompanyInvitationAction(invite.id, 'accepted'), 'Şirkete katıldınız.')} className="flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-3 font-bold text-black"><Check size={17} /> Kabul et</button></div></div>)}</div></section>}

        {showCreate && <section className={`${cardClass} mb-6 p-5`}><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-white">Yeni şirket oluştur</h2>{active && <button onClick={() => setShowCreate(false)} className="min-h-11 min-w-11 text-white/60"><X className="mx-auto" size={18} /></button>}</div><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"><label className="text-xs text-white/60">Şirket adı<input className={`${inputClass} mt-1`} value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} /></label><label className="text-xs text-white/60">Vergi numarası (opsiyonel)<input className={`${inputClass} mt-1`} value={companyForm.taxNumber} onChange={(e) => setCompanyForm({ ...companyForm, taxNumber: e.target.value })} /></label><label className="text-xs text-white/60">Para birimi<select className={`${inputClass} mt-1`} value={companyForm.currency} onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}><option value="TRY">TRY</option><option value="USD">USD</option><option value="EUR">EUR</option></select></label><label className="text-xs text-white/60">Açıklama<input className={`${inputClass} mt-1`} value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} /></label></div><button disabled={isPending || companyForm.name.trim().length < 2} onClick={() => run(() => createCompanyAction(companyForm), 'Şirket oluşturuldu.', () => { setCompanyForm({ name: '', taxNumber: '', currency: 'TRY', description: '' }); setShowCreate(false); })} className="mt-4 min-h-11 rounded-xl bg-[var(--primary)] px-5 font-bold text-black disabled:opacity-40">Şirketi oluştur</button></section>}

        {!active ? <section className={`${cardClass} p-10 text-center`}><Building2 size={44} className="mx-auto mb-3 text-[var(--primary)]" /><h2 className="text-xl font-bold text-white">İlk şirketini oluştur</h2><p className="mt-2 text-sm text-white/55">Gelir, gider, hesap ve ekip takibini kişisel kayıtlarından ayrı yönet.</p></section> : <>
          <section className={`${cardClass} mb-4 flex flex-wrap items-center justify-between gap-3 p-4`}><div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]"><Building2 size={22} /></span><div className="min-w-0"><p className="truncate font-bold text-white">{active.name}</p><p className="text-xs text-white/45">{active.role === 'owner' ? 'Şirket sahibi' : 'Admin'} · {active.currency}</p></div></div><label className="relative min-w-[210px]"><span className="sr-only">Aktif şirket</span><select disabled={isPending} value={active.id} onChange={(e) => refresh(e.target.value)} className={`${inputClass} appearance-none pr-10`}>{data.companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-white/50" /></label></section>

          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric title="Gelir" value={formatMoney(totals.income)} icon={<TrendingUp size={20} />} tone="text-emerald-400" /><Metric title="Gider" value={formatMoney(totals.expense)} icon={<TrendingDown size={20} />} tone="text-red-400" /><Metric title="Net durum" value={formatMoney(totals.income - totals.expense)} icon={<CircleDollarSign size={20} />} tone={totals.income - totals.expense >= 0 ? 'text-[var(--primary)]' : 'text-red-400'} /><Metric title="Toplam bakiye" value={formatMoney(data.accounts.reduce((sum, item) => sum + item.balance, 0))} icon={<Landmark size={20} />} tone="text-sky-400" /></div>

          <section className={`${cardClass} mb-4 p-4`}><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays size={18} className="text-[var(--primary)]" /><h2 className="font-bold text-white">Dönem</h2></div><div className="flex flex-wrap gap-2">{([['week','Bu hafta'],['month','Bu ay'],['all','Tümü'],['range','Tarih aralığı']] as const).map(([value,label]) => <button key={value} onClick={() => setPeriod(value)} className={`min-h-11 rounded-xl px-3 text-sm font-semibold ${period === value ? 'bg-[var(--primary)] text-black' : 'bg-white/5 text-white/65'}`}>{label}</button>)}</div></div>{period === 'range' && <div className="mt-3 grid gap-2 sm:grid-cols-2"><input type="date" className={inputClass} value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} /><input type="date" className={inputClass} value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} /></div>}</section>

          <div className="grid gap-4 xl:grid-cols-[1.55fr_0.85fr]">
            <section className={`${cardClass} overflow-hidden`}><div className="flex items-center justify-between gap-3 border-b border-white/[0.06] p-4"><div><h2 className="font-bold text-white">Gelir-gider geçmişi</h2><p className="text-xs text-white/45">{visibleTransactions.length} kayıt</p></div><button onClick={() => { setTransaction(emptyTransaction()); setShowTransaction(true); }} className="flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-black"><Plus size={17} /> İşlem ekle</button></div>
              {showTransaction && <TransactionForm draft={transaction} setDraft={setTransaction} accounts={data.accounts} categories={data.categories} isPending={isPending} onClose={() => setShowTransaction(false)} onSave={() => run(() => saveCompanyTransactionAction(active.id, { ...transaction, amount: Number(transaction.amount) }), transaction.id ? 'İşlem güncellendi.' : 'İşlem eklendi.', () => { setShowTransaction(false); setTransaction(emptyTransaction()); })} />}
              <div className="divide-y divide-white/[0.06]">{visibleTransactions.length === 0 ? <p className="p-8 text-center text-sm text-white/45">Bu dönemde işlem yok.</p> : visibleTransactions.map((item) => <article key={item.id} className="flex items-center justify-between gap-3 p-4 hover:bg-white/[0.025]"><button onClick={() => editTransaction(item)} className="min-w-0 flex-1 text-left"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${item.type === 'income' ? 'bg-emerald-400' : 'bg-red-400'}`} /><p className="truncate font-semibold text-white">{item.description || item.categoryName}</p></div><p className="mt-1 truncate pl-[18px] text-xs text-white/45">{new Date(item.date).toLocaleDateString('tr-TR')} · {item.accountName} · {item.categoryName}</p></button><div className="flex items-center gap-2"><p className={`whitespace-nowrap font-bold ${item.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}</p><button aria-label="İşlemi sil" onClick={() => { if (confirm('Bu işlem silinsin mi?')) run(() => deleteCompanyTransactionAction(active.id, item.id), 'İşlem silindi.'); }} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-white/35 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={16} /></button></div></article>)}</div>
            </section>

            <div className="space-y-4"><ManagementCard title="Şirket hesapları" icon={<Landmark size={18} />}><div className="space-y-2">{data.accounts.map((account) => <div key={account.id} className="flex items-center justify-between rounded-xl bg-black/20 p-3"><div><p className="font-medium text-white">{account.name}</p><p className="text-xs text-white/40">{account.type === 'cash' ? 'Kasa' : account.type === 'bank' ? 'Banka' : 'Diğer'}</p></div><p className="font-semibold text-white">{formatMoney(account.balance)}</p></div>)}</div><div className="mt-3 grid gap-2"><input className={inputClass} placeholder="Yeni hesap adı" value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} /><div className="grid grid-cols-2 gap-2"><select className={inputClass} value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value as typeof accountForm.type })}><option value="cash">Kasa</option><option value="bank">Banka</option><option value="other">Diğer</option></select><input className={inputClass} type="number" placeholder="Açılış bakiyesi" value={accountForm.openingBalance} onChange={(e) => setAccountForm({ ...accountForm, openingBalance: e.target.value })} /></div><button disabled={isPending || !accountForm.name.trim()} onClick={() => run(() => createCompanyAccountAction(active.id, { ...accountForm, openingBalance: Number(accountForm.openingBalance) }), 'Hesap eklendi.', () => setAccountForm({ name: '', type: 'bank', openingBalance: '0' }))} className="min-h-11 rounded-xl bg-white/8 font-semibold text-white disabled:opacity-40">Hesap ekle</button></div></ManagementCard>

              <ManagementCard title="Kategoriler" icon={<ReceiptText size={18} />}><div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">{data.categories.map((category) => <span key={category.id} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/70"><i className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: category.color }} />{category.name}</span>)}</div><div className="mt-3 grid grid-cols-[1fr_110px] gap-2"><input className={inputClass} placeholder="Kategori adı" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} /><select className={inputClass} value={categoryForm.type} onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as 'income' | 'expense' })}><option value="income">Gelir</option><option value="expense">Gider</option></select></div><button disabled={isPending || !categoryForm.name.trim()} onClick={() => run(() => createCompanyCategoryAction(active.id, categoryForm), 'Kategori eklendi.', () => setCategoryForm({ name: '', type: 'expense' }))} className="mt-2 min-h-11 w-full rounded-xl bg-white/8 font-semibold text-white disabled:opacity-40">Kategori ekle</button></ManagementCard>

              <ManagementCard title="Ekip" icon={<Users size={18} />}><div className="space-y-2">{data.members.map((member) => <div key={member.id} className="flex items-center justify-between gap-2 rounded-xl bg-black/20 p-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{member.email}</p><p className="text-xs text-white/40">{member.role === 'owner' ? 'Şirket sahibi' : 'Admin'}</p></div>{active.role === 'owner' && member.role === 'admin' && <button aria-label="Admini çıkar" onClick={() => { if (confirm('Bu admin şirketten çıkarılsın mı?')) run(() => removeCompanyAdminAction(active.id, member.id), 'Admin çıkarıldı.'); }} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10"><Trash2 size={16} /></button>}</div>)}</div>{active.role === 'owner' && <div className="mt-3 flex gap-2"><input type="email" className={inputClass} placeholder="Kayıtlı kullanıcının e-postası" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /><button disabled={isPending || !inviteEmail.includes('@')} onClick={() => run(() => sendCompanyInvitationAction(active.id, inviteEmail), 'Uygulama içi davet gönderildi.', () => setInviteEmail(''))} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-[var(--primary)] text-black disabled:opacity-40"><UserPlus size={18} /></button></div>}</ManagementCard>

              {active.role === 'owner' && <button onClick={() => { if (confirm(`${active.name} ve tüm şirket kayıtları kalıcı olarak silinsin mi?`)) run(() => deleteCompanyAction(active.id), 'Şirket silindi.', () => setShowCreate(data.companies.length <= 1)); }} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 text-sm font-semibold text-red-400 hover:bg-red-500/10"><Trash2 size={17} /> Şirketi sil</button>}
            </div>
          </div>
        </>}
      </div>
      {isPending && <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-white/5"><div className="h-full w-1/2 animate-pulse bg-[var(--primary)]" /></div>}
    </main>
  );
}

function Metric({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: string }) { return <div className={`${cardClass} p-4`}><div className={`mb-3 flex items-center gap-2 ${tone}`}>{icon}<p className="text-xs font-bold uppercase tracking-wider">{title}</p></div><p className="truncate text-lg font-black text-white sm:text-xl">{value}</p></div>; }
function ManagementCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <section className={`${cardClass} p-4`}><h2 className="mb-3 flex items-center gap-2 font-bold text-white"><span className="text-[var(--primary)]">{icon}</span>{title}</h2>{children}</section>; }

function TransactionForm({ draft, setDraft, accounts, categories, isPending, onClose, onSave }: { draft: TransactionDraft; setDraft: (draft: TransactionDraft) => void; accounts: CompanyWorkspaceData['accounts']; categories: CompanyWorkspaceData['categories']; isPending: boolean; onClose: () => void; onSave: () => void }) {
  const matchingCategories = categories.filter((item) => item.type === draft.type);
  return <div className="border-b border-white/[0.06] bg-black/20 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-white">{draft.id ? 'İşlemi düzenle' : 'Yeni işlem'}</h3><button onClick={onClose} className="min-h-11 min-w-11 text-white/50"><X className="mx-auto" size={18} /></button></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-white/55">İşlem türü<select className={`${inputClass} mt-1`} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as 'income' | 'expense', categoryId: '' })}><option value="income">Gelir</option><option value="expense">Gider</option></select></label><label className="text-xs text-white/55">Tutar<input className={`${inputClass} mt-1`} type="number" min="0.01" step="0.01" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} /></label><label className="text-xs text-white/55">Tarih<input className={`${inputClass} mt-1`} type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label><label className="text-xs text-white/55">Hesap<select className={`${inputClass} mt-1`} value={draft.accountId} onChange={(e) => setDraft({ ...draft, accountId: e.target.value })}><option value="">Hesap seç</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-xs text-white/55">Kategori<select className={`${inputClass} mt-1`} value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}><option value="">Kategori seç</option>{matchingCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-xs text-white/55">Açıklama<input className={`${inputClass} mt-1`} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label></div><button disabled={isPending || Number(draft.amount) <= 0 || !draft.accountId || !draft.categoryId} onClick={onSave} className="mt-4 min-h-11 rounded-xl bg-[var(--primary)] px-5 font-bold text-black disabled:opacity-40">{draft.id ? 'Değişiklikleri kaydet' : 'İşlemi ekle'}</button></div>;
}

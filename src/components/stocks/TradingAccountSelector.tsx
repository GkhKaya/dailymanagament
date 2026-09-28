'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Wallet, ChevronDown, Check, Plus, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import { addTradingAccountAction } from '@/actions/futures';
import toast from 'react-hot-toast';

interface TradingAccountSelectorProps {
  accounts: string[];
  selectedAccount: string;
  onSelectAccount: (account: string) => void;
  onAccountsUpdated?: (accounts: string[]) => void;
  isEn?: boolean;
}

export function TradingAccountSelector({
  accounts = ['Ana Hesap', 'Demo Hesabı'],
  selectedAccount = 'all',
  onSelectAccount,
  onAccountsUpdated,
  isEn = false
}: TradingAccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newAccountName.trim();
    if (!clean) return;

    setIsSubmitting(true);
    try {
      const res = await addTradingAccountAction(clean);
      if (res.success && res.accounts) {
        toast.success(isEn ? `Account "${clean}" added` : `"${clean}" hesabı oluşturuldu`);
        if (onAccountsUpdated) {
          onAccountsUpdated(res.accounts);
        }
        onSelectAccount(clean);
        setNewAccountName('');
        setIsAdding(false);
        setIsOpen(false);
      } else {
        toast.error(res.error || (isEn ? "Failed to add account" : "Hesap eklenemedi"));
      }
    } catch {
      toast.error(isEn ? "Connection error" : "Bağlantı hatası");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDemo = selectedAccount.toLowerCase().includes('demo');
  const isMain = selectedAccount === 'Ana Hesap';
  const isAll = selectedAccount === 'all';

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* ── Main Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer select-none ${
          isDemo
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            : isMain
            ? 'bg-[#8ec13b]/10 border-[#8ec13b]/30 text-white hover:bg-[#8ec13b]/20'
            : isAll
            ? 'bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08]'
            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
        }`}
      >
        <Wallet size={15} className={isDemo ? 'text-amber-400' : isMain ? 'text-[#8ec13b]' : 'text-white/60'} />
        
        <span className="truncate max-w-[130px] sm:max-w-[170px]">
          {isAll
            ? (isEn ? "All Accounts" : "Tüm Hesaplar")
            : selectedAccount}
        </span>

        {/* Small Mode Badge */}
        {isDemo && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
            DEMO
          </span>
        )}
        {isMain && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#8ec13b]/20 text-[#8ec13b] border border-[#8ec13b]/30 uppercase tracking-wider">
            {isEn ? "REAL" : "CANLI"}
          </span>
        )}

        <ChevronDown size={14} className={`text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Dropdown Popover ── */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-64 rounded-2xl bg-[#141416] border border-white/10 shadow-2xl p-2 z-50 animate-fadeIn">
          {/* Header */}
          <div className="px-2.5 py-1.5 mb-1 flex items-center justify-between border-b border-white/5">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
              {isEn ? "TRADING ACCOUNTS" : "BORSA HESAPLARI"}
            </span>
            <span className="text-[10px] text-white/30">
              {accounts.length} {isEn ? "accounts" : "hesap"}
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto flex flex-col gap-0.5 py-1">
            {/* All Accounts Option */}
            <button
              type="button"
              onClick={() => { onSelectAccount('all'); setIsOpen(false); }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                selectedAccount === 'all'
                  ? 'bg-white/10 text-white font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-white/40" />
                <span>{isEn ? "All Accounts (Combined)" : "Tüm Hesaplar (Bileşik)"}</span>
              </div>
              {selectedAccount === 'all' && <Check size={14} className="text-[#8ec13b]" />}
            </button>

            {/* Individual Account Options */}
            {accounts.map((acc) => {
              const accIsDemo = acc.toLowerCase().includes('demo');
              const isSelected = selectedAccount === acc;

              return (
                <button
                  key={acc}
                  type="button"
                  onClick={() => { onSelectAccount(acc); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white/10 text-white font-bold'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Wallet size={14} className={accIsDemo ? 'text-amber-400' : 'text-[#8ec13b]'} />
                    <span className="truncate">{acc}</span>
                    {accIsDemo && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                        DEMO
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={14} className="text-[#8ec13b]" />}
                </button>
              );
            })}
          </div>

          {/* Inline Add New Account */}
          <div className="mt-1 pt-1.5 border-t border-white/5">
            {isAdding ? (
              <form onSubmit={handleAddAccount} className="flex flex-col gap-1.5 p-1">
                <input
                  type="text"
                  autoFocus
                  placeholder={isEn ? "Account name (e.g. Midas, Binance)..." : "Hesap adı (örn: Midas, Binance)..."}
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#8ec13b]"
                />
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    type="button"
                    onClick={() => { setIsAdding(false); setNewAccountName(''); }}
                    className="px-2.5 py-1 rounded-lg text-white/50 hover:text-white text-xs cursor-pointer"
                  >
                    {isEn ? "Cancel" : "İptal"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newAccountName.trim()}
                    className="px-3 py-1 rounded-lg bg-[#8ec13b] hover:bg-[#79aa32] text-black font-bold text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (isEn ? "Adding..." : "Ekleniyor...") : (isEn ? "Save" : "Ekle")}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#8ec13b] hover:bg-[#8ec13b]/10 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>{isEn ? "Add New Account..." : "Yeni Hesap Ekle..."}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, CalendarRange, Download, FileText, Layers, X, TrendingUp } from 'lucide-react';
import { getExportDataAction, getExportRangeDataAction, getFinanceExportDataAction, getStocksExportDataAction } from '@/actions/export';
import { generateDailyPDF, generateDateRangePDF, generateFinancePDF, generateMonthlyPDF, generateWeeklyPDF, generateStocksPDF } from '@/lib/pdfGenerator';
import toast from 'react-hot-toast';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate?: Date;
  reportType?: 'health' | 'finance' | 'stocks';
}

function inputDate(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

function getStocksPeriodRange(type: 'daily' | 'weekly' | 'monthly', date: Date) {
  const start = new Date(date);
  const end = new Date(date);
  if (type === 'weekly') {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 6);
  } else if (type === 'monthly') {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);
  }
  return { startDate: inputDate(start), endDate: inputDate(end) };
}

export function ExportPdfModal({ isOpen, onClose, currentDate, reportType = 'health' }: ExportPdfModalProps) {
  const defaultEndDate = inputDate(currentDate || new Date());
  const [startDate, setStartDate] = useState(defaultEndDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedType, setSelectedType] = useState<'daily' | 'weekly' | 'monthly' | 'range'>('daily');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (reportType === 'stocks') {
      // Default to 1 year back for stock history
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      setStartDate(inputDate(oneYearAgo));
    }
  }, [reportType]);

  const isFinance = reportType === 'finance';
  const isStocks = reportType === 'stocks';
  const isRange = isFinance || selectedType === 'range';

  if (!isOpen) return null;

  const handleExport = async () => {
    if (isRange && (!startDate || !endDate || startDate > endDate)) {
      toast.error('Geçerli bir tarih aralığı seçin.');
      return;
    }
    setIsLoading(true);
    try {
      if (isStocks) {
        const range = selectedType === 'range'
          ? { startDate, endDate }
          : getStocksPeriodRange(selectedType, currentDate || new Date());
        const res = await getStocksExportDataAction(range.startDate, range.endDate);
        if (!res.success || !res.data) throw new Error(res.error || 'Borsa rapor verileri alınamadı.');
        generateStocksPDF(res.userName || 'Kullanıcı', res.data);
      } else if (isFinance) {
        const res = await getFinanceExportDataAction(startDate, endDate);
        if (!res.success || !res.data) throw new Error(res.error || 'Rapor verileri alınamadı.');
        generateFinancePDF(res.userName || 'Kullanıcı', res.data);
      } else if (selectedType === 'range') {
        const res = await getExportRangeDataAction(startDate, endDate);
        if (!res.success || !res.days) throw new Error(res.error || 'Rapor verileri alınamadı.');
        generateDateRangePDF(res.userName || 'Kullanıcı', res.startDateStr || startDate, res.endDateStr || endDate, res.days);
      } else {
        const dateStr = inputDate(currentDate || new Date());
        const res = await getExportDataAction(selectedType, dateStr);
        if (!res.success) throw new Error(res.error || 'Rapor verileri alınamadı.');
        const userName = res.userName || 'Kullanıcı';
        if (res.type === 'daily' && res.dailyData) generateDailyPDF(userName, res.dailyData);
        if (res.type === 'weekly' && res.weeklyDays) generateWeeklyPDF(userName, res.startDateStr || '', res.endDateStr || '', res.weeklyDays);
        if (res.type === 'monthly' && res.weeks) generateMonthlyPDF(userName, res.monthName || '', res.weeks);
      }
      toast.success('PDF raporu oluşturuldu.');
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(`PDF oluşturulamadı: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const title = isStocks ? 'Borsa & Portföy PDF Raporu' : isFinance ? 'Finans PDF Raporu' : 'Beslenme PDF Raporu';

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button type="button" aria-label="PDF penceresini kapat" className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="pdf-export-title" className="relative z-10 flex w-full max-w-md flex-col gap-5 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[var(--surface-container)] p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              {isStocks ? <TrendingUp size={21} /> : <CalendarRange size={21} />}
            </div>
            <div>
              <h3 id="pdf-export-title" className="text-base font-bold text-white">{title} İndir</h3>
              <p className="text-xs text-[var(--on-surface-variant)]">{isStocks || isFinance ? 'İki tarih arasındaki kayıtları seçin.' : 'Rapor formatını seçin.'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat" className="min-h-11 min-w-11 rounded-full text-[var(--on-surface-variant)] transition-colors hover:bg-white/5 hover:text-white"><X className="mx-auto" size={18} /></button>
        </div>

        {!isFinance && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'daily', label: 'Günlük', icon: FileText },
              { id: 'weekly', label: 'Haftalık', icon: Calendar },
              { id: 'monthly', label: 'Aylık', icon: Layers },
              { id: 'range', label: 'Tarih aralığı', icon: CalendarRange }
            ].map(option => {
              const Icon = option.icon;
              const active = selectedType === option.id;
              return (
                <button key={option.id} type="button" onClick={() => setSelectedType(option.id as typeof selectedType)} className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-sm font-semibold transition-colors ${active ? 'border-[var(--primary)] bg-[var(--primary)]/15 text-white' : 'border-[rgba(255,255,255,0.08)] bg-white/[0.02] text-[var(--on-surface-variant)] hover:bg-white/[0.05] hover:text-white'}`}>
                  <Icon size={17} className={active ? 'text-[var(--primary)]' : ''} />
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        {isRange && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-white">
            Başlangıç tarihi
            <input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} className="min-h-11 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-3 text-sm text-white [color-scheme:dark] focus:border-[var(--primary)] focus:outline-none" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-white">
            Bitiş tarihi
            <input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} className="min-h-11 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-3 text-sm text-white [color-scheme:dark] focus:border-[var(--primary)] focus:outline-none" />
          </label>
        </div>}

        <p className="rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs leading-5 text-[var(--on-surface-variant)]">
          {isStocks ? 'Seçilen dönemdeki hisse/fon işlemleri, gerçekleşen kâr/zararlar ve açık portföy özeti rapora eklenir.' : isFinance ? 'Gelir, gider ve kart borcu ödeme işlemleri rapora eklenir.' : selectedType === 'range' ? 'Seçilen aralıktaki her gün ayrı sayfada yer alır.' : selectedType === 'daily' ? 'Seçili günün detaylı beslenme ve sağlık özeti hazırlanır.' : selectedType === 'weekly' ? 'Seçili günü içeren haftanın 7 günlük raporu hazırlanır.' : 'Seçili ayın dört haftalık özeti hazırlanır.'}
        </p>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[var(--on-surface-variant)] hover:bg-white/5 hover:text-white">İptal</button>
          <button type="button" onClick={handleExport} disabled={isLoading} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50">
            <Download size={16} /> {isLoading ? 'PDF indiriliyor...' : 'PDF indir'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

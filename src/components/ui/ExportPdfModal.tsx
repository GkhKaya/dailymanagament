"use client";

import React, { useState } from 'react';
import { Download, FileText, Calendar, Layers, X } from 'lucide-react';
import { getExportDataAction } from '@/actions/export';
import { generateDailyPDF, generateWeeklyPDF, generateMonthlyPDF } from '@/lib/pdfGenerator';
import toast from 'react-hot-toast';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate?: Date;
}

export function ExportPdfModal({ isOpen, onClose, currentDate }: ExportPdfModalProps) {
  const [selectedType, setSelectedType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const dateStr = (currentDate || new Date()).toISOString().split('T')[0];
      const res = await getExportDataAction(selectedType, dateStr);

      if (!res.success) {
        toast.error(res.error || "Rapor verileri alınamadı.");
        setIsLoading(false);
        return;
      }

      const userName = res.userName || 'Kullanıcı';

      if (res.type === 'daily' && res.dailyData) {
        generateDailyPDF(userName, res.dailyData);
        toast.success("Günlük PDF raporu başarıyla oluşturuldu!");
      } else if (res.type === 'weekly' && res.weeklyDays) {
        generateWeeklyPDF(userName, res.startDateStr || '', res.endDateStr || '', res.weeklyDays);
        toast.success("Haftalık (7 Sayfa) PDF raporu başarıyla oluşturuldu!");
      } else if (res.type === 'monthly' && res.weeks) {
        generateMonthlyPDF(userName, res.monthName || '', res.weeks);
        toast.success("Aylık (4 Sayfa Özet) PDF raporu başarıyla oluşturuldu!");
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("PDF oluşturulurken hata oluştu: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex justify-center items-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-[var(--surface-container)] rounded-2xl border border-[rgba(255,255,255,0.08)] p-6 shadow-2xl z-10 flex flex-col gap-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Download size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Beslenme PDF Raporu İndir</h3>
              <p className="text-xs text-[var(--on-surface-variant)]">Format tercihinizi seçin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[rgba(255,255,255,0.05)] text-[var(--on-surface-variant)] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {/* Daily Option */}
          <button
            type="button"
            onClick={() => setSelectedType('daily')}
            className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all text-left ${
              selectedType === 'daily'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] text-[var(--on-surface-variant)] hover:border-[rgba(255,255,255,0.12)]'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${selectedType === 'daily' ? 'bg-emerald-500 text-black' : 'bg-[rgba(255,255,255,0.05)] text-white'}`}>
              <FileText size={18} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-white">Günlük Özet (1 Sayfa)</span>
              <span className="text-xs text-[var(--on-surface-variant)]">
                Seçili günün detaylı yemek listesi, besin değerleri, egzersiz, BMR ve uyku harcaması.
              </span>
            </div>
          </button>

          {/* Weekly Option */}
          <button
            type="button"
            onClick={() => setSelectedType('weekly')}
            className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all text-left ${
              selectedType === 'weekly'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] text-[var(--on-surface-variant)] hover:border-[rgba(255,255,255,0.12)]'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${selectedType === 'weekly' ? 'bg-emerald-500 text-black' : 'bg-[rgba(255,255,255,0.05)] text-white'}`}>
              <Calendar size={18} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-white">Haftalık Rapor (7 Sayfa)</span>
              <span className="text-xs text-[var(--on-surface-variant)]">
                Her sayfa 1 gün olacak şekilde 7 günlük tam detaylı beslenme ve sağlık karnesi.
              </span>
            </div>
          </button>

          {/* Monthly Option */}
          <button
            type="button"
            onClick={() => setSelectedType('monthly')}
            className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all text-left ${
              selectedType === 'monthly'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] text-[var(--on-surface-variant)] hover:border-[rgba(255,255,255,0.12)]'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${selectedType === 'monthly' ? 'bg-emerald-500 text-black' : 'bg-[rgba(255,255,255,0.05)] text-white'}`}>
              <Layers size={18} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-white">Aylık Özet (4 Sayfa)</span>
              <span className="text-xs text-[var(--on-surface-variant)]">
                Yemek detayları olmadan 4 haftanın günlük kalori, makro ve haftalık toplam verileri.
              </span>
            </div>
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--on-surface-variant)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <span>PDF Hazırlanıyor...</span>
            ) : (
              <>
                <Download size={15} />
                <span>PDF İndir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

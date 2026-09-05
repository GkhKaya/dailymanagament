"use client";

import { t } from '@/lib/i18n';
import React from 'react';
import { Activity } from 'lucide-react';
import { useAddExerciseViewModel } from '@/viewmodels/useAddExerciseViewModel';
import { useTranslation } from '@/hooks/useTranslation';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function AddExerciseForm({ onClose, onSuccess, userWeight = 70, currentDate }: { onClose: () => void, onSuccess: () => void, userWeight?: number, currentDate?: string }) {
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';

  const {
    exerciseType, handleExerciseTypeChange,
    durationMinutes, handleDurationChange,
    stepCount, handleStepCountChange,
    burnedCalories, setBurnedCalories,
    isLoading, handleSubmit
  } = useAddExerciseViewModel(onSuccess, userWeight, currentDate);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-4">
        {/* Egzersiz Tipi */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.exerciseType')}</label>
          <select 
            value={exerciseType}
            onChange={(e) => handleExerciseTypeChange(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all appearance-none cursor-pointer"
          >
            <option value="Koşu" className="bg-[#1A1A26]">{isEn ? "Running" : "Koşu"}</option>
            <option value="Yürüyüş" className="bg-[#1A1A26]">{isEn ? "Walking" : "Yürüyüş"}</option>
            <option value="Ağırlık Antrenmanı" className="bg-[#1A1A26]">{isEn ? "Weight Training" : "Ağırlık Antrenmanı"}</option>
            <option value="Bisiklet" className="bg-[#1A1A26]">{isEn ? "Cycling" : "Bisiklet"}</option>
            <option value="Yüzme" className="bg-[#1A1A26]">{isEn ? "Swimming" : "Yüzme"}</option>
            <option value="Yoga" className="bg-[#1A1A26]">Yoga</option>
            <option value="Adım Sayısı" className="bg-[#1A1A26]">{isEn ? "Step Count" : "Adım Sayısı"}</option>
          </select>
        </div>

        {exerciseType === 'Adım Sayısı' ? (
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider" htmlFor="step-count">
              {isEn ? "Step Count" : "Adım Sayısı"}
            </label>
            <input
              id="step-count"
              type="number"
              inputMode="numeric"
              min="1"
              required
              value={stepCount}
              onChange={(e) => handleStepCountChange(e.target.value)}
              placeholder="10000"
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.duration')}</label>
            <input 
              type="number" 
              required
              value={durationMinutes}
              onChange={(e) => handleDurationChange(e.target.value)}
              placeholder="45" 
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 px-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
        )}

        {/* Yakılan Kalori */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">{t('forms.burnedCalories')}</label>
          <div className="relative">
            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={20} />
            <input 
              type="number" 
              required
              value={burnedCalories}
              onChange={(e) => setBurnedCalories(e.target.value)}
              placeholder="350" 
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-12 pr-4 text-[var(--font-headline)] font-semibold text-orange-400 focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
          <span className="text-caption text-[var(--on-surface-variant)] mt-1 ml-2">
            {exerciseType === 'Adım Sayısı' 
              ? (isEn ? 'Estimated based on your weight and steps and added to BMR total.' : 'Kilon ve adım sayına göre tahmini olarak hesaplanır ve BMR toplamına eklenir.')
              : (isEn ? 'Estimated based on your activity data. Using smartwatch readings is recommended.' : 'Bu bilgilerine göre tahmini bir kaloridir. Akıllı saat ile ölçtüğün veriyi girmen daha sağlıklı olacaktır.')}
          </span>
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors cursor-pointer">
          {isEn ? "Cancel" : "İptal"}
        </button>
        <button type="submit" disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50">
          {isLoading ? <LoadingSpinner size="sm" /> : (isEn ? "Save Exercise" : "Egzersizi Kaydet")}
        </button>
      </div>
    </form>
  );
}

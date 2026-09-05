"use client";

import React, { useState } from 'react';
import { ArrowRight, SkipForward, Flame, Activity } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';

export function OnboardingHealth({ viewModel }: { viewModel: ReturnType<typeof import("@/viewmodels/useOnboardingViewModel").useOnboardingViewModel> }) {
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';

  const {
    age,
    handleAgeChange,
    handleBirthDateChange,
    birthDate, setBirthDate,
    weight, setWeight,
    height, setHeight,
    targetWeight, setTargetWeight,
    gender, setGender,
    activityLevel, setActivityLevel,
    goal, setGoal,
    targetCalories,
    isLoading,
    saveHealthAndContinue,
    skipHealth,
    skipToDashboard,
    isDirectHealthStep
  } = viewModel;

  const [showDatePicker, setShowDatePicker] = useState(false);

  const activityOptions = [
    { 
      id: 'sedentary', 
      label: isEn ? 'Desk Job / Sedentary' : 'Masa Başı / Hareketsiz', 
      desc: isEn ? 'Mostly sitting during the day' : 'Genelde oturarak çalışıyorum' 
    },
    { 
      id: 'light', 
      label: isEn ? 'Light Exercise' : 'Hafif Egzersiz', 
      desc: isEn ? '1-3 days of workout per week' : 'Haftada 1-3 gün spor' 
    },
    { 
      id: 'moderate', 
      label: isEn ? 'Moderate Exercise' : 'Orta Egzersiz', 
      desc: isEn ? '3-5 days of workout per week' : 'Haftada 3-5 gün spor' 
    },
    { 
      id: 'active', 
      label: isEn ? 'Active Exercise' : 'Sıkı Egzersiz', 
      desc: isEn ? '6-7 days of workout per week' : 'Haftada 6-7 gün spor' 
    },
    { 
      id: 'very_active', 
      label: isEn ? 'Very Heavy Exercise' : 'Çok Ağır Egzersiz', 
      desc: isEn ? 'Twice a day or heavy labor' : 'Günde 2 kez vb.' 
    }
  ];

  return (
    <div className="flex flex-col animate-slide-up w-full max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <h2 suppressHydrationWarning className="text-2xl font-bold text-white">
              {isEn ? "Health & Physical Info" : "Sağlık & Fiziksel Bilgiler"}
            </h2>
            <p suppressHydrationWarning className="text-sm text-[var(--on-surface-variant)]">
              {isEn ? "We will calculate your target calories & BMR." : "Hedef kaloriniz ve BMR'ınız hesaplanacak."}
            </p>
          </div>
        </div>

        <button 
          type="button"
          onClick={skipToDashboard}
          className="text-xs text-[var(--on-surface-variant)] hover:text-white flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors shrink-0 cursor-pointer"
        >
          <span>{isEn ? "Dashboard ›" : "Ana Sayfa ›"}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Gender */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
            {isEn ? "Gender" : "Cinsiyet"}
          </label>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setGender('Male')}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all ${gender === 'Male' ? 'bg-[var(--primary)] text-black shadow-sm border border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)]'}`}
            >
              {isEn ? "Male" : "Erkek"}
            </button>
            <button 
              type="button"
              onClick={() => setGender('Female')}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all ${gender === 'Female' ? 'bg-[var(--primary)] text-black shadow-sm border border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)]'}`}
            >
              {isEn ? "Female" : "Kadın"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Age / Birth Date */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
              {showDatePicker ? (isEn ? "Birth Date" : "Doğum Tarihi") : (isEn ? "Age" : "Yaş")}
            </label>
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="text-[10px] text-[var(--primary)] hover:underline cursor-pointer"
            >
              {showDatePicker 
                ? (isEn ? "Enter Age" : "Yaş Gir") 
                : (isEn ? "Pick Date" : "Tarih Seç")}
            </button>
          </div>
          {showDatePicker ? (
            <input 
              type="date" 
              value={birthDate}
              onChange={(e) => handleBirthDateChange(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 px-4 text-white focus:border-green-400 focus:outline-none transition-colors [color-scheme:dark]"
            />
          ) : (
            <input 
              type="number" 
              value={age}
              min="10"
              max="115"
              placeholder="25"
              onChange={(e) => handleAgeChange(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 px-4 text-white focus:border-green-400 focus:outline-none transition-colors"
            />
          )}
        </div>
        {/* Height */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
            {isEn ? "Height (cm)" : "Boy (cm)"}
          </label>
          <input 
            type="number" 
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="175"
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 px-4 text-white focus:border-green-400 focus:outline-none transition-colors"
          />
        </div>
        {/* Weight */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
            {isEn ? "Weight (kg)" : "Kilo (kg)"}
          </label>
          <input 
            type="number" 
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="70"
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 px-4 text-white focus:border-green-400 focus:outline-none transition-colors"
          />
        </div>
        {/* Target Weight */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
            {isEn ? "Target Weight" : "Hedef Kilo"}
          </label>
          <input 
            type="number" 
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="65"
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 px-4 text-white focus:border-green-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
          {isEn ? "Your Goal" : "Hedefiniz"}
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button 
            type="button"
            onClick={() => setGoal('lose')}
            className={`py-3 rounded-xl text-sm font-medium transition-colors ${goal === 'lose' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            {isEn ? "Lose Weight" : "Kilo Ver"}
          </button>
          <button 
            type="button"
            onClick={() => setGoal('maintain')}
            className={`py-3 rounded-xl text-sm font-medium transition-colors ${goal === 'maintain' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            {isEn ? "Maintain" : "Sabit Kal"}
          </button>
          <button 
            type="button"
            onClick={() => setGoal('gain')}
            className={`py-3 rounded-xl text-sm font-medium transition-colors ${goal === 'gain' ? 'bg-green-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            {isEn ? "Gain Weight" : "Kilo Al"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
          {isEn ? "Activity Level" : "Hareket Düzeyi"}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activityOptions.map((lvl) => (
            <div 
              key={lvl.id}
              onClick={() => setActivityLevel(lvl.id as any)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activityLevel === lvl.id 
                  ? 'bg-green-500/10 border-green-500/30 text-white' 
                  : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)]'
              }`}
            >
              <div className={`font-medium mb-1 ${activityLevel === lvl.id ? 'text-green-400' : 'text-white'}`}>
                {lvl.label}
              </div>
              <div className="text-xs opacity-70">{lvl.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {targetCalories > 0 && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 text-center animate-fade-in">
          <p className="text-[var(--on-surface-variant)] text-sm mb-2">
            {isEn ? "Daily Target For Your Goal" : "Hedefiniz İçin Günlük İhtiyacınız"}
          </p>
          <div className="flex items-center justify-center gap-2 text-3xl font-bold text-green-400">
            <Flame size={28} />
            {targetCalories} kcal
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-auto pt-4 border-t border-white/10">
        <button 
          type="button"
          onClick={skipHealth}
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <SkipForward size={18} />
          <span>
            {isDirectHealthStep 
              ? (isEn ? "Back to Dashboard" : "Ana Sayfaya Dön") 
              : (isEn ? "Skip" : "Atla")}
          </span>
        </button>
        <button 
          type="button"
          onClick={saveHealthAndContinue}
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : (
            <>
              <span>
                {isDirectHealthStep 
                  ? (isEn ? "Save & Return to Dashboard" : "Kaydet ve Ana Sayfaya Dön") 
                  : (isEn ? "Save and Continue to Finance" : "Kaydet ve Finans'a Geç")}
              </span>
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

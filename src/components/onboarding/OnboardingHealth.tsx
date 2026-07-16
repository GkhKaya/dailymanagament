import React from 'react';
import { ArrowRight, SkipForward, Flame, Activity } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function OnboardingHealth({ viewModel }: { viewModel: ReturnType<typeof import("@/viewmodels/useOnboardingViewModel").useOnboardingViewModel> }) {
  const {
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
    skipHealth
  } = viewModel;

  return (
    <div className="flex flex-col animate-slide-up w-full max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center">
          <Activity size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Sağlık & Fiziksel Bilgiler</h2>
          <p className="text-sm text-[var(--on-surface-variant)]">Hedef kaloriniz hesaplanacak.</p>
        </div>
      </div>

      

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Cinsiyet */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Cinsiyet</label>
          <div className="flex gap-2">
            <button 
              onClick={() => setGender('Male')}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all ${gender === 'Male' ? 'bg-[var(--primary)] text-black shadow-sm border border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)]'}`}
            >
              Erkek
            </button>
            <button 
              onClick={() => setGender('Female')}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all ${gender === 'Female' ? 'bg-[var(--primary)] text-black shadow-sm border border-[rgba(255,255,255,0.1)]' : 'bg-[rgba(255,255,255,0.03)] text-[var(--on-surface-variant)] hover:bg-[rgba(255,255,255,0.06)]'}`}
            >
              Kadın
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Doğum Tarihi */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Doğum Tarihi</label>
          <input 
            type="date" 
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 px-4 text-white focus:border-green-400 focus:outline-none transition-colors"
          />
        </div>
        {/* Boy */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Boy (cm)</label>
          <input 
            type="number" 
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="175"
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 px-4 text-white focus:border-green-400 focus:outline-none transition-colors"
          />
        </div>
        {/* Kilo */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Kilo (kg)</label>
          <input 
            type="number" 
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="70"
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-3 px-4 text-white focus:border-green-400 focus:outline-none transition-colors"
          />
        </div>
        {/* Hedef Kilo */}
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Hedef Kilo</label>
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
        <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Hedefiniz</label>
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => setGoal('lose')}
            className={`py-3 rounded-xl text-sm font-medium transition-colors ${goal === 'lose' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            Kilo Ver
          </button>
          <button 
            onClick={() => setGoal('maintain')}
            className={`py-3 rounded-xl text-sm font-medium transition-colors ${goal === 'maintain' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            Sabit Kal
          </button>
          <button 
            onClick={() => setGoal('gain')}
            className={`py-3 rounded-xl text-sm font-medium transition-colors ${goal === 'gain' ? 'bg-green-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            Kilo Al
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">Hareket Düzeyi</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'sedentary', label: 'Masa Başı / Hareketsiz', desc: 'Genelde oturarak çalışıyorum' },
            { id: 'light', label: 'Hafif Egzersiz', desc: 'Haftada 1-3 gün spor' },
            { id: 'moderate', label: 'Orta Egzersiz', desc: 'Haftada 3-5 gün spor' },
            { id: 'active', label: 'Sıkı Egzersiz', desc: 'Haftada 6-7 gün spor' },
            { id: 'very_active', label: 'Çok Ağır Egzersiz', desc: 'Günde 2 kez vb.' }
          ].map((lvl) => (
            <div 
              key={lvl.id}
              onClick={() => setActivityLevel(lvl.id as any)}
              className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                activityLevel === lvl.id 
                  ? 'bg-green-500/10 border-green-500/50 text-white' 
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
          <p className="text-[var(--on-surface-variant)] text-sm mb-2">Hedefiniz İçin Günlük İhtiyacınız</p>
          <div className="flex items-center justify-center gap-2 text-3xl font-bold text-green-400">
            <Flame size={28} />
            {targetCalories} kcal
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-auto pt-4 border-t border-white/10">
        <button 
          onClick={skipHealth}
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          <SkipForward size={18} />
          <span>Atla</span>
        </button>
        <button 
          onClick={saveHealthAndContinue}
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : (
            <>
              <span>Kaydet ve Finans'a Geç</span>
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

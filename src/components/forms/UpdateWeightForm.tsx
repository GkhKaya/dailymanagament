import React from 'react';
import { Scale } from 'lucide-react';
import { useUpdateWeightViewModel } from '@/viewmodels/useUpdateWeightViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { t } from '@/lib/i18n';

export function UpdateWeightForm({ onClose, onSuccess, initialWeight }: { onClose: () => void, onSuccess: () => void, initialWeight?: number }) {
  const { weight, setWeight, isLoading, handleSubmit } = useUpdateWeightViewModel(onSuccess, initialWeight);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="text-body text-[var(--on-surface-variant)] mb-2">
        {t("profile.updateWeight.description")}
      </div>
      
      
      
      <div className="flex flex-col gap-2">
        <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
          {t("profile.updateWeight.weightLabel")}
        </label>
        <div className="relative">
          <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
          <input 
            type="number" 
            step="0.1"
            min="30"
            max="300"
            required
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={initialWeight ? `Mevcut kilonuz: ${initialWeight} kg` : "Örn: 70.5 (Kayıtlı kilonuz yok)"}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
          />
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button type="submit" disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors flex items-center justify-center">
          {isLoading ? <LoadingSpinner size="sm" /> : t("profile.updateWeight.submit")}
        </button>
      </div>
    </form>
  );
}

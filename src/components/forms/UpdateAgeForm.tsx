import React from 'react';
import { CalendarDays } from 'lucide-react';
import { useUpdateAgeViewModel } from '@/viewmodels/useUpdateAgeViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { t } from '@/lib/i18n';

export function UpdateAgeForm({ onClose, onSuccess, initialBirthDate }: { onClose: () => void, onSuccess: () => void, initialBirthDate?: string | null }) {
  const { birthDate, setBirthDate, isLoading, handleSubmit } = useUpdateAgeViewModel(onSuccess, initialBirthDate);
  const [inputType, setInputType] = React.useState('text');

  let ageHint = "Doğum tarihinizi seçin (Kayıtlı yaşınız yok)";
  if (initialBirthDate) {
    const age = new Date().getFullYear() - new Date(initialBirthDate).getFullYear();
    ageHint = `Mevcut yaşınız: ${age}`;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="text-body text-[var(--on-surface-variant)] mb-2">
        {t("profile.updateAge.description")}
      </div>
      
      
      
      <div className="flex flex-col gap-2">
        <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
          {t("profile.updateAge.dateLabel")}
        </label>
        <div className="relative">
          <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
          <input 
            type={inputType} 
            required
            value={birthDate}
            onFocus={() => setInputType('date')}
            onBlur={() => { if (!birthDate) setInputType('text'); }}
            placeholder={ageHint}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all [color-scheme:dark]"
          />
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button type="submit" disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors flex items-center justify-center">
          {isLoading ? <LoadingSpinner size="sm" /> : t("profile.updateAge.submit")}
        </button>
      </div>
    </form>
  );
}

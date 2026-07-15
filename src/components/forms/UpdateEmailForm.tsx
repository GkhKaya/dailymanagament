import React from 'react';
import { Mail } from 'lucide-react';
import { useUpdateEmailViewModel } from '@/viewmodels/useUpdateEmailViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { t } from '@/lib/i18n';

export function UpdateEmailForm({ onClose, onSuccess, initialEmail }: { onClose: () => void, onSuccess: () => void, initialEmail: string }) {
  const { currentEmail, setCurrentEmail, newEmail, setNewEmail, isLoading, error, handleSubmit } = useUpdateEmailViewModel(onSuccess, initialEmail);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="text-body text-[var(--on-surface-variant)] mb-2">
        {t("profile.updateEmail.description")}
      </div>
      
      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 text-red-200 text-sm border border-red-500/30">
          {error}
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
          Mevcut E-posta
        </label>
        <div className="relative mb-4">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
          <input 
            type="email" 
            required
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            placeholder="Mevcut e-posta adresiniz"
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
          />
        </div>
        <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
          {t("profile.updateEmail.newEmailLabel")}
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
          <input 
            type="email" 
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={t("profile.updateEmail.newEmailPlaceholder")}
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
          />
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          İptal
        </button>
        <button type="submit" disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold transition-colors flex items-center justify-center">
          {isLoading ? <LoadingSpinner size="sm" /> : t("profile.updateEmail.submit")}
        </button>
      </div>
    </form>
  );
}

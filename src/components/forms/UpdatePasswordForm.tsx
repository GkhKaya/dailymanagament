import React from 'react';
import { Key } from 'lucide-react';
import { useUpdatePasswordViewModel } from '@/viewmodels/useUpdatePasswordViewModel';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';

export function UpdatePasswordForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';
  const { 
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    isLoading, handleSubmit 
  } = useUpdatePasswordViewModel(onSuccess);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="text-body text-[var(--on-surface-variant)] mb-2">
        {isEn 
          ? "Choose a strong password with at least 8 characters." 
          : "En az 8 karakterden oluşan güçlü bir şifre seçin."}
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
            {isEn ? "Current Password" : "Mevcut Şifre"}
          </label>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
            <input 
              type="password" 
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
            {isEn ? "New Password" : "Yeni Şifre"}
          </label>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
            <input 
              type="password" 
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-caption text-[var(--on-surface-variant)] uppercase tracking-wider">
            {isEn ? "Confirm New Password" : "Yeni Şifre (Tekrar)"}
          </label>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={18} />
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-2xl py-4 pl-10 pr-4 text-body text-white focus:outline-none focus:border-[var(--primary)] focus:bg-[rgba(255,255,255,0.05)] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-medium transition-colors">
          {isEn ? "Cancel" : "İptal"}
        </button>
        <button type="submit" disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold transition-colors flex items-center justify-center">
          {isLoading ? <LoadingSpinner size="sm" /> : (isEn ? "Save" : "Kaydet")}
        </button>
      </div>
    </form>
  );
}

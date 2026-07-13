import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export function useUpdatePasswordViewModel(onSuccess: () => void) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!currentPassword) throw new Error("Mevcut şifrenizi girmelisiniz.");
      if (newPassword.length < 6) throw new Error("Yeni şifreniz en az 6 karakter olmalıdır.");
      if (newPassword !== confirmPassword) throw new Error("Yeni şifreler eşleşmiyor.");

      const res = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true
      });

      if (res.error) {
        throw new Error(res.error.message || "Şifre güncellenirken bir hata oluştu.");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    isLoading, error, handleSubmit
  };
}

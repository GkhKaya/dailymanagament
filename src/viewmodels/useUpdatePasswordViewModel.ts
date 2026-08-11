import toast from 'react-hot-toast';
import { useState } from 'react';
import { updatePasswordAction } from '@/actions/profile';

export function useUpdatePasswordViewModel(onSuccess: () => void) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      if (!currentPassword) throw new Error("Mevcut şifrenizi girmelisiniz.");
      if (newPassword.length < 6) throw new Error("Yeni şifreniz en az 6 karakter olmalıdır.");
      if (newPassword !== confirmPassword) throw new Error("Yeni şifreler eşleşmiyor.");

      const res = await updatePasswordAction(currentPassword, newPassword);

      if (!res.success) {
        throw new Error(res.error || "Şifre güncellenirken bir hata oluştu.");
      }

      toast.success("Şifre başarıyla güncellendi!");
      onSuccess();
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    isLoading, handleSubmit
  };
}

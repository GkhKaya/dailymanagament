import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export function useUpdateEmailViewModel(onSuccess: () => void, initialEmail: string) {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!currentEmail) throw new Error("Mevcut e-posta adresi zorunludur.");
      if (currentEmail !== initialEmail) throw new Error("Girdiğiniz mevcut e-posta adresi hatalı.");
      if (!newEmail) throw new Error("Yeni e-posta adresi zorunludur.");
      
      const res = await authClient.changeEmail({
        newEmail,
        callbackURL: "/"
      });

      if (res.error) {
        throw new Error(res.error.message || "E-posta güncellenirken bir hata oluştu.");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentEmail, setCurrentEmail,
    newEmail, setNewEmail,
    isLoading, error, handleSubmit
  };
}

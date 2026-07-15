import toast from 'react-hot-toast';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export function useUpdateEmailViewModel(onSuccess: () => void, initialEmail: string) {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentEmail, setCurrentEmail,
    newEmail, setNewEmail,
    isLoading, handleSubmit
  };
}

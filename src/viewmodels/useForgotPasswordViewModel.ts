import { useState, FormEvent } from 'react';
import { forgotPasswordAction } from '@/actions/auth';

export function useForgotPasswordViewModel() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      
      const result = await forgotPasswordAction(formData);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'İşlem başarısız oldu.');
      }
    } catch (e: unknown) {
      const err = e as Error;
      setError('Beklenmedik bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    handleResetPassword,
    loading,
    error,
    success,
  };
}

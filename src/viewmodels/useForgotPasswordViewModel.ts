import toast from 'react-hot-toast';
import { useState, FormEvent } from 'react';
import { forgotPasswordAction } from '@/actions/auth';

export function useForgotPasswordViewModel() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      
      const result = await forgotPasswordAction(formData);
      
      if (result.success) {
        setSuccess(true);
      } else {
        toast.error(result.error || 'İşlem başarısız oldu.');
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error('Beklenmedik bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    handleResetPassword,
    loading,
    success,
  };
}

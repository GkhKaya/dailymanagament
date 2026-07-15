import toast from 'react-hot-toast';
import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPasswordAction } from '@/actions/auth';

export function useResetPasswordViewModel() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setSuccess(false);
    
    if (password !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor.');
      setLoading(false);
      return;
    }

    if (!token) {
      toast.error('Geçersiz veya süresi dolmuş bağlantı.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('newPassword', password);
      formData.append('token', token);
      
      const result = await resetPasswordAction(formData);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 3000);
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
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    handleResetPassword,
    loading,
    success,
    hasToken: !!token,
  };
}

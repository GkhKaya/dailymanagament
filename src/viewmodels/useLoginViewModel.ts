import toast from 'react-hot-toast';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function useLoginViewModel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    
    try {
      const { data: signInError } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      });
      
      if (data && !signInError) {
        router.push('/dashboard');
      } else {
        toast.error(signInError?.message || 'Giriş başarısız oldu.');
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error('Giriş yapılırken beklenmedik bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    handleLogin,
    loading,
  };
}

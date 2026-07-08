import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function useRegisterViewModel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name: username,
      });
      
      if (data && !signUpError) {
        router.push('/dashboard');
      } else {
        setError(signUpError?.message || 'Kayıt başarısız oldu.');
      }
    } catch (err: any) {
      setError('Kayıt olurken beklenmedik bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    username,
    setUsername,
    age,
    setAge,
    handleRegister,
    loading,
    error,
  };
}

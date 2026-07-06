import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function useLoginViewModel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Connect to actual authentication service
    console.log('Login attempt:', { email, password, rememberMe });
    router.push('/dashboard');
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    handleLogin,
  };
}

import { useState, FormEvent } from 'react';

export function useLoginViewModel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Connect to authentication service
    console.log('Login attempt:', { email, password, rememberMe });
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

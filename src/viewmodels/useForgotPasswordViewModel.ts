import { useState, FormEvent } from 'react';

export function useForgotPasswordViewModel() {
  const [email, setEmail] = useState('');

  const handleResetPassword = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Connect to authentication service for sending reset link
    console.log('Reset password attempt for:', email);
  };

  return {
    email,
    setEmail,
    handleResetPassword,
  };
}

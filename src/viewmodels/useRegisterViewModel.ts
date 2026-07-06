import { useState, FormEvent } from 'react';

export function useRegisterViewModel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Connect to authentication service for registration
    console.log('Register attempt:', { email, password, username, age });
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
  };
}

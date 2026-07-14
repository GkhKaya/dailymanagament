import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { updateAgeAction } from '@/actions/profile';
import { Alert } from '@/lib/alerts';
import { t } from '@/lib/i18n';

export function useRegisterViewModel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.error(t('errors.validation.invalidEmail'));
      return;
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.error(t('errors.validation.weakPassword'));
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name: username,
      });
      
      if (data && !signUpError) {
        if (age) {
          const currentYear = new Date().getFullYear();
          const birthDate = new Date();
          birthDate.setFullYear(currentYear - parseInt(age));
          await updateAgeAction(birthDate.toISOString());
        }
        Alert.success('Kayıt başarılı! Lütfen giriş yapın.');
        router.push('/onboarding');
      } else {
        Alert.error(signUpError?.message || 'Kayıt başarısız oldu.');
      }
    } catch (e: unknown) {
      const err = e as Error;
      Alert.error(err.message || 'Kayıt olurken beklenmedik bir hata oluştu.');
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
  };
}

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Alert } from '@/lib/alerts';
import { t } from '@/lib/i18n';
import { checkUsernameUniqueAction, saveRegistrationDataAction } from '@/actions/user';

export function useRegisterViewModel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
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
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.error(t('errors.validation.weakPassword'));
      return;
    }

    setLoading(true);

    try {
      // 1. Check uniqueness
      const uniqueRes = await checkUsernameUniqueAction(username);
      if (!uniqueRes.isUnique) {
        Alert.error("Bu kullanıcı adı zaten alınmış, lütfen başka bir tane seçin.");
        setLoading(false);
        return;
      }

      // 2. Register
      const { data, error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name: username,
      });
      
      if (data && !signUpError) {
        Alert.success('Hesap kurma ekranına yönlendiriliyorsunuz...');
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
    handleRegister,
    loading,
  };
}

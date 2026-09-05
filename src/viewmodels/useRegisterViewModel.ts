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
      const isEn = typeof window !== 'undefined' && (localStorage.getItem('dailym-lang') === 'en' || document.cookie.includes('NEXT_LOCALE=en'));

      // 1. Check uniqueness
      const uniqueRes = await checkUsernameUniqueAction(username);
      if (!uniqueRes.isUnique) {
        Alert.error(isEn ? "This username is already taken, please choose another." : "Bu kullanıcı adı zaten alınmış, lütfen başka bir tane seçin.");
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
        try {
          await saveRegistrationDataAction({ username });
        } catch (saveErr) {
          console.error("Save registration data err:", saveErr);
        }

        if (typeof window !== 'undefined') {
          localStorage.removeItem('dailym-product-tour-completed');
          localStorage.removeItem('dailym-residence-completed');
          
          if (isEn) {
            localStorage.setItem('dailym-is-abroad', '1');
            localStorage.setItem('dailym-country', 'US');
            localStorage.setItem('dailym-lang', 'en');
            document.cookie = 'IS_ABROAD=1; path=/; max-age=31536000';
            document.cookie = 'USER_COUNTRY=US; path=/; max-age=31536000';
            document.cookie = 'NEXT_LOCALE=en; path=/; max-age=31536000';
          } else {
            localStorage.removeItem('dailym-is-abroad');
            localStorage.removeItem('dailym-country');
            document.cookie = 'IS_ABROAD=0; path=/; max-age=0';
            document.cookie = 'USER_COUNTRY=; path=/; max-age=0';
          }
        }
        Alert.success(isEn ? 'Redirecting to setup...' : 'Hesap kurma ekranına yönlendiriliyorsunuz...');
        router.push('/onboarding');
      } else {
        Alert.error(signUpError?.message || (isEn ? 'Registration failed.' : 'Kayıt başarısız oldu.'));
      }
    } catch (e: unknown) {
      const isEn = typeof window !== 'undefined' && localStorage.getItem('dailym-lang') === 'en';
      const err = e as Error;
      Alert.error(err.message || (isEn ? 'An unexpected error occurred during registration.' : 'Kayıt olurken beklenmedik bir hata oluştu.'));
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

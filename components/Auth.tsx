import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import LogoIcon from './icons/LogoIcon';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // The user will be logged in automatically if email confirmation is disabled.
        // No message is needed here.
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      if (isMounted.current) {
        setError(error.error_description || error.message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <div className="w-full max-w-sm p-8 space-y-8 bg-base-200 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center space-y-2">
            <LogoIcon className="h-12 w-12 text-primary" />
            <h1 className="text-2xl font-bold text-center">
              {isSignUp ? 'Создать аккаунт' : 'Добро пожаловать в Numizmapp'}
            </h1>
        </div>
        <form className="space-y-6" onSubmit={handleAuth}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-base-content/80">
              Адрес электронной почты
            </label>
            <input
              id="email"
              className="mt-1 block w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm placeholder-base-content/50
                         focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              type="email"
              placeholder="you@example.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password"  className="text-sm font-medium text-base-content/80">
                Пароль
            </label>
            <input
              id="password"
              className="mt-1 block w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm placeholder-base-content/50
                         focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              type="password"
              placeholder="••••••••"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-black bg-primary hover:scale-105 transition-transform disabled:opacity-50"
          >
            {loading ? 'Обработка...' : (isSignUp ? 'Регистрация' : 'Войти')}
          </button>
        </form>
        {error && <p className="text-sm text-center text-red-500">{error}</p>}
        {message && <p className="text-sm text-center text-green-500">{message}</p>}
        <p className="text-sm text-center text-base-content/70">
          {isSignUp ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
          <button onClick={() => {setIsSignUp(!isSignUp); setError(null)}} className="font-medium text-primary hover:underline">
            {isSignUp ? 'Войти' : 'Регистрация'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
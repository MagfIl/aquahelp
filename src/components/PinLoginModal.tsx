import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Delete, Lock, AlertCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PinLoginModalProps {
  onSuccess?: () => void;
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({ onSuccess }) => {
  const { loginWithPin, isAuthenticated } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = useCallback(
    (code: string) => {
      if (!code || lockoutSeconds > 0) return;
      const result = loginWithPin(code);
      if (result.success) {
        setError(null);
        setPin('');
        setFailedAttempts(0);
        onSuccess?.();
      } else {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);

        if (nextFailed >= 5) {
          setLockoutSeconds(30);
          setError('Слишком много неверных попыток. Блокировка на 30 секунд.');
          setPin('');
        } else {
          setError(
            result.error
              ? `${result.error} (осталось попыток: ${5 - nextFailed})`
              : `Неверный PIN-код (попытка ${nextFailed} из 5)`
          );
          setTimeout(() => {
            setPin('');
          }, 300);
        }
      }
    },
    [loginWithPin, onSuccess, failedAttempts, lockoutSeconds]
  );

  // Global keydown listener for seamless typing without clicking on any input
  useEffect(() => {
    if (isAuthenticated || lockoutSeconds > 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Digits from main keyboard or Numpad
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setError(null);
        setPin((prev) => {
          if (prev.length >= 6) return prev;
          const next = prev + e.key;
          // Auto submit when 6 digits are entered
          if (next.length === 6) {
            setTimeout(() => handleSubmit(next), 50);
          }
          return next;
        });
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setError(null);
        setPin((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length === 6) {
          handleSubmit(pin);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPin('');
        setError(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, pin, handleSubmit, lockoutSeconds]);

  const handleKeypadClick = (digit: string) => {
    if (lockoutSeconds > 0) return;
    setError(null);
    if (pin.length >= 6) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 6) {
      setTimeout(() => handleSubmit(next), 50);
    }
  };

  const handleBackspace = () => {
    if (lockoutSeconds > 0) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (lockoutSeconds > 0) return;
    setError(null);
    setPin('');
  };

  if (isAuthenticated) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: isShaking ? [-8, 8, -6, 6, -3, 3, 0] : 0,
        }}
        transition={{ duration: isShaking ? 0.4 : 0.25 }}
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center"
      >
        {/* Header Icon */}
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800/60 shadow-sm">
          {lockoutSeconds > 0 ? (
            <ShieldAlert className="h-7 w-7 text-rose-500 animate-pulse" />
          ) : (
            <Lock className="h-7 w-7" />
          )}
        </div>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          Авторизация сотрудника
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {lockoutSeconds > 0
            ? `Ввод заблокирован на ${lockoutSeconds} сек.`
            : 'Введите персональный 6-значный PIN-код'}
        </p>

        {/* 6-Digit PIN Indicators Display */}
        <div className="my-6 flex items-center justify-center gap-3">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const hasDigit = pin.length > idx;
            return (
              <div
                key={idx}
                className={`h-4 w-4 rounded-full transition-all duration-150 ${
                  hasDigit
                    ? 'bg-sky-500 dark:bg-sky-400 scale-110 shadow-sm shadow-sky-500/30'
                    : 'border-2 border-slate-300 dark:border-slate-700 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        <div className="min-h-[22px] mb-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Onscreen Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={lockoutSeconds > 0}
              onClick={() => handleKeypadClick(digit)}
              className="h-13 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200/80 dark:border-slate-700/60 text-lg font-semibold text-slate-800 dark:text-slate-100 transition shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={lockoutSeconds > 0}
            onClick={handleClear}
            className="h-13 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-40 border border-slate-200/50 dark:border-slate-700/40 text-xs font-medium text-slate-500 dark:text-slate-400 transition"
          >
            Сброс
          </button>
          <button
            type="button"
            disabled={lockoutSeconds > 0}
            onClick={() => handleKeypadClick('0')}
            className="h-13 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200/80 dark:border-slate-700/60 text-lg font-semibold text-slate-800 dark:text-slate-100 transition shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          >
            0
          </button>
          <button
            type="button"
            disabled={lockoutSeconds > 0}
            onClick={handleBackspace}
            aria-label="Стереть символ"
            className="h-13 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-40 border border-slate-200/50 dark:border-slate-700/40 flex items-center justify-center text-slate-600 dark:text-slate-300 transition"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        {/* Keyboard Hint */}
        <p className="mt-5 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <span>Быстрый ввод с Numpad (6 цифр)</span>
        </p>
      </motion.div>
    </div>
  );
};

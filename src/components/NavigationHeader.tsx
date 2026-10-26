import React, { useState } from 'react';
import {
  Waves,
  Moon,
  Sun,
  RotateCcw,
  Table2,
  Menu,
  X,
  Calculator,
  MessageSquareText,
  ShieldCheck,
  Home,
  Lock,
  Unlock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageType } from '../types';

interface NavigationHeaderProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  darkMode: boolean;
  onToggleTheme: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isAdminAuth: boolean;
  onResetCalculator?: () => void;
  onOpenPriceTable?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentPage,
  onNavigate,
  darkMode,
  onToggleTheme,
  isAdminAuth,
  onResetCalculator,
  onOpenPriceTable,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: PageType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'calculator', label: 'Калькулятор', icon: Calculator },
    { id: 'templates', label: 'Быстрые ответы', icon: MessageSquareText },
    { id: 'admin', label: 'Админка', icon: ShieldCheck },
  ];

  const handleNavClick = (page: PageType) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-13 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand Zone */}
        <div
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-1.5 sm:gap-3 cursor-pointer shrink min-w-0 group select-none"
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-teal-400 flex items-center justify-center text-white shadow-xs shadow-sky-500/20 shrink-0"
          >
            <Waves className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-sky-700 via-cyan-600 to-teal-600 dark:from-sky-300 dark:via-cyan-300 dark:to-teal-300 bg-clip-text text-transparent whitespace-nowrap">
                СУЗДАЛЬ АКВА
              </span>
              <span className="hidden sm:inline-flex text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 font-semibold rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 shrink-0">
                Портал
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:block whitespace-nowrap">
              Рабочая среда оператора поддержки
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-500/10 dark:bg-sky-400/15 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-700/60 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
                {item.id === 'admin' && (
                  <span className="ml-0.5">
                    {isAdminAuth ? (
                      <Unlock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 inline" />
                    ) : (
                      <Lock className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500 inline" />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls - Guaranteed To Fit on Mobile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Specific controls if on calculator */}
          {currentPage === 'calculator' && onOpenPriceTable && (
            <button
              type="button"
              onClick={onOpenPriceTable}
              title="Тарифная сетка аквапарка"
              aria-label="Таблица цен"
              className="flex items-center justify-center gap-1 h-7.5 w-7.5 sm:h-9 sm:w-auto px-0 sm:px-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
            >
              <Table2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="hidden sm:inline">Тарифы</span>
            </button>
          )}

          {currentPage === 'calculator' && onResetCalculator && (
            <button
              type="button"
              onClick={onResetCalculator}
              title="Сбросить все параметры калькулятора"
              aria-label="Сбросить чек"
              className="flex items-center justify-center gap-1 h-7.5 w-7.5 sm:h-9 sm:w-auto px-0 sm:px-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">Сброс</span>
            </button>
          )}

          {/* Theme Switcher */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={onToggleTheme}
            title={darkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            className="relative h-7.5 w-7.5 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs hover:border-sky-400 dark:hover:border-sky-400 transition-colors cursor-pointer overflow-hidden group shrink-0"
            aria-label="Сменить тему оформления"
          >
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative flex items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                {darkMode ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, scale: 0.3, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0.3, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute"
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, scale: 0.3, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: -90, scale: 0.3, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute"
                  >
                    <Moon className="w-3.5 h-3.5 text-sky-600 fill-sky-600/20 drop-shadow-[0_0_6px_rgba(2,132,199,0.4)]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>

          {/* Mobile Menu Hamburger Button - Always Visible and Clickable */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center h-7.5 w-7.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-slate-700 dark:text-slate-200" /> : <Menu className="w-4 h-4 text-slate-700 dark:text-slate-200" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-lg overflow-hidden"
          >
            <div className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.id === 'admin' && (
                      <span className="text-xs px-2 py-0.5 rounded font-mono">
                        {isAdminAuth ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Unlock className="w-3 h-3" /> Доступно
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Закрыто
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

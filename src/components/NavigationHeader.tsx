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
  LogOut,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageType } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavigationHeaderProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  darkMode: boolean;
  onToggleTheme: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentPage,
  onNavigate,
  darkMode,
  onToggleTheme,
}) => {
  const { currentEmployee, canAccessAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter items: Admin is only present if user has admin/developer rights
  const navItems: { id: PageType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'calculator', label: 'Калькулятор', icon: Calculator },
    { id: 'templates', label: 'Быстрые ответы', icon: MessageSquareText },
  ];

  if (canAccessAdmin) {
    navItems.push({ id: 'admin', label: 'Админка', icon: ShieldCheck });
  }

  const handleNavClick = (page: PageType) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-12 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand Zone */}
        <div
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer shrink min-w-0 group select-none"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-teal-400 flex items-center justify-center text-white shadow-xs shadow-sky-500/20 shrink-0"
          >
            <Waves className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-sky-700 via-cyan-600 to-teal-600 dark:from-sky-300 dark:via-cyan-300 dark:to-teal-300 bg-clip-text text-transparent whitespace-nowrap">
                СУЗДАЛЬ АКВА
              </span>
              {currentEmployee && (
                <span className="hidden lg:inline-flex text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {currentEmployee.name} ({currentEmployee.role})
                </span>
              )}
            </div>
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
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={darkMode ? 'Светлая тема' : 'Тёмная тема'}
            className="h-7.5 w-7.5 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs hover:border-sky-400 transition cursor-pointer shrink-0"
            aria-label="Сменить тему оформления"
          >
            {darkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-sky-600" />
            )}
          </button>

          {/* Switch User / Logout button */}
          {currentEmployee && (
            <button
              type="button"
              onClick={logout}
              title="Сменить сотрудника / выход"
              className="h-7.5 w-7.5 sm:h-9 sm:w-auto px-0 sm:px-2.5 flex items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 transition cursor-pointer shrink-0 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Выход</span>
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center h-7.5 w-7.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition cursor-pointer shrink-0"
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
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
            transition={{ duration: 0.15 }}
            className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 shadow-lg overflow-hidden"
          >
            <div className="flex flex-col gap-1">
              {currentEmployee && (
                <div className="px-3 py-2 mb-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-sky-500" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentEmployee.name}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {currentEmployee.role}
                  </span>
                </div>
              )}

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
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

import React from 'react';
import { Waves, Moon, Sun, RotateCcw, Table2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onReset: () => void;
  onOpenPriceTable: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleTheme,
  onReset,
  onOpenPriceTable,
}) => {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-teal-400 flex items-center justify-center text-white shadow-sm shadow-sky-500/20"
          >
            <Waves className="w-6 h-6 animate-pulse" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-sky-700 via-cyan-600 to-teal-600 dark:from-sky-300 dark:via-cyan-300 dark:to-teal-300 bg-clip-text text-transparent">
                СУЗДАЛЬ АКВА
              </span>
              <span className="text-xs px-2 py-0.5 font-medium rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
                Поддержка
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Операторский калькулятор тарифов и скидок
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenPriceTable}
            title="Посмотреть полную сетку тарифов"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <Table2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="hidden md:inline">Таблица цен</span>
          </button>

          <button
            onClick={onReset}
            title="Сбросить все параметры к значениям по умолчанию"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Сбросить</span>
          </button>

          {/* Theme Switcher with Fluid Motion & Wave Effect */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={onToggleTheme}
            title={darkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs hover:border-sky-400 dark:hover:border-sky-400 transition-colors cursor-pointer overflow-hidden group"
            aria-label="Сменить тему оформления"
          >
            {/* Water Wave Glow Halo */}
            <span
              className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                darkMode
                  ? 'bg-amber-400/10 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                  : 'bg-sky-500/10 shadow-[0_0_12px_rgba(14,165,233,0.35)]'
              }`}
            />

            <div className="w-5 h-5 relative flex items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                {darkMode ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, scale: 0.3, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0.3, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      duration: 0.25,
                    }}
                    className="absolute"
                  >
                    <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, scale: 0.3, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: -90, scale: 0.3, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      duration: 0.25,
                    }}
                    className="absolute"
                  >
                    <Moon className="w-4 h-4 text-sky-600 fill-sky-600/20 drop-shadow-[0_0_6px_rgba(2,132,199,0.4)]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        </div>
      </div>
    </header>
  );
};

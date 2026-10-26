import React from 'react';
import {
  Calculator,
  MessageSquareText,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Unlock,
} from 'lucide-react';
import { motion } from 'motion/react';
import { PageType } from '../types';

interface HomePageProps {
  onNavigate: (page: PageType) => void;
  isAdminAuth: boolean;
  templatesCount: number;
  overtimeRate: number;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  isAdminAuth,
  templatesCount,
  overtimeRate,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-8 space-y-3.5 sm:space-y-6">
      {/* Hero Welcome Banner - Sleek and Compact */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-700 p-3.5 sm:p-6 text-white shadow-md">
        <div className="absolute -right-10 -bottom-10 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-[10px] sm:text-xs font-semibold tracking-wide border border-white/20">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 shrink-0" />
            <span>Единый портал оператора поддержки «Суздаль АКВА»</span>
          </div>

          <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight">
            Рабочее место оператора заботы о гостях
          </h1>

          <p className="text-xs sm:text-sm text-sky-100 leading-snug sm:leading-relaxed max-w-2xl">
            Быстрый расчет чека с автоматическим подбором максимальной выгоды, база проверенных ответов для чат-поддержки и гибкое управление тарифами аквапарка.
          </p>

          {/* Quick Metrics Strip */}
          <div className="pt-1.5 grid grid-cols-3 gap-1.5 sm:gap-3 text-xs sm:text-sm">
            <div className="bg-white/10 backdrop-blur-xs rounded-lg sm:rounded-xl p-2 sm:p-2.5 border border-white/15">
              <span className="text-sky-200 block text-[10px] sm:text-[11px]">База ответов</span>
              <span className="font-bold text-xs sm:text-base tabular-nums">{templatesCount} шаблонов</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg sm:rounded-xl p-2 sm:p-2.5 border border-white/15">
              <span className="text-sky-200 block text-[10px] sm:text-[11px]">Перелимит</span>
              <span className="font-bold text-xs sm:text-base tabular-nums">{overtimeRate} ₽/мин</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg sm:rounded-xl p-2 sm:p-2.5 border border-white/15 flex items-center justify-between">
              <div>
                <span className="text-sky-200 block text-[10px] sm:text-[11px]">Админка</span>
                <span className="font-bold text-[11px] sm:text-sm truncate">
                  {isAdminAuth ? 'Открыто' : 'Закрыто'}
                </span>
              </div>
              {isAdminAuth ? (
                <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300 shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-200 shrink-0" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Tools Grid */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white">
            Инструменты оператора
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Выберите инструмент
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-5">
          {/* Tool 1: Calculator */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            onClick={() => onNavigate('calculator')}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-105 transition-transform shrink-0">
                  <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Калькулятор тарифов
                </h3>
              </div>

              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-snug sm:leading-relaxed">
                Быстрый расчет чека: Акватория / Акватерра, 2ч, 4ч, весь день, автопоиск максимальной выгоды и перелимит по гостям.
              </p>

              <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Оптимизатор</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Купоны</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Перелимит</span>
              </div>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
              <span>Открыть калькулятор</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Tool 2: Templates Knowledge Base */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            onClick={() => onNavigate('templates')}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
                  <MessageSquareText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  Шаблоны быстрых ответов
                </h3>
              </div>

              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-snug sm:leading-relaxed">
                База готовых официальных ответов для чат-поддержки: мгновенный поиск по словам, темы (дети, льготы, СПА) и копирование в 1 клик.
              </p>

              <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Живой поиск</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">В 1 клик</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Категории</span>
              </div>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform">
              <span>Перейти к шаблонам</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Tool 3: Admin Panel */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            onClick={() => onNavigate('admin')}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform shrink-0">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Панель администратора
                  </h3>
                </div>

                {isAdminAuth ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    <Unlock className="w-2.5 h-2.5" />
                    Открыто
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    <Lock className="w-2.5 h-2.5" />
                    Закрыто
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-snug sm:leading-relaxed">
                Редактирование тарифной сетки будней и выходных, ставки перелимита, пополнение и редактирование базы шаблонов, бэкап.
              </p>

              <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Смена цен</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">CRUD шаблонов</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Бэкап</span>
              </div>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
              <span>{isAdminAuth ? 'Управление настройками' : 'Войти в панель'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Operator Cheat-Sheet / Quick Rules - Tight & Readable */}
      <div className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
          <span>Памятка оператора поддержки «Суздаль АКВА»</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
          <div className="bg-white dark:bg-slate-800/70 p-2.5 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white block">👶 Малыши до 4 лет</span>
            <p className="text-slate-500 dark:text-slate-400 leading-snug">
              Бесплатный вход. Не тарифицируются в перелимите. Не входят в состав группы для скидки от 4 человек.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800/70 p-2.5 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white block">👥 Группа от 4 человек</span>
            <p className="text-slate-500 dark:text-slate-400 leading-snug">
              Скидка 30% на все стандартные билеты. При уменьшении состава &lt; 4 автоматически отменяется.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800/70 p-2.5 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white block">✨ Льготники и скидки</span>
            <p className="text-slate-500 dark:text-slate-400 leading-snug">
              На тарифах 2ч и 4ч при акции выгоднее перевести в категорию со скидкой. На «Весь день» льгота выгоднее.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800/70 p-2.5 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white block">⏱ Перелимит времени</span>
            <p className="text-slate-500 dark:text-slate-400 leading-snug">
              Ставка {overtimeRate} ₽/мин на каждого гостя (кроме малышей). Оплачивается на кассе доплат при выходе.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

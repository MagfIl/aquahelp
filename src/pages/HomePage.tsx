import React from 'react';
import {
  Calculator,
  MessageSquareText,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  User,
  LogOut,
  Flame,
  Crown,
} from 'lucide-react';
import { motion } from 'motion/react';
import { PageType } from '../types';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  onNavigate: (page: PageType) => void;
  templatesCount: number;
  overtimeRate: number;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  templatesCount,
  overtimeRate,
}) => {
  const { currentEmployee, logout, canAccessAdmin } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-6">
      {/* Active Shift / Operator Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-800/60 shadow-xs shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {currentEmployee?.name || 'Сотрудник'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  currentEmployee?.role === 'developer'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    : currentEmployee?.role === 'admin'
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {currentEmployee?.role === 'developer'
                  ? 'Разработчик'
                  : currentEmployee?.role === 'admin'
                  ? 'Администратор'
                  : 'Сотрудник'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Активная рабочая смена · Онлайн-синхронизация с базой данных
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400" />
          <span>Сменить профиль</span>
        </button>
      </div>

      {/* Hero Welcome Banner - Clean & Modern */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-700 p-4 sm:p-6 text-white shadow-md">
        <div className="absolute -right-10 -bottom-10 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-[10px] sm:text-xs font-semibold tracking-wide border border-white/20">
            <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
            <span>Рабочий портал «Суздаль АКВА»</span>
          </div>

          <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight">
            Система поддержки и расчета гостей
          </h1>

          <p className="text-xs sm:text-sm text-sky-100 leading-relaxed max-w-2xl">
            Точный расчет тарифов с учетом скидок, каминной комнаты и премиум билетов, а также база готовых шаблонов ответов для оперативной помощи гостям аквапарка.
          </p>

          {/* Quick Metrics */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-sky-200 block text-[10px]">База шаблонов</span>
              <span className="font-bold text-sm sm:text-base tabular-nums">
                {templatesCount} ответов
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-sky-200 block text-[10px]">Перелимит времени</span>
              <span className="font-bold text-sm sm:text-base tabular-nums">
                {overtimeRate} ₽/мин
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15 col-span-2 sm:col-span-1">
              <span className="text-sky-200 block text-[10px]">VIP услуги</span>
              <span className="font-bold text-sm sm:text-base">Каминная комната</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Tools Grid */}
      <div className="space-y-2.5 sm:space-y-3">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Быстрый переход к инструментам
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Tool 1: Calculator */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            onClick={() => onNavigate('calculator')}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500 rounded-xl sm:rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-105 transition-transform shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    Калькулятор тарифов
                  </h3>
                  <span className="text-[10px] text-slate-400">Расчет сметы билетов</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Расчет чека для Стандарт и Премиум тарифов (12ч), почасовой аренды каминной комнаты, скидок групп от 4 человек и перелимита.
              </p>

              <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Премиум 12ч</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Каминная комната</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Разбивка цен</span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
              <span>Открыть калькулятор</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Tool 2: Templates */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            onClick={() => onNavigate('templates')}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500 rounded-xl sm:rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
                  <MessageSquareText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Шаблоны быстрых ответов
                  </h3>
                  <span className="text-[10px] text-slate-400">Общие и личные шаблоны</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Глобальная база проверенных формулировок с мгновенным копированием в буфер, возможность создавать личные шаблоны и предлагать в общие.
              </p>

              <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Поиск</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Личные шаблоны</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Копирование в 1 клик</span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform">
              <span>Открыть шаблоны</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Tool 3: Admin Panel (Shown ONLY if canAccessAdmin) */}
          {canAccessAdmin && (
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              onClick={() => onNavigate('admin')}
              className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 rounded-xl sm:rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      Панель администратора
                    </h3>
                    <span className="text-[10px] text-slate-400">Управление и безопасность</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Редактирование тарифов, цен премиума и каминной комнаты, модерация шаблонов сотрудников, управление профилями и загрузка бекапов.
                </p>

                <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Сотрудники</span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Модерация</span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Бекап .json</span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
                <span>Перейти в админку</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { VisitorCounter } from './components/VisitorCounter';
import { PromotionControls } from './components/PromotionControls';
import { ReceiptSummary } from './components/ReceiptSummary';
import { OvertimeCalculator } from './components/OvertimeCalculator';
import { DocumentChecklist } from './components/DocumentChecklist';
import { PriceMatrixModal } from './components/PriceMatrixModal';
import {
  DayType,
  ZoneType,
  DurationType,
  GuestCategory,
  GuestCounts,
  PromosState,
} from './types';
import { calculateTickets, PRICING_MATRIX } from './data/pricing';
import { Calendar, Sun, Clock, Sparkles } from 'lucide-react';

const INITIAL_COUNTS: GuestCounts = {
  adult: 1,
  teen: 0,
  child: 0,
  infant: 0,
  privilege: 0,
};

const INITIAL_PROMOS: PromosState = {
  groupPromo: 'none',
  coupon100Count: 0,
  coupon60Count: 0,
  customDiscountType: 'none',
  customDiscountValue: 0,
};

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('suzdalaqua_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('suzdalaqua_theme', 'dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('suzdalaqua_theme', 'light');
    }
  }, [darkMode]);

  // Animated circular wave theme toggler
  const handleToggleTheme = (event?: React.MouseEvent<HTMLButtonElement>) => {
    const nextMode = !darkMode;

    if (
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const rect = event?.currentTarget.getBoundingClientRect();
      const x = rect ? rect.left + rect.width / 2 : event?.clientX ?? window.innerWidth - 40;
      const y = rect ? rect.top + rect.height / 2 : event?.clientY ?? 32;

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = (document as any).startViewTransition(() => {
        setDarkMode(nextMode);
      });

      transition.ready
        ?.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ];
          document.documentElement.animate(
            {
              clipPath: nextMode ? clipPath : [...clipPath].reverse(),
            },
            {
              duration: 450,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              pseudoElement: nextMode
                ? '::view-transition-new(root)'
                : '::view-transition-old(root)',
            }
          );
        })
        .catch(() => {
          setDarkMode(nextMode);
        });
    } else {
      setDarkMode(nextMode);
    }
  };

  // Calculator Parameters
  const [day, setDay] = useState<DayType>('weekday');
  const [zone, setZone] = useState<ZoneType>('aquatory');
  const [duration, setDuration] = useState<DurationType>('2h');
  const [counts, setCounts] = useState<GuestCounts>(INITIAL_COUNTS);
  const [promos, setPromos] = useState<PromosState>(INITIAL_PROMOS);
  const [overtimeMinutes, setOvertimeMinutes] = useState<number>(0);
  const [customOvertimeGuests, setCustomOvertimeGuests] = useState<number | undefined>(undefined);

  // Modals and drawers
  const [isPriceTableOpen, setIsPriceTableOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);

  // Current non-infant count (adult, teen, child, privilege)
  const currentNonInfantCount =
    counts.adult + counts.teen + counts.child + counts.privilege;

  // Change handler for visitor counts
  const handleCountChange = (cat: GuestCategory, newCount: number) => {
    setCounts((prev) => {
      const updated = { ...prev, [cat]: newCount };
      const newEligible = updated.adult + updated.teen + updated.child;
      const newNonInfant =
        updated.adult + updated.teen + updated.child + updated.privilege;

      // Reset or clamp custom overtime guests
      setCustomOvertimeGuests((prevGuests) => {
        if (typeof prevGuests === 'number') {
          return Math.min(prevGuests, newNonInfant);
        }
        return undefined;
      });

      // Clamp coupons if eligible visitors became fewer
      setPromos((prevPromos) => {
        let c100 = Math.min(prevPromos.coupon100Count, newEligible);
        let c60 = Math.min(prevPromos.coupon60Count, Math.max(0, newEligible - c100));
        return {
          ...prevPromos,
          coupon100Count: c100,
          coupon60Count: c60,
        };
      });
      return updated;
    });
  };

  // Change handler for promos
  const handleUpdatePromos = (updated: Partial<PromosState>) => {
    setPromos((prev) => ({ ...prev, ...updated }));
  };

  // Reset to default
  const handleReset = () => {
    setDay('weekday');
    setZone('aquatory');
    setDuration('2h');
    setCounts(INITIAL_COUNTS);
    setPromos(INITIAL_PROMOS);
    setOvertimeMinutes(0);
    setCustomOvertimeGuests(undefined);
  };

  // Real-time calculated tickets
  const calculation = useMemo(() => {
    return calculateTickets(
      day,
      zone,
      duration,
      counts,
      promos,
      overtimeMinutes,
      customOvertimeGuests
    );
  }, [day, zone, duration, counts, promos, overtimeMinutes, customOvertimeGuests]);

  // Current adult preview price for durations
  const pricePreviews = PRICING_MATRIX[day][zone];

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <Header
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
        onReset={handleReset}
        onOpenPriceTable={() => setIsPriceTableOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Controls & Inputs (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Day & Zone & Duration */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
              {/* Day Selector */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>1. Выберите день недели</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDay('weekday')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      day === 'weekday'
                        ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-semibold">Будние дни</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        day === 'weekday' ? 'text-sky-100' : 'text-slate-400'
                      }`}
                    >
                      Понедельник – Пятница
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDay('weekend')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      day === 'weekend'
                        ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-semibold">Выходные / Праздники</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        day === 'weekend' ? 'text-sky-100' : 'text-slate-400'
                      }`}
                    >
                      Суббота, Воскресенье, праздники
                    </div>
                  </button>
                </div>
              </div>

              {/* Zone Selector */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  <Sun className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>2. Тарифная зона</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setZone('aquatory')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      zone === 'aquatory'
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-1 ring-sky-500'
                        : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        «Акватория»
                      </span>
                      {zone === 'aquatory' && (
                        <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">
                          Выбрано
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Бассейны, детские зоны, водные горки, волновой бассейн, джакузи
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setZone('aquaterra')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      zone === 'aquaterra'
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500'
                        : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        «Акватория + АкваТерра»
                      </span>
                      {zone === 'aquaterra' && (
                        <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400">
                          Выбрано
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Аквапарк + банно-термальный комплекс, русские бани, сауны
                    </p>
                  </button>
                </div>
              </div>

              {/* Duration Selector */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>3. Продолжительность сеанса</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['2h', '4h', 'all_day'] as DurationType[]).map((dur) => {
                    const isSelected = duration === dur;
                    const durLabel =
                      dur === '2h' ? '2 часа' : dur === '4h' ? '4 часа' : 'Весь день';
                    const adultPrice = pricePreviews[dur].adult;
                    const childPrice = pricePreviews[dur].child;

                    return (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setDuration(dur)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="text-sm font-bold">{durLabel}</div>
                        <div
                          className={`text-[11px] font-mono mt-1 ${
                            isSelected ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          Взр: {adultPrice} ₽
                        </div>
                        <div
                          className={`text-[10px] font-mono ${
                            isSelected ? 'text-sky-200' : 'text-slate-400'
                          }`}
                        >
                          Дет: {childPrice} ₽
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 2: Visitors Counter */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>4. Количество гостей по категориям</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Всего: {calculation.totalVisitors}
                </span>
              </div>

              <VisitorCounter
                counts={counts}
                day={day}
                zone={zone}
                duration={duration}
                onChangeCount={handleCountChange}
                onOpenDocuments={() => setDocModalOpen(true)}
              />
            </div>

            {/* Step 3: Promotions & Coupons */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <PromotionControls
                promos={promos}
                totalEligibleTickets={calculation.eligibleVisitors}
                totalGuests={calculation.totalVisitors}
                onUpdatePromos={handleUpdatePromos}
              />
            </div>
          </div>

          {/* Right Column: Receipt, Overtime & Checklists (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            {/* Real-time Receipt & Grand Total */}
            <ReceiptSummary
              calculation={calculation}
              day={day}
              zone={zone}
              duration={duration}
            />

            {/* Overtime Calculator (10 ₽ / min / guest, excluding infants) */}
            <OvertimeCalculator
              onUpdateOvertimeMinutes={setOvertimeMinutes}
              currentOvertimeMinutes={overtimeMinutes}
              nonInfantVisitors={currentNonInfantCount}
              overtimeGuestsCount={calculation.overtimeGuestsCount}
              onUpdateOvertimeGuestsCount={(val) => setCustomOvertimeGuests(val)}
            />

            {/* Cash Desk Documents Checklist */}
            <DocumentChecklist />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Аквапарк «Суздаль АКВА» · ГТК «Суздаль» (ул. Коровники, 45)
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Режим работы: 10:00 – 22:00 ежедневно · Перелимит: 10 ₽/мин с гостя (кроме малышей)
          </div>
        </div>
      </footer>

      {/* Price Table Reference Modal */}
      <PriceMatrixModal
        isOpen={isPriceTableOpen}
        onClose={() => setIsPriceTableOpen(false)}
      />
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DayType,
  ZoneType,
  DurationType,
  TariffType,
  GuestCategory,
  GuestCounts,
  PromosState,
  PricingMatrixType,
  PremiumPricesType,
} from '../types';
import { calculateTickets, PRIVILEGE_DOCUMENTS } from '../data/pricing';
import { VisitorCounter } from '../components/VisitorCounter';
import { PromotionControls } from '../components/PromotionControls';
import { ReceiptSummary } from '../components/ReceiptSummary';
import { OvertimeCalculator } from '../components/OvertimeCalculator';
import { DocumentChecklist } from '../components/DocumentChecklist';
import { PriceMatrixModal } from '../components/PriceMatrixModal';
import {
  Calendar,
  Sun,
  Clock,
  Sparkles,
  Receipt,
  FileText,
  X,
  Table2,
  Crown,
  Flame,
  Info,
} from 'lucide-react';

export const INITIAL_COUNTS: GuestCounts = {
  adult: 0,
  teen: 0,
  child: 0,
  infant: 0,
  privilege: 0,
};

export const INITIAL_PROMOS: PromosState = {
  groupPromo: 'none',
  coupon100Count: 0,
  coupon60Count: 0,
  customDiscountType: 'none',
  customDiscountValue: 0,
};

interface CalculatorPageProps {
  pricingMatrix: PricingMatrixType;
  overtimeRate: number;
  isPriceTableOpen: boolean;
  onOpenPriceTable?: () => void;
  onClosePriceTable: () => void;
  day: DayType;
  setDay: (d: DayType) => void;
  zone: ZoneType;
  setZone: (z: ZoneType) => void;
  duration: DurationType;
  setDuration: (dur: DurationType) => void;
  counts: GuestCounts;
  setCounts: React.Dispatch<React.SetStateAction<GuestCounts>>;
  promos: PromosState;
  setPromos: React.Dispatch<React.SetStateAction<PromosState>>;
  overtimeMinutes: number;
  setOvertimeMinutes: (m: number) => void;
  customOvertimeGuests: number | undefined;
  setCustomOvertimeGuests: React.Dispatch<React.SetStateAction<number | undefined>>;
  onReset: () => void;
  // Optional premium & fireplace overrides
  premiumPrices?: PremiumPricesType;
  fireplaceHourlyRate?: number;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({
  pricingMatrix,
  overtimeRate,
  isPriceTableOpen,
  onOpenPriceTable,
  onClosePriceTable,
  day,
  setDay,
  zone,
  setZone,
  duration,
  setDuration,
  counts,
  setCounts,
  promos,
  setPromos,
  overtimeMinutes,
  setOvertimeMinutes,
  customOvertimeGuests,
  setCustomOvertimeGuests,
  onReset,
  premiumPrices,
  fireplaceHourlyRate = 8000,
}) => {
  const [tariffType, setTariffType] = useState<TariffType>('standard');
  const [docModalOpen, setDocModalOpen] = useState(false);

  // Fireplace room state: 8 000 ₽ / час, минимум 3 часа
  const [fireplaceEnabled, setFireplaceEnabled] = useState<boolean>(false);
  const [fireplaceHours, setFireplaceHours] = useState<number>(3);

  // Unified Tariff Selection: 'aquatory' | 'aquaterra' | 'premium'
  const handleSelectTariff = (type: 'aquatory' | 'aquaterra' | 'premium') => {
    if (type === 'premium') {
      setTariffType('premium');
      setZone('aquaterra');
      setDuration('all_day');
      // If user had privilege tickets, convert them to adults so guests aren't lost
      if (counts.privilege > 0) {
        setCounts((prev) => ({
          ...prev,
          adult: prev.adult + prev.privilege,
          privilege: 0,
        }));
      }
      // Zero out coupons because coupons don't apply on premium
      if (promos.coupon100Count > 0 || promos.coupon60Count > 0) {
        setPromos((prev) => ({
          ...prev,
          coupon100Count: 0,
          coupon60Count: 0,
        }));
      }
    } else {
      setTariffType('standard');
      setZone(type);
    }
  };

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

      // Clamp coupons and auto-cancel group4 if non-infant visitors drops below 4
      setPromos((prevPromos) => {
        let c100 = Math.min(prevPromos.coupon100Count, newEligible);
        let c60 = Math.min(prevPromos.coupon60Count, Math.max(0, newEligible - c100));
        let groupPromo = prevPromos.groupPromo;

        if (newNonInfant < 4 && groupPromo === 'group4') {
          groupPromo = 'none';
        }

        return {
          ...prevPromos,
          groupPromo,
          coupon100Count: c100,
          coupon60Count: c60,
        };
      });
      return updated;
    });
  };

  // Change handler for promos
  const handleUpdatePromos = (updated: Partial<PromosState>) => {
    setPromos((prev) => {
      // Disallow setting group4 if non-infant guests < 4
      if (updated.groupPromo === 'group4') {
        const nonInfantGuests =
          counts.adult + counts.teen + counts.child + counts.privilege;
        if (nonInfantGuests < 4) {
          return prev;
        }
      }
      return { ...prev, ...updated };
    });
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
      customOvertimeGuests,
      pricingMatrix,
      overtimeRate,
      tariffType,
      premiumPrices,
      fireplaceEnabled ? fireplaceHours : 0,
      fireplaceHourlyRate
    );
  }, [
    day,
    zone,
    duration,
    counts,
    promos,
    overtimeMinutes,
    customOvertimeGuests,
    pricingMatrix,
    overtimeRate,
    tariffType,
    premiumPrices,
    fireplaceEnabled,
    fireplaceHours,
    fireplaceHourlyRate,
  ]);

  // Apply optimal ticket recommendation
  const handleApplyOptimization = () => {
    if (calculation.optimization) {
      if (calculation.optimization.recommendedCounts) {
        setCounts(calculation.optimization.recommendedCounts);
      }
      if (calculation.optimization.recommendedGroupPromo) {
        setPromos((prev) => ({
          ...prev,
          groupPromo: calculation.optimization!.recommendedGroupPromo!,
        }));
      }
    }
  };

  // Reset all including local page states
  const handleFullReset = () => {
    setTariffType('standard');
    setFireplaceEnabled(false);
    setFireplaceHours(3);
    onReset();
  };

  // Current adult & child preview price for durations
  const pricePreviews = pricingMatrix[day][zone];

  return (
    <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-24 lg:pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 items-start">
        {/* Left Column: Controls & Inputs (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3.5 sm:space-y-5">
          {/* Main Parameters Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs space-y-3.5 sm:space-y-5">
            {/* 1. Day Selector */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
                <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>1. День недели</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDay('weekday')}
                  className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    day === 'weekday'
                      ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-semibold">
                    <span className="sm:hidden">Будни</span>
                    <span className="hidden sm:inline">Будние дни</span>
                  </div>
                  <div
                    className={`text-[10px] sm:text-[11px] mt-0.5 ${
                      day === 'weekday' ? 'text-sky-100' : 'text-slate-400'
                    }`}
                  >
                    <span className="sm:hidden">Пн – Пт</span>
                    <span className="hidden sm:inline">Понедельник – Пятница</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDay('weekend')}
                  className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    day === 'weekend'
                      ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-semibold">
                    <span className="sm:hidden">Выходные</span>
                    <span className="hidden sm:inline">Выходные / Праздники</span>
                  </div>
                  <div
                    className={`text-[10px] sm:text-[11px] mt-0.5 ${
                      day === 'weekend' ? 'text-sky-100' : 'text-slate-400'
                    }`}
                  >
                    <span className="sm:hidden">Сб, Вс, праздники</span>
                    <span className="hidden sm:inline">Суббота, Воскресенье, праздники</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Unified Tariff / Zone Selector (Aquatory, Aquaterra, Premium) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Sun className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>2. Вид тарифа</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Aquatory */}
                <button
                  type="button"
                  onClick={() => handleSelectTariff('aquatory')}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    tariffType === 'standard' && zone === 'aquatory'
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-1 ring-sky-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      «Акватория»
                    </span>
                    {tariffType === 'standard' && zone === 'aquatory' && (
                      <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">
                        Выбрано
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Бассейны, водные горки, детские городки, джакузи
                  </p>
                </button>

                {/* 2. Aquaterra (SPA) */}
                <button
                  type="button"
                  onClick={() => handleSelectTariff('aquaterra')}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    tariffType === 'standard' && zone === 'aquaterra'
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      «Акватория + СПА»
                    </span>
                    {tariffType === 'standard' && zone === 'aquaterra' && (
                      <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400">
                        Выбрано
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Аквапарк + банно-термальный комплекс саун «АкваТерра»
                  </p>
                </button>

                {/* 3. Premium */}
                <button
                  type="button"
                  onClick={() => handleSelectTariff('premium')}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    tariffType === 'premium'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        «Премиум»
                      </span>
                    </div>
                    {tariffType === 'premium' ? (
                      <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                        Выбрано
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        12 ч
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Тариф на 12 часов · Все зоны · Отдельный прайс
                  </p>
                </button>
              </div>
            </div>

            {/* 3. Duration Selector */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
                <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>3. Продолжительность сеанса</span>
              </div>

              {tariffType === 'premium' ? (
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200 block">
                        12 часов (полный день включен в тариф «Премиум»)
                      </span>
                      <span className="text-[11px] text-amber-800 dark:text-amber-300">
                        Без ограничений по часам · Взрослый/Тинейджер: {day === 'weekday' ? '3 800' : '5 500'} ₽, Детский: {day === 'weekday' ? '2 800' : '4 100'} ₽
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    Фиксировано 12ч
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
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
                        className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-bold">{durLabel}</div>
                        <div
                          className={`text-[10px] sm:text-[11px] font-mono mt-0.5 sm:mt-1 ${
                            isSelected ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          Взр: {adultPrice} ₽
                        </div>
                        <div
                          className={`text-[9px] sm:text-[10px] font-mono ${
                            isSelected ? 'text-sky-200' : 'text-slate-400'
                          }`}
                        >
                          Дет: {childPrice} ₽
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4. Visitors Counter */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>4. Состав гостей</span>
              </div>

              {tariffType === 'standard' && (
                <button
                  type="button"
                  onClick={() => setDocModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Документы для льгот</span>
                </button>
              )}
            </div>

            {tariffType === 'premium' && (
              <div className="mb-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300">
                На тарифе «Премиум» льготная категория не предусмотрена. Доступны: Взрослый, Тинейджер, Детский и Малыши (до 4 лет бесплатно).
              </div>
            )}

            <div className="space-y-2.5 sm:space-y-3">
              <VisitorCounter
                counts={counts}
                onCountChange={handleCountChange}
                disablePrivilege={tariffType === 'premium'}
              />
            </div>
          </div>

          {/* 5. Promotions & Discounts */}
          <PromotionControls
            promos={promos}
            onUpdatePromos={handleUpdatePromos}
            counts={counts}
            tariffType={tariffType}
          />
        </div>

        {/* Right Column: Receipt Summary & Addons (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3 sm:space-y-4">
          {/* Receipt Card */}
          <ReceiptSummary
            calculation={calculation}
            day={day}
            zone={zone}
            duration={duration}
            onApplyOptimization={handleApplyOptimization}
          />

          {/* Action Buttons: Reset & Tariffs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFullReset}
              className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              Сбросить расчет
            </button>

            <button
              type="button"
              onClick={onOpenPriceTable || onClosePriceTable}
              className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-xs sm:text-sm font-semibold text-sky-700 dark:text-sky-300 transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Table2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Тарифная сетка</span>
            </button>
          </div>

          {/* Extras Placed Under Receipt & Buttons on Desktop */}
          {/* Fireplace Room (Каминная комната) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Каминная комната
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Аренда: 8 000 ₽ / час (минимум 3 часа)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFireplaceEnabled(!fireplaceEnabled)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  fireplaceEnabled
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {fireplaceEnabled ? 'Включено' : '+ Добавить'}
              </button>
            </div>

            {fireplaceEnabled && (
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                    Время аренды:
                  </span>
                  <span className="text-[10px] text-slate-400">минимум 3 часа</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFireplaceHours(Math.max(3, fireplaceHours - 1))}
                    disabled={fireplaceHours <= 3}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                  >
                    -
                  </button>
                  <div className="relative">
                    <input
                      type="number"
                      min={3}
                      max={24}
                      value={fireplaceHours}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setFireplaceHours(Math.max(3, Math.min(24, val)));
                        }
                      }}
                      className="w-16 px-2 py-1 text-center font-mono font-bold text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-2 top-1 text-[11px] text-slate-400 pointer-events-none">
                      ч
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFireplaceHours(Math.min(24, fireplaceHours + 1))}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center cursor-pointer transition shadow-2xs"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Overtime Calculator */}
          <OvertimeCalculator
            onUpdateOvertimeMinutes={setOvertimeMinutes}
            currentOvertimeMinutes={overtimeMinutes}
            nonInfantVisitors={calculation.nonInfantVisitors}
            overtimeGuestsCount={calculation.overtimeGuestsCount}
            onUpdateOvertimeGuestsCount={(count) => setCustomOvertimeGuests(count)}
            overtimeRate={overtimeRate}
          />

          {/* Document Checklist Helper */}
          <DocumentChecklist />
        </div>
      </div>

      {/* Floating Mobile Bottom Action Strip */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-2.5 px-3 flex items-center justify-between gap-2 shadow-lg">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Итого к оплате</span>
          <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
            {calculation.grandTotalWithAll.toLocaleString('ru-RU')} ₽
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {calculation.optimization?.hasBetterOption && (
            <button
              type="button"
              onClick={handleApplyOptimization}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-white flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>-{calculation.optimization.savingsAmount} ₽</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('receipt-card');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>Чек</span>
          </button>
        </div>
      </div>

      {/* Privilege Documents Popup Modal with Framer Motion Animation */}
      <AnimatePresence>
        {docModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Документы для льготного тарифа
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-2.5 text-xs">
                <p className="text-slate-500 dark:text-slate-400">
                  Льготные билеты оформляются только в кассе аквапарка при предъявлении оригиналов документов:
                </p>
                <div className="space-y-2">
                  {PRIVILEGE_DOCUMENTS.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {doc.doc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 cursor-pointer"
                >
                  Понятно
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Price Table Reference Modal */}
      <PriceMatrixModal
        isOpen={isPriceTableOpen}
        onClose={onClosePriceTable}
        matrix={pricingMatrix}
      />
    </div>
  );
};

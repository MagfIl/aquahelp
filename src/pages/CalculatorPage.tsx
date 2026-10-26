import React, { useState, useMemo } from 'react';
import {
  DayType,
  ZoneType,
  DurationType,
  GuestCategory,
  GuestCounts,
  PromosState,
  PricingMatrixType,
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
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({
  pricingMatrix,
  overtimeRate,
  isPriceTableOpen,
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
}) => {
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

      // Clamp coupons and auto-cancel group4 if non-infant visitors drops below 4
      setPromos((prevPromos) => {
        let c100 = Math.min(prevPromos.coupon100Count, newEligible);
        let c60 = Math.min(prevPromos.coupon60Count, Math.max(0, newEligible - c100));
        let groupPromo = prevPromos.groupPromo;

        // Automatically cancel group4 promo if non-infant guests are less than 4 (toddlers do not count)
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
      // Disallow setting group4 if non-infant guests < 4 (toddlers do not count)
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

  // Real-time calculated tickets using active dynamic pricing matrix & overtime rate
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
      overtimeRate
    );
  }, [day, zone, duration, counts, promos, overtimeMinutes, customOvertimeGuests, pricingMatrix, overtimeRate]);

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

  // Current adult & child preview price for durations
  const pricePreviews = pricingMatrix[day][zone];

  return (
    <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-24 lg:pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 items-start">
        {/* Left Column: Controls & Inputs (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3.5 sm:space-y-5">
          {/* Step 1: Day & Zone & Duration */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs space-y-3.5 sm:space-y-5">
            {/* Day Selector */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
                <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>1. Выберите день недели</span>
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

            {/* Zone Selector */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
                <Sun className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>2. Тарифная зона</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setZone('aquatory')}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    zone === 'aquatory'
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-1 ring-sky-500'
                      : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      «Акватория»
                    </span>
                    {zone === 'aquatory' && (
                      <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">
                        Выбрано
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                    Бассейны, детские зоны, водные горки, джакузи
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setZone('aquaterra')}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    zone === 'aquaterra'
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500'
                      : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      «Акватория + АкваТерра»
                    </span>
                    {zone === 'aquaterra' && (
                      <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400">
                        Выбрано
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                    Аквапарк + банно-термальный комплекс, сауны
                  </p>
                </button>
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">
                <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>3. Продолжительность сеанса</span>
              </div>
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
            </div>
          </div>

          {/* Step 2: Visitors Counter */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>4. Количество гостей по категориям</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
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
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs">
            <PromotionControls
              promos={promos}
              totalEligibleTickets={calculation.eligibleVisitors}
              totalGuests={calculation.totalVisitors}
              nonInfantGuests={currentNonInfantCount}
              onUpdatePromos={handleUpdatePromos}
            />
          </div>
        </div>

        {/* Right Column: Receipt, Overtime & Checklists (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3.5 sm:space-y-5 lg:sticky lg:top-20">
          {/* Real-time Receipt & Grand Total */}
          <ReceiptSummary
            calculation={calculation}
            day={day}
            zone={zone}
            duration={duration}
            onApplyOptimization={handleApplyOptimization}
          />

          {/* Overtime Calculator */}
          <OvertimeCalculator
            onUpdateOvertimeMinutes={setOvertimeMinutes}
            currentOvertimeMinutes={overtimeMinutes}
            nonInfantVisitors={currentNonInfantCount}
            overtimeGuestsCount={calculation.overtimeGuestsCount}
            onUpdateOvertimeGuestsCount={(val) => setCustomOvertimeGuests(val)}
            overtimeRate={overtimeRate}
          />

          {/* Cash Desk Documents Checklist */}
          <DocumentChecklist />
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-lg transition-colors">
        <div className="min-w-0">
          <div className="text-base sm:text-lg font-extrabold font-mono text-slate-950 dark:text-white leading-tight tabular-nums truncate">
            {calculation.grandTotalWithOvertime.toLocaleString('ru-RU')} ₽
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {calculation.totalVisitors === 0
              ? 'Чек пуст'
              : `${calculation.totalVisitors} гост. · ${duration === '2h' ? '2 часа' : duration === '4h' ? '4 часа' : 'Весь день'}`}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {calculation.optimization?.hasBetterOption && (
            <button
              type="button"
              onClick={handleApplyOptimization}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-xs flex items-center gap-1 cursor-pointer animate-pulse"
              title="Применить самое выгодное решение"
            >
              <Sparkles className="w-3 h-3 shrink-0" />
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

      {/* Privilege Documents Popup Modal */}
      {docModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
          </div>
        </div>
      )}

      {/* Price Table Reference Modal */}
      <PriceMatrixModal
        isOpen={isPriceTableOpen}
        onClose={onClosePriceTable}
        matrix={pricingMatrix}
      />
    </div>
  );
};

import React from 'react';
import { Plus, Minus, Info } from 'lucide-react';
import { GuestCategory, GuestCounts, DayType, ZoneType, DurationType } from '../types';
import { CATEGORY_INFO, PRICING_MATRIX } from '../data/pricing';

interface VisitorCounterProps {
  counts: GuestCounts;
  day: DayType;
  zone: ZoneType;
  duration: DurationType;
  onChangeCount: (category: GuestCategory, newCount: number) => void;
  onOpenDocuments: () => void;
}

export const VisitorCounter: React.FC<VisitorCounterProps> = ({
  counts,
  day,
  zone,
  duration,
  onChangeCount,
  onOpenDocuments,
}) => {
  const currentPrices = PRICING_MATRIX[day][zone][duration];

  const categories: GuestCategory[] = ['adult', 'teen', 'child', 'infant', 'privilege'];

  const getBasePriceDisplay = (cat: GuestCategory) => {
    if (cat === 'infant') {
      return 'Бесплатно';
    }
    const price = currentPrices[cat];
    return `${price.toLocaleString('ru-RU')} ₽`;
  };

  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const info = CATEGORY_INFO[cat];
        const count = counts[cat];
        const isPrivileged = cat === 'privilege';
        const isInfant = cat === 'infant';

        return (
          <div
            key={cat}
            className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
              count > 0
                ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Category Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {info.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {info.ageNote}
                  </span>

                  {isPrivileged && (
                    <button
                      type="button"
                      onClick={onOpenDocuments}
                      className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer"
                      title="Список документов для кассы"
                    >
                      <Info className="w-3 h-3 shrink-0" />
                      <span>Документы</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-semibold text-sky-700 dark:text-sky-300 tabular-nums">
                    {getBasePriceDisplay(cat)}
                  </span>
                  {isPrivileged && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-400">
                      (скидки не действуют)
                    </span>
                  )}
                  {isInfant && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-400">
                      (в сопровождении взрослого)
                    </span>
                  )}
                </div>
              </div>

              {/* Counter Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onChangeCount(cat, Math.max(0, count - 1))}
                  disabled={count === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  aria-label={`Уменьшить ${info.name}`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <input
                  type="number"
                  min="0"
                  max="99"
                  value={count === 0 ? '' : count}
                  placeholder="0"
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onChangeCount(cat, isNaN(val) ? 0 : Math.max(0, Math.min(99, val)));
                  }}
                  className="w-12 h-8 text-center text-sm font-bold font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />

                <button
                  type="button"
                  onClick={() => onChangeCount(cat, Math.min(99, count + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  aria-label={`Увеличить ${info.name}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

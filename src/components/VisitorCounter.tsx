import React from 'react';
import { Plus, Minus, Info } from 'lucide-react';
import { GuestCategory, GuestCounts } from '../types';
import { CATEGORY_INFO } from '../data/pricing';

interface VisitorCounterProps {
  counts: GuestCounts;
  onCountChange: (category: GuestCategory, newCount: number) => void;
  disablePrivilege?: boolean;
}

export const VisitorCounter: React.FC<VisitorCounterProps> = ({
  counts,
  onCountChange,
  disablePrivilege = false,
}) => {
  const categories: GuestCategory[] = disablePrivilege
    ? ['adult', 'teen', 'child', 'infant']
    : ['adult', 'teen', 'child', 'infant', 'privilege'];

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {categories.map((cat) => {
        const info = CATEGORY_INFO[cat];
        const count = counts[cat];
        const isPrivileged = cat === 'privilege';
        const isInfant = cat === 'infant';

        return (
          <div
            key={cat}
            className={`p-2 sm:p-3 rounded-xl border transition-all ${
              count > 0
                ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              {/* Category Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {info.name}
                  </span>
                  <span className="text-[10px] sm:text-xs px-1.5 py-0.2 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {info.ageNote}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {info.description}
                  </p>
                  {isPrivileged && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                      (без скидок)
                    </span>
                  )}
                  {isInfant && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      (со взрослым)
                    </span>
                  )}
                </div>
              </div>

              {/* Counter Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onCountChange(cat, Math.max(0, count - 1))}
                  disabled={count === 0}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  aria-label={`Уменьшить ${info.name}`}
                >
                  <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>

                <input
                  type="number"
                  min="0"
                  max="99"
                  value={count === 0 ? '' : count}
                  placeholder="0"
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onCountChange(cat, isNaN(val) ? 0 : Math.max(0, Math.min(99, val)));
                  }}
                  className="w-10 sm:w-12 h-7 sm:h-8 text-center text-xs sm:text-sm font-bold font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />

                <button
                  type="button"
                  onClick={() => onCountChange(cat, Math.min(99, count + 1))}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  aria-label={`Увеличить ${info.name}`}
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

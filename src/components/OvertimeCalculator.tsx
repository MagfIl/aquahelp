import React from 'react';
import { Clock, Users, AlertCircle } from 'lucide-react';

interface OvertimeCalculatorProps {
  onUpdateOvertimeMinutes: (minutes: number) => void;
  currentOvertimeMinutes: number;
  nonInfantVisitors: number;
  overtimeGuestsCount: number;
  onUpdateOvertimeGuestsCount: (count: number) => void;
  overtimeRate?: number;
}

export const OvertimeCalculator: React.FC<OvertimeCalculatorProps> = ({
  onUpdateOvertimeMinutes,
  currentOvertimeMinutes,
  nonInfantVisitors,
  overtimeGuestsCount,
  onUpdateOvertimeGuestsCount,
  overtimeRate = 10,
}) => {
  const quickMinutes = [10, 15, 30, 45, 60, 90];

  const rate = Math.max(0, overtimeRate);
  const overtimeFee = currentOvertimeMinutes * rate * overtimeGuestsCount;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between gap-1.5 mb-1.5 sm:mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Доплата за время
          </h4>
        </div>
        <span className="text-[10px] sm:text-[11px] font-bold text-sky-700 dark:text-sky-300 font-mono bg-sky-50 dark:bg-sky-950/60 px-1.5 sm:px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800/60 shrink-0">
          {rate} ₽ / мин / гость
        </span>
      </div>

      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-2.5 sm:mb-3">
        Тарифицируется {rate} ₽ за каждую минуту с каждого гостя (малыши до 4 лет освобождены от доплаты).
      </p>


      {/* Inputs for Minutes and Guests Count */}
      <div className="space-y-2.5 sm:space-y-3">
        {/* Minutes input */}
        <div className="flex items-center gap-2 sm:gap-3">
          <label className="text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Минут задержки:
          </label>
          <div className="relative flex-1">
            <input
              type="number"
              min="0"
              max="600"
              value={currentOvertimeMinutes === 0 ? '' : currentOvertimeMinutes}
              placeholder="0"
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onUpdateOvertimeMinutes(isNaN(val) ? 0 : Math.max(0, val));
              }}
              className="w-full px-3 py-1.5 text-sm font-bold font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
              мин
            </span>
          </div>

          {currentOvertimeMinutes > 0 && (
            <button
              type="button"
              onClick={() => onUpdateOvertimeMinutes(0)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer shrink-0"
            >
              Сбросить
            </button>
          )}
        </div>

        {/* Quick minute buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 shrink-0">Быстро:</span>
          {quickMinutes.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => onUpdateOvertimeMinutes(mins)}
              className={`text-xs px-2.5 py-0.5 rounded-md font-mono transition-colors cursor-pointer ${
                currentOvertimeMinutes === mins
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              +{mins}м
            </button>
          ))}
        </div>

        {/* Guests count for overtime */}
        {nonInfantVisitors > 0 && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Гостей с перелимитом:
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateOvertimeGuestsCount(
                    Math.max(0, overtimeGuestsCount - 1)
                  )
                }
                disabled={overtimeGuestsCount <= 0}
                className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                −
              </button>

              <span className="font-mono font-bold text-xs tabular-nums text-slate-900 dark:text-white px-1">
                {overtimeGuestsCount} из {nonInfantVisitors}
              </span>

              <button
                type="button"
                onClick={() =>
                  onUpdateOvertimeGuestsCount(
                    Math.min(nonInfantVisitors, overtimeGuestsCount + 1)
                  )
                }
                disabled={overtimeGuestsCount >= nonInfantVisitors}
                className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Calculation Result */}
        {currentOvertimeMinutes > 0 && (
          <div className="mt-2 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2">
            <div>
              <span className="text-xs text-amber-900 dark:text-amber-200 font-semibold">
                Доплата за перелимит:
              </span>
              <div className="text-[11px] text-amber-700 dark:text-amber-400 font-mono mt-0.5">
                {currentOvertimeMinutes} мин × {rate} ₽ × {overtimeGuestsCount} чел
              </div>
            </div>
            <div className="text-lg font-bold font-mono text-amber-950 dark:text-amber-100 tabular-nums">
              +{overtimeFee.toLocaleString('ru-RU')} ₽
            </div>
          </div>
        )}

        {nonInfantVisitors === 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Укажите гостей в калькуляторе для расчета перелимита</span>
          </div>
        )}
      </div>
    </div>
  );
};

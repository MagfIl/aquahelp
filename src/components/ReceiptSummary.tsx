import React from 'react';
import { CalculationResult, DayType, ZoneType, DurationType } from '../types';
import { Receipt, CheckCircle2, Clock } from 'lucide-react';

interface ReceiptSummaryProps {
  calculation: CalculationResult;
  day: DayType;
  zone: ZoneType;
  duration: DurationType;
}

export const ReceiptSummary: React.FC<ReceiptSummaryProps> = ({
  calculation,
  day,
  zone,
  duration,
}) => {
  const {
    totalVisitors,
    grandTotal,
    totalSavings,
    breakdown,
    appliedGroupPromoLabel,
    overtimeMinutes,
    overtimeGuestsCount,
    overtimeFee,
    grandTotalWithOvertime,
  } = calculation;

  const durationLabels: Record<DurationType, string> = {
    '2h': '2 часа',
    '4h': '4 часа',
    all_day: 'Весь день',
  };

  const zoneLabels: Record<ZoneType, string> = {
    aquatory: 'Акватория (водная зона)',
    aquaterra: 'Акватория + АкваТерра (бани и сауны)',
  };

  const dayLabels: Record<DayType, string> = {
    weekday: 'Будний день (Пн–Пт)',
    weekend: 'Выходной / Праздник (Сб–Вс)',
  };

  if (totalVisitors === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[380px]">
        <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4 border border-sky-100 dark:border-sky-900/40">
          <Receipt className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Чек пуст
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mt-1">
          Укажите количество посетителей в панели слева для мгновенного расчета стоимости билетов.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Расчет для клиента
            </span>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Гостей: <strong className="text-slate-800 dark:text-slate-200 font-mono">{totalVisitors}</strong>
          </span>
        </div>

        {/* Grand Total Highlight */}
        <div className="flex items-baseline justify-between gap-4 mt-2">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-950 dark:text-white tabular-nums tracking-tight">
              {grandTotalWithOvertime.toLocaleString('ru-RU')} ₽
            </div>

            {/* Savings & Overtime indicators */}
            <div className="space-y-0.5 mt-1">
              {totalSavings > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Экономия по акциям: </span>
                  <strong className="font-mono tabular-nums">
                    {totalSavings.toLocaleString('ru-RU')} ₽
                  </strong>
                </div>
              )}

              {overtimeFee > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Включая перелимит ({overtimeMinutes} мин × {overtimeGuestsCount} чел): </span>
                  <strong className="font-mono tabular-nums">
                    +{overtimeFee.toLocaleString('ru-RU')} ₽
                  </strong>
                </div>
              )}
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
            <div>{durationLabels[duration]}</div>
            <div className="font-medium text-slate-700 dark:text-slate-300">
              {dayLabels[day]}
            </div>
          </div>
        </div>

        {/* Active Promos Badge */}
        {appliedGroupPromoLabel && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-100/70 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80">
            <span>Применена: {appliedGroupPromoLabel}</span>
          </div>
        )}
      </div>

      {/* Itemized Table */}
      <div className="p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Детализация билетов
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="pb-2">Категория</th>
                <th className="pb-2 text-center">Кол-во</th>
                <th className="pb-2 text-right">Тариф</th>
                <th className="pb-2 text-right">Скидка</th>
                <th className="pb-2 text-right">Сумма</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {breakdown.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 pr-2 font-sans font-medium text-slate-800 dark:text-slate-200">
                    <div>{item.categoryName}</div>
                    {item.appliedPromoLabel && (
                      <div className="text-[11px] text-sky-600 dark:text-sky-400 font-sans">
                        {item.appliedPromoLabel}
                      </div>
                    )}
                    {item.isPrivileged && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-sans">
                        Строго по удостоверению на кассе
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-600 dark:text-slate-400">
                    {item.basePrice === 0 ? '0 ₽' : `${item.basePrice.toLocaleString('ru-RU')} ₽`}
                  </td>
                  <td className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                    {item.totalDiscount > 0 ? `-${item.totalDiscount.toLocaleString('ru-RU')} ₽` : '—'}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-bold text-slate-900 dark:text-white">
                    {item.totalFinal.toLocaleString('ru-RU')} ₽
                  </td>
                </tr>
              ))}

              {/* Overtime row in receipt if active */}
              {overtimeFee > 0 && (
                <tr className="bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200">
                  <td className="py-2.5 pr-2 font-sans font-semibold">
                    Перелимит по времени
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-normal">
                      {overtimeMinutes} мин × 10 ₽/мин × {overtimeGuestsCount} чел
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center">{overtimeGuestsCount}</td>
                  <td className="py-2.5 px-2 text-right">{overtimeMinutes * 10} ₽/чел</td>
                  <td className="py-2.5 px-2 text-right">—</td>
                  <td className="py-2.5 pl-2 text-right font-bold text-amber-900 dark:text-amber-300">
                    +{overtimeFee.toLocaleString('ru-RU')} ₽
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Selected zone reminder */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Выбранная зона:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {zoneLabels[zone]}
          </span>
        </div>
      </div>
    </div>
  );
};

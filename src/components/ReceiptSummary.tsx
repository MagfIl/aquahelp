import React from 'react';
import { CalculationResult, DayType, ZoneType, DurationType } from '../types';
import { Receipt, CheckCircle2, Clock, Sparkles, ArrowRightLeft, Info, Flame, Crown } from 'lucide-react';

interface ReceiptSummaryProps {
  calculation: CalculationResult;
  day: DayType;
  zone: ZoneType;
  duration: DurationType;
  onApplyOptimization?: () => void;
}

export const ReceiptSummary: React.FC<ReceiptSummaryProps> = ({
  calculation,
  day,
  zone,
  duration,
  onApplyOptimization,
}) => {
  const {
    totalVisitors,
    grandTotalWithAll,
    totalSavings,
    breakdown,
    appliedGroupPromoLabel,
    overtimeMinutes,
    overtimeGuestsCount,
    overtimeFee,
    optimization,
    tariffType,
    fireplaceFee,
    fireplaceHours,
    unitPricesBreakdown,
  } = calculation;

  const durationLabels: Record<DurationType, string> = {
    '2h': '2 часа',
    '4h': '4 часа',
    all_day: 'Весь день (12ч)',
  };

  const zoneLabels: Record<ZoneType, string> = {
    aquatory: 'Акватория (водная зона)',
    aquaterra: 'Акватория + АкваТерра (бани и сауны)',
  };

  const dayLabels: Record<DayType, string> = {
    weekday: 'Будний день (Пн–Пт)',
    weekend: 'Выходной / Праздник (Сб–Вс)',
  };

  if (totalVisitors === 0 && fireplaceFee === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 text-center flex flex-col items-center justify-center min-h-[200px] sm:min-h-[360px] transition-colors shadow-xs">
        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 sm:mb-4 border border-sky-100 dark:border-sky-900/40">
          <Receipt className="w-5 h-5 sm:w-7 sm:h-7" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
          Чек пуст
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mt-1">
          Укажите количество посетителей или аренду каминной комнаты для мгновенного расчета стоимости.
        </p>
      </div>
    );
  }

  return (
    <div id="receipt-card" className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      {/* Header Banner */}
      <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Расчет для клиента
            </span>
            {tariffType === 'premium' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider shadow-xs">
                <Crown className="w-3 h-3" />
                Премиум 12ч
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Гостей: <strong className="text-slate-800 dark:text-slate-200 font-mono">{totalVisitors}</strong>
          </span>
        </div>

        {/* Grand Total Highlight */}
        <div className="flex items-baseline justify-between gap-3 mt-1 sm:mt-2">
          <div>
            <div className="text-2xl sm:text-4xl font-extrabold font-mono text-slate-950 dark:text-white tabular-nums tracking-tight">
              {grandTotalWithAll.toLocaleString('ru-RU')} ₽
            </div>

            {/* Savings & Extras indicators */}
            <div className="space-y-0.5 mt-1">
              {totalSavings > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Экономия: </span>
                  <strong className="font-mono tabular-nums">
                    {totalSavings.toLocaleString('ru-RU')} ₽
                  </strong>
                </div>
              )}

              {overtimeFee > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Перелимит ({overtimeMinutes}м × {overtimeGuestsCount}г): </span>
                  <strong className="font-mono tabular-nums">
                    +{overtimeFee.toLocaleString('ru-RU')} ₽
                  </strong>
                </div>
              )}

              {fireplaceFee > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-orange-600 dark:text-orange-400">
                  <Flame className="w-3.5 h-3.5 shrink-0" />
                  <span>Каминная комната ({fireplaceHours} ч): </span>
                  <strong className="font-mono tabular-nums">
                    +{fireplaceFee.toLocaleString('ru-RU')} ₽
                  </strong>
                </div>
              )}
            </div>
          </div>

          <div className="text-right text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 space-y-0.5 shrink-0">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {tariffType === 'premium' ? 'Премиум (12 ч)' : durationLabels[duration]}
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              {dayLabels[day]}
            </div>
          </div>
        </div>

        {/* Active Promos Badge */}
        {appliedGroupPromoLabel && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-semibold bg-sky-100/70 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80">
            <span>Применена: {appliedGroupPromoLabel}</span>
          </div>
        )}
      </div>

      {/* Smart Optimization Alert */}
      {optimization?.hasBetterOption && onApplyOptimization && tariffType === 'standard' && (
        <div className="p-3 sm:p-4 mx-3 sm:mx-5 my-3 sm:my-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 shadow-xs">
          <div className="flex items-start gap-2 sm:gap-2.5">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span className="text-xs font-extrabold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                  💡 Найдено более выгодное решение!
                </span>
                <span className="text-[11px] sm:text-xs font-bold font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-300/60 dark:border-emerald-800">
                  Экономия: {optimization.savingsAmount.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <p className="text-xs text-amber-900 dark:text-amber-200 mt-1 sm:mt-1.5 leading-relaxed font-medium">
                {optimization.reason}
              </p>

              <div className="mt-2.5 sm:mt-3">
                <button
                  type="button"
                  onClick={onApplyOptimization}
                  className="w-full sm:w-auto px-3 sm:px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-98 text-white shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Применить выгодный вариант ({optimization.optimizedTotal.toLocaleString('ru-RU')} ₽)
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Itemized Table */}
      <div className="p-3.5 sm:p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 sm:mb-3">
          Детализация расчета
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="pb-2">Позиция</th>
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

              {/* Fireplace room row */}
              {fireplaceFee > 0 && (
                <tr className="bg-orange-50/40 dark:bg-orange-950/20 text-orange-950 dark:text-orange-200">
                  <td className="py-2.5 pr-2 font-sans font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>Каминная комната</span>
                    </div>
                    <div className="text-[10px] text-orange-700 dark:text-orange-400 font-mono font-normal">
                      {fireplaceHours} ч × 8 000 ₽/час
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center">{fireplaceHours} ч</td>
                  <td className="py-2.5 px-2 text-right">8 000 ₽/ч</td>
                  <td className="py-2.5 px-2 text-right">—</td>
                  <td className="py-2.5 pl-2 text-right font-bold text-orange-950 dark:text-orange-300">
                    +{fireplaceFee.toLocaleString('ru-RU')} ₽
                  </td>
                </tr>
              )}

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

        {/* Breakdown per Single Ticket with discount applied */}
        {unitPricesBreakdown && unitPricesBreakdown.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 p-3 rounded-lg">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Стоимость билета по категориям (с учетом скидки):
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              {unitPricesBreakdown.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-0.5">
                  <span className="font-sans text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                    <span>
                      1 {u.categoryName.toLowerCase()}
                      {u.quantity > 1 && (
                        <span className="text-slate-400 font-mono text-[11px] ml-1">
                          ({u.quantity} шт)
                        </span>
                      )}
                    </span>
                    {u.subLabel && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          u.subLabel.includes('купон')
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : u.subLabel.includes('скидк')
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {u.subLabel}
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-slate-950 dark:text-white tabular-nums">
                    = {u.unitPriceWithDiscount.toLocaleString('ru-RU')} ₽
                    {u.hasDiscount && (
                      <span className="ml-1.5 font-normal text-[10px] text-slate-400 line-through">
                        {u.originalUnitPrice.toLocaleString('ru-RU')} ₽
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected zone reminder */}
        {tariffType === 'standard' && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Выбранная зона:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {zoneLabels[zone]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

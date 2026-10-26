import React from 'react';
import { PRICING_MATRIX } from '../data/pricing';
import { PricingMatrixType } from '../types';
import { X, Table2 } from 'lucide-react';

interface PriceMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  matrix?: PricingMatrixType;
}

export const PriceMatrixModal: React.FC<PriceMatrixModalProps> = ({
  isOpen,
  onClose,
  matrix,
}) => {
  if (!isOpen) return null;

  const activeMatrix = matrix || (PRICING_MATRIX as unknown as PricingMatrixType);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-3.5 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Table2 className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              Тарифная сетка «Суздаль АКВА»
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Weekday Table */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 mb-3 flex items-center gap-2">
              <span>Будние дни (Пн – Пт)</span>
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Зона / Продолжительность</th>
                    <th className="py-2.5 px-3 text-right">Взрослый (18+)</th>
                    <th className="py-2.5 px-3 text-right">Тинейджер (14–17)</th>
                    <th className="py-2.5 px-3 text-right">Детский (4–13)</th>
                    <th className="py-2.5 px-3 text-right">Льготный</th>
                    <th className="py-2.5 px-3 text-right">Малыши (&lt;4)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {(['aquatory', 'aquaterra'] as const).map((z) => (
                    <React.Fragment key={z}>
                      <tr className={`font-sans font-semibold ${z === 'aquatory' ? 'bg-sky-50/30 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300' : 'bg-teal-50/30 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300'}`}>
                        <td colSpan={6} className="py-1.5 px-3">
                          {z === 'aquatory' ? 'Зона «Акватория» (водные аттракционы)' : 'Зона «Акватория + АкваТерра» (бани и сауны)'}
                        </td>
                      </tr>
                      {(['2h', '4h', 'all_day'] as const).map((d) => {
                        const p = activeMatrix.weekday[z][d];
                        const dLabel = d === '2h' ? '2 часа' : d === '4h' ? '4 часа' : 'Весь день';
                        return (
                          <tr key={d}>
                            <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">{dLabel}</td>
                            <td className="py-2 px-3 text-right">{p.adult.toLocaleString('ru-RU')} ₽</td>
                            <td className="py-2 px-3 text-right">{p.teen.toLocaleString('ru-RU')} ₽</td>
                            <td className="py-2 px-3 text-right">{p.child.toLocaleString('ru-RU')} ₽</td>
                            <td className="py-2 px-3 text-right font-semibold text-amber-600 dark:text-amber-400">{p.privilege.toLocaleString('ru-RU')} ₽</td>
                            <td className="py-2 px-3 text-right text-emerald-600 font-sans">0 ₽</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekend Table */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-2">
              <span>Выходные и праздничные дни (Сб – Вс)</span>
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Зона / Продолжительность</th>
                    <th className="py-2.5 px-3 text-right">Взрослый (18+)</th>
                    <th className="py-2.5 px-3 text-right">Тинейджер (14–17)</th>
                    <th className="py-2.5 px-3 text-right">Детский (4–13)</th>
                    <th className="py-2.5 px-3 text-right">Льготный</th>
                    <th className="py-2.5 px-3 text-right">Малыши (&lt;4)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {(['aquatory', 'aquaterra'] as const).map((z) => (
                    <React.Fragment key={z}>
                      <tr className={`font-sans font-semibold ${z === 'aquatory' ? 'bg-sky-50/30 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300' : 'bg-teal-50/30 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300'}`}>
                        <td colSpan={6} className="py-1.5 px-3">
                          {z === 'aquatory' ? 'Зона «Акватория» (водные аттракционы)' : 'Зона «Акватория + АкваТерра» (бани и сауны)'}
                        </td>
                      </tr>
                      {(['2h', '4h', 'all_day'] as const).map((d) => {
                        const p = activeMatrix.weekend[z][d];
                        const dLabel = d === '2h' ? '2 часа' : d === '4h' ? '4 часа' : 'Весь день';
                        return (
                          <tr key={d}>
                            <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">{dLabel}</td>
                            <td className="py-2 px-3 text-right">{p.adult.toLocaleString('ru-RU')} ₽</td>
                            <td className="py-2 px-3 text-right">{p.teen.toLocaleString('ru-RU')} ₽</td>
                            <td className="py-2 px-3 text-right">{p.child.toLocaleString('ru-RU')} ₽</td>
                            <td className="py-2 px-3 text-right font-semibold text-amber-600 dark:text-amber-400">{p.privilege.toLocaleString('ru-RU')} ₽</td>
                            <td className="py-2 px-3 text-right text-emerald-600 font-sans">0 ₽</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

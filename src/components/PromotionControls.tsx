import React from 'react';
import { PromosState, GuestCounts, TariffType } from '../types';
import { Tag, Hotel, Users, Cake, Gift, AlertCircle, Percent } from 'lucide-react';

interface PromotionControlsProps {
  promos: PromosState;
  onUpdatePromos: (updated: Partial<PromosState>) => void;
  counts: GuestCounts;
  tariffType?: TariffType;
}

export const PromotionControls: React.FC<PromotionControlsProps> = ({
  promos,
  onUpdatePromos,
  counts,
  tariffType = 'standard',
}) => {
  const isPremium = tariffType === 'premium';
  const totalEligibleTickets = counts.adult + counts.teen + counts.child;
  const nonInfantGuests = counts.adult + counts.teen + counts.child + (isPremium ? 0 : counts.privilege);
  const isGroup4Eligible = nonInfantGuests >= 4;

  const maxCoupons = totalEligibleTickets;
  const remainingFor100 = Math.max(0, maxCoupons - promos.coupon60Count);
  const remainingFor60 = Math.max(0, maxCoupons - promos.coupon100Count);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Promotions on Entire Check / Group (Active on both Standard and Premium) */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <Tag className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>Акции и промокоды {isPremium ? '(действуют на Премиум)' : 'на чек'}</span>
          </div>
          {isGroup4Eligible && promos.groupPromo === 'none' && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
              Доступно -30% (от 4 чел)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Promo code 40% on entire check */}
          <button
            type="button"
            onClick={() =>
              onUpdatePromos({
                groupPromo: promos.groupPromo === 'promo40' ? 'none' : 'promo40',
              })
            }
            className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-start gap-2 sm:gap-2.5 transition-all cursor-pointer ${
              promos.groupPromo === 'promo40'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Percent className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Промокод 40%
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 rounded">
                  -40% на чек
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Скидка 40% на все стандартные билеты чека
              </p>
            </div>
          </button>

          {/* GTK Suzdal -30% */}
          <button
            type="button"
            onClick={() =>
              onUpdatePromos({
                groupPromo: promos.groupPromo === 'gtk' ? 'none' : 'gtk',
              })
            }
            className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-start gap-2 sm:gap-2.5 transition-all cursor-pointer ${
              promos.groupPromo === 'gtk'
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 dark:border-sky-500 ring-1 ring-sky-500'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Hotel className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Проживание в ГТК
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 px-1.5 py-0.2 rounded">
                  -30%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                По карте гостя отеля или бронированию
              </p>
            </div>
          </button>

          {/* Group 4+ -30% (Excluding infants) */}
          <button
            type="button"
            disabled={!isGroup4Eligible}
            onClick={() => {
              if (!isGroup4Eligible) return;
              onUpdatePromos({
                groupPromo: promos.groupPromo === 'group4' ? 'none' : 'group4',
              });
            }}
            title={
              isGroup4Eligible
                ? 'Скидка 30% на компанию от 4 человек'
                : 'Недоступно: в группе должно быть не менее 4 человек (малыши до 4 лет не учитываются)'
            }
            className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-start gap-2 sm:gap-2.5 transition-all ${
              !isGroup4Eligible
                ? 'opacity-40 cursor-not-allowed bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 text-slate-400'
                : promos.groupPromo === 'group4'
                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 dark:border-teal-500 ring-1 ring-teal-500 cursor-pointer'
                : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 hover:border-emerald-400 cursor-pointer'
            }`}
          >
            <Users
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                isGroup4Eligible
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-xs font-bold ${
                    isGroup4Eligible
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  Группа от 4 человек
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.2 rounded ${
                    isGroup4Eligible
                      ? 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/50'
                      : 'text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800'
                  }`}
                >
                  -30%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isGroup4Eligible
                  ? 'Скидка на компанию от 4 человек'
                  : `Недоступно (${nonInfantGuests} из 4 гостей)`}
              </p>
            </div>
          </button>

          {/* Birthday -30% */}
          <button
            type="button"
            onClick={() =>
              onUpdatePromos({
                groupPromo: promos.groupPromo === 'birthday' ? 'none' : 'birthday',
              })
            }
            className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-start gap-2 sm:gap-2.5 transition-all cursor-pointer ${
              promos.groupPromo === 'birthday'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500 ring-1 ring-amber-500'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Cake className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Именинник с группой
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.2 rounded">
                    -30%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  В день рождения, 7 дней до и после
                </p>
              </div>
              {promos.groupPromo === 'birthday' && (
                <span className="text-[10px] sm:text-xs font-bold text-amber-700 dark:text-amber-300 shrink-0">
                  Активно
                </span>
              )}
            </div>
          </button>
        </div>

        {promos.groupPromo !== 'none' && (
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onUpdatePromos({ groupPromo: 'none' })}
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline cursor-pointer"
            >
              Снять акцию с чека
            </button>
          </div>
        )}
      </div>

      {/* 2. Individual Coupons on Specific Guests (Disabled on Premium) */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <Gift className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Купоны на отдельных гостей</span>
          </div>
          {!isPremium && (
            <span className="text-[11px] text-slate-400 dark:text-slate-400">
              Доступно билетов: {totalEligibleTickets}
            </span>
          )}
        </div>

        {isPremium ? (
          <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              На тарифе «Премиум» купоны (100% и 60%) не действуют согласно правилам аквапарка.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            {/* Coupon 100% (Free Ticket) */}
            <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Купон 100%
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/60">
                    Бесплатно (-100%)
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {promos.coupon100Count} гост.
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePromos({
                      coupon100Count: Math.max(0, promos.coupon100Count - 1),
                    })
                  }
                  disabled={promos.coupon100Count === 0}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  − 1 гость
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePromos({
                      coupon100Count: Math.min(remainingFor100, promos.coupon100Count + 1),
                    })
                  }
                  disabled={promos.coupon100Count >= remainingFor100}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  + 1 гость
                </button>
              </div>
            </div>

            {/* Coupon 60% */}
            <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Купон 60%
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800/60">
                    -60%
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {promos.coupon60Count} гост.
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePromos({
                      coupon60Count: Math.max(0, promos.coupon60Count - 1),
                    })
                  }
                  disabled={promos.coupon60Count === 0}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  − 1 гость
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePromos({
                      coupon60Count: Math.min(remainingFor60, promos.coupon60Count + 1),
                    })
                  }
                  disabled={promos.coupon60Count >= remainingFor60}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  + 1 гость
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

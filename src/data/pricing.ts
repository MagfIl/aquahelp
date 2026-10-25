import {
  DayType,
  ZoneType,
  DurationType,
  GuestCategory,
  GuestCounts,
  PromosState,
  CalculationResult,
  TicketBreakdownItem,
  OptimizationRecommendation,
} from '../types';

export const PRICING_MATRIX = {
  weekday: {
    aquatory: {
      '2h': { adult: 1300, teen: 1300, child: 900, privilege: 1200 },
      '4h': { adult: 1600, teen: 1600, child: 1100, privilege: 1200 },
      all_day: { adult: 2000, teen: 2000, child: 1400, privilege: 1200 },
    },
    aquaterra: {
      '2h': { adult: 1900, teen: 1900, child: 1500, privilege: 1800 },
      '4h': { adult: 2200, teen: 2200, child: 1700, privilege: 1800 },
      all_day: { adult: 2600, teen: 2600, child: 2000, privilege: 1800 },
    },
  },
  weekend: {
    aquatory: {
      '2h': { adult: 2000, teen: 2000, child: 1400, privilege: 1800 },
      '4h': { adult: 2400, teen: 2400, child: 1700, privilege: 1800 },
      all_day: { adult: 3100, teen: 3100, child: 2200, privilege: 1800 },
    },
    aquaterra: {
      '2h': { adult: 2800, teen: 2800, child: 2200, privilege: 2600 },
      '4h': { adult: 3200, teen: 3200, child: 2500, privilege: 2600 },
      all_day: { adult: 3900, teen: 3900, child: 3000, privilege: 2600 },
    },
  },
} as const;

export const CATEGORY_INFO: Record<
  GuestCategory,
  {
    name: string;
    shortName: string;
    ageNote: string;
    description: string;
    allowsDiscounts: boolean;
  }
> = {
  adult: {
    name: 'Взрослый',
    shortName: 'Взрослые',
    ageNote: 'от 18 лет',
    description: 'Полный доступ к водным зонам и аттракционам',
    allowsDiscounts: true,
  },
  teen: {
    name: 'Тинейджер',
    shortName: 'Тинейджеры',
    ageNote: '14–17 лет',
    description: 'Для подростков от 14 до 17 лет включительно',
    allowsDiscounts: true,
  },
  child: {
    name: 'Детский',
    shortName: 'Дети',
    ageNote: '4–13 лет',
    description: 'Для детей в сопровождении взрослых',
    allowsDiscounts: true,
  },
  infant: {
    name: 'Малыши',
    shortName: 'Малыши',
    ageNote: 'до 4 лет',
    description: 'Бесплатный вход в сопровождении совершеннолетнего (перелимит 0 ₽)',
    allowsDiscounts: false,
  },
  privilege: {
    name: 'Льготный',
    shortName: 'Льготники',
    ageNote: 'по документу',
    description:
      'Пенсионеры, студенты, многодетные, люди с инвалидностью, ветераны боевых действий (скидки и купоны не применяются)',
    allowsDiscounts: false,
  },
};

export const PRIVILEGE_DOCUMENTS = [
  {
    title: 'Пенсионеры',
    doc: 'Пенсионное удостоверение или справка из СФР + паспорт',
  },
  {
    title: 'Студенты очники',
    doc: 'Студенческий билет с действующей отметкой об очной форме',
  },
  {
    title: 'Многодетные семьи',
    doc: 'Удостоверение многодетной семьи или справка + паспорта/свидетельства',
  },
  {
    title: 'Люди с инвалидностью',
    doc: 'Справка МСЭ об установлении инвалидности (I, II группа) + паспорт',
  },
  {
    title: 'Ветераны БД',
    doc: 'Удостоверение ветерана боевых действий + паспорт',
  },
  {
    title: 'Малыши (до 4 лет)',
    doc: 'Свидетельство о рождении (при спорном возрасте/росте)',
  },
];

/**
 * Internal raw computation of tickets
 */
function computeRawTicketTotals(
  day: DayType,
  zone: ZoneType,
  duration: DurationType,
  counts: GuestCounts,
  promos: PromosState
) {
  const prices = PRICING_MATRIX[day][zone][duration];
  const totalVisitors =
    counts.adult + counts.teen + counts.child + counts.infant + counts.privilege;
  const eligibleVisitors = counts.adult + counts.teen + counts.child;
  const nonInfantVisitors =
    counts.adult + counts.teen + counts.child + counts.privilege;

  const coupon100Count = Math.max(
    0,
    Math.min(promos.coupon100Count, eligibleVisitors)
  );
  const remainingFor60 = Math.max(0, eligibleVisitors - coupon100Count);
  const coupon60Count = Math.max(
    0,
    Math.min(promos.coupon60Count, remainingFor60)
  );

  let appliedGroupPromoLabel: string | null = null;
  let checkDiscountPercent = 0;

  if (promos.groupPromo === 'promo40') {
    appliedGroupPromoLabel = 'Промокод 40% на весь чек';
    checkDiscountPercent = 40;
  } else if (promos.groupPromo === 'gtk') {
    appliedGroupPromoLabel = 'Проживание в ГТК «Суздаль» (-30%)';
    checkDiscountPercent = 30;
  } else if (promos.groupPromo === 'group4' && nonInfantVisitors >= 4) {
    appliedGroupPromoLabel = 'Группа от 4 человек (-30%)';
    checkDiscountPercent = 30;
  } else if (promos.groupPromo === 'birthday') {
    appliedGroupPromoLabel = 'Группа с именинником ±7 дней (-30%)';
    checkDiscountPercent = 30;
  }

  interface SingleTicket {
    category: 'adult' | 'teen' | 'child';
    basePrice: number;
    discountPercent: number;
    promoLabel?: string;
  }

  const standardTickets: SingleTicket[] = [];
  for (let i = 0; i < counts.adult; i++) {
    standardTickets.push({ category: 'adult', basePrice: prices.adult, discountPercent: 0 });
  }
  for (let i = 0; i < counts.teen; i++) {
    standardTickets.push({ category: 'teen', basePrice: prices.teen, discountPercent: 0 });
  }
  for (let i = 0; i < counts.child; i++) {
    standardTickets.push({ category: 'child', basePrice: prices.child, discountPercent: 0 });
  }

  let remaining100 = coupon100Count;
  let remaining60 = coupon60Count;

  for (let i = 0; i < standardTickets.length; i++) {
    if (remaining100 > 0) {
      standardTickets[i].discountPercent = 100;
      standardTickets[i].promoLabel = 'Купон 100% (Бесплатно)';
      remaining100--;
    } else if (remaining60 > 0) {
      standardTickets[i].discountPercent = 60;
      standardTickets[i].promoLabel = 'Купон 60%';
      remaining60--;
    } else if (checkDiscountPercent > 0) {
      standardTickets[i].discountPercent = checkDiscountPercent;
      standardTickets[i].promoLabel = appliedGroupPromoLabel || `Скидка ${checkDiscountPercent}%`;
    } else if (promos.customDiscountType === 'percent' && promos.customDiscountValue > 0) {
      standardTickets[i].discountPercent = Math.min(100, promos.customDiscountValue);
      standardTickets[i].promoLabel = `Скидка ${promos.customDiscountValue}%`;
    }
  }

  const breakdownGroups: Record<
    string,
    {
      category: GuestCategory;
      quantity: number;
      basePrice: number;
      discountPercent: number;
      appliedPromoLabel?: string;
      isPrivileged?: boolean;
    }
  > = {};

  standardTickets.forEach((ticket) => {
    const key = `${ticket.category}_${ticket.discountPercent}_${ticket.promoLabel || ''}`;
    if (!breakdownGroups[key]) {
      breakdownGroups[key] = {
        category: ticket.category,
        quantity: 0,
        basePrice: ticket.basePrice,
        discountPercent: ticket.discountPercent,
        appliedPromoLabel: ticket.promoLabel,
      };
    }
    breakdownGroups[key].quantity += 1;
  });

  if (counts.privilege > 0) {
    breakdownGroups['privilege'] = {
      category: 'privilege',
      quantity: counts.privilege,
      basePrice: prices.privilege,
      discountPercent: 0,
      appliedPromoLabel: 'Льготный тариф (купоны и промокоды не действуют)',
      isPrivileged: true,
    };
  }

  if (counts.infant > 0) {
    breakdownGroups['infant'] = {
      category: 'infant',
      quantity: counts.infant,
      basePrice: 0,
      discountPercent: 0,
      appliedPromoLabel: 'Бесплатно (до 4 лет, перелимит 0 ₽)',
    };
  }

  const breakdown: TicketBreakdownItem[] = Object.entries(breakdownGroups).map(
    ([id, item]) => {
      const discountAmountPerTicket = Math.round(
        (item.basePrice * item.discountPercent) / 100
      );
      const finalPricePerTicket = item.basePrice - discountAmountPerTicket;
      const totalBeforeDiscount = item.basePrice * item.quantity;
      const totalDiscount = discountAmountPerTicket * item.quantity;
      const totalFinal = finalPricePerTicket * item.quantity;

      const catInfo = CATEGORY_INFO[item.category];
      return {
        id,
        category: item.category,
        categoryName: catInfo.name,
        ageNote: catInfo.ageNote,
        quantity: item.quantity,
        basePrice: item.basePrice,
        discountPercent: item.discountPercent,
        discountAmountPerTicket,
        finalPricePerTicket,
        totalBeforeDiscount,
        totalDiscount,
        totalFinal,
        appliedPromoLabel: item.appliedPromoLabel,
        isPrivileged: item.isPrivileged,
      };
    }
  );

  let baseSubtotal = breakdown.reduce(
    (sum, item) => sum + item.totalBeforeDiscount,
    0
  );
  let totalSavings = breakdown.reduce(
    (sum, item) => sum + item.totalDiscount,
    0
  );

  if (
    promos.customDiscountType === 'fixed' &&
    promos.customDiscountValue > 0 &&
    eligibleVisitors > 0
  ) {
    const fixedDiscount = Math.min(
      promos.customDiscountValue,
      baseSubtotal - totalSavings
    );
    totalSavings += fixedDiscount;
  }

  const grandTotal = Math.max(0, baseSubtotal - totalSavings);

  return {
    totalVisitors,
    eligibleVisitors,
    nonInfantVisitors,
    baseSubtotal,
    totalSavings,
    grandTotal,
    breakdown,
    appliedGroupPromoLabel,
    prices,
  };
}

/**
 * Calculates ticket totals, discounts, breakdowns, optimization recommendations and per-guest overtime
 */
export function calculateTickets(
  day: DayType,
  zone: ZoneType,
  duration: DurationType,
  counts: GuestCounts,
  promos: PromosState,
  overtimeMinutesRaw: number,
  customOvertimeGuestsCount?: number
): CalculationResult {
  const current = computeRawTicketTotals(day, zone, duration, counts, promos);

  // Overtime calculation: 10 rubles per minute PER GUEST (excluding infants!)
  const overtimeGuestsCount =
    typeof customOvertimeGuestsCount === 'number'
      ? Math.max(0, Math.min(customOvertimeGuestsCount, current.nonInfantVisitors))
      : current.nonInfantVisitors;

  const overtimeMinutes = Math.max(0, overtimeMinutesRaw);
  const overtimeFee = overtimeMinutes * 10 * overtimeGuestsCount;
  const grandTotalWithOvertime = current.grandTotal + overtimeFee;

  // Optimization Analysis:
  // Find the strategy that gives the ABSOLUTE LOWEST price for the customer!
  let optimization: OptimizationRecommendation | null = null;

  interface Candidate {
    grandTotal: number;
    recommendedCounts: GuestCounts;
    recommendedGroupPromo: typeof promos.groupPromo;
    reason: string;
  }

  const candidates: Candidate[] = [];

  // Candidate 1: Keep counts as they are, but activate 'group4' if party has 4+ non-infant guests and no promo is selected
  if (current.nonInfantVisitors >= 4 && promos.groupPromo === 'none') {
    const rawGroup4 = computeRawTicketTotals(day, zone, duration, counts, {
      ...promos,
      groupPromo: 'group4',
    });
    if (rawGroup4.grandTotal < current.grandTotal) {
      const savings = current.grandTotal - rawGroup4.grandTotal;
      let reason = '';
      if (counts.privilege > 0) {
        reason = `В группе ${current.nonInfantVisitors} чел. доступна скидка «Группа от 4 человек (-30%)». На тарифе «${duration === 'all_day' ? 'Весь день' : duration}» льготный тариф (${current.prices.privilege} ₽) выгоднее взрослого со скидкой (1 400 ₽), поэтому льготный билет сохранён, а к остальным билетам применена скидка 30%!`;
      } else {
        reason = `В заказе ${current.nonInfantVisitors} гостей — доступна акция «Группа от 4 человек (-30%)»! Это снизит чек с ${current.grandTotal.toLocaleString('ru-RU')} ₽ до ${rawGroup4.grandTotal.toLocaleString('ru-RU')} ₽ (экономия: ${savings.toLocaleString('ru-RU')} ₽).`;
      }

      candidates.push({
        grandTotal: rawGroup4.grandTotal,
        recommendedCounts: counts,
        recommendedGroupPromo: 'group4',
        reason,
      });
    }
  }

  // Candidate 2 & 3: If there are privilege tickets, test converting them to standard adults
  if (counts.privilege > 0) {
    const convertedCounts: GuestCounts = {
      ...counts,
      adult: counts.adult + counts.privilege,
      privilege: 0,
    };

    // Candidate 2: Convert privilege to adult keeping current promos
    const rawConvertedCurrentPromo = computeRawTicketTotals(
      day,
      zone,
      duration,
      convertedCounts,
      promos
    );
    if (rawConvertedCurrentPromo.grandTotal < current.grandTotal) {
      const savings = current.grandTotal - rawConvertedCurrentPromo.grandTotal;
      let effectiveDiscount = 0;
      if (promos.groupPromo === 'promo40') effectiveDiscount = 40;
      else if (promos.groupPromo === 'gtk' || promos.groupPromo === 'birthday') effectiveDiscount = 30;
      const adultDiscountedPrice = Math.round(current.prices.adult * (1 - effectiveDiscount / 100));

      candidates.push({
        grandTotal: rawConvertedCurrentPromo.grandTotal,
        recommendedCounts: convertedCounts,
        recommendedGroupPromo: promos.groupPromo,
        reason: `Выгоднее оформить ${counts.privilege} льготн. как стандартные взрослые билеты со скидкой: ${adultDiscountedPrice} ₽ вместо ${current.prices.privilege} ₽ по льготному тарифу (экономия: ${savings.toLocaleString('ru-RU')} ₽, без документов на кассе).`,
      });
    }

    // Candidate 3: Convert privilege to adult AND activate group4 (-30%) if party >= 4
    if (current.nonInfantVisitors >= 4) {
      const rawConvertedGroup4 = computeRawTicketTotals(
        day,
        zone,
        duration,
        convertedCounts,
        { ...promos, groupPromo: 'group4' }
      );
      if (rawConvertedGroup4.grandTotal < current.grandTotal) {
        const savings = current.grandTotal - rawConvertedGroup4.grandTotal;
        const adultDiscountedPrice = Math.round(current.prices.adult * 0.7);

        candidates.push({
          grandTotal: rawConvertedGroup4.grandTotal,
          recommendedCounts: convertedCounts,
          recommendedGroupPromo: 'group4',
          reason: `В группе ${current.nonInfantVisitors} чел. доступна скидка от 4 гостей (-30%). Выгоднее оформить ${counts.privilege} льготн. билетов как обычные взрослые с групповой скидкой 30%: ${adultDiscountedPrice} ₽ вместо ${current.prices.privilege} ₽ по льготе. Экономия: ${savings.toLocaleString('ru-RU')} ₽ (и без проверки документов на кассе)!`,
        });
      }
    }
  }

  // Find candidate with lowest grandTotal
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.grandTotal - b.grandTotal);
    const best = candidates[0];

    if (best.grandTotal < current.grandTotal) {
      let effectiveDiscount = 0;
      if (best.recommendedGroupPromo === 'promo40') effectiveDiscount = 40;
      else if (
        best.recommendedGroupPromo === 'group4' ||
        best.recommendedGroupPromo === 'gtk' ||
        best.recommendedGroupPromo === 'birthday'
      ) {
        effectiveDiscount = 30;
      }

      const adultDiscountedPrice = Math.round(
        current.prices.adult * (1 - effectiveDiscount / 100)
      );

      optimization = {
        hasBetterOption: true,
        savingsAmount: current.grandTotal - best.grandTotal,
        currentTotal: current.grandTotal,
        optimizedTotal: best.grandTotal,
        recommendedCounts: best.recommendedCounts,
        recommendedGroupPromo: best.recommendedGroupPromo,
        adultDiscountedPrice,
        privilegePrice: current.prices.privilege,
        reason: best.reason,
      };
    }
  }

  return {
    totalVisitors: current.totalVisitors,
    eligibleVisitors: current.eligibleVisitors,
    nonInfantVisitors: current.nonInfantVisitors,
    baseSubtotal: current.baseSubtotal,
    totalSavings: current.totalSavings,
    grandTotal: current.grandTotal,
    breakdown: current.breakdown,
    appliedGroupPromoLabel: current.appliedGroupPromoLabel,
    overtimeMinutes,
    overtimeGuestsCount,
    overtimeFee,
    grandTotalWithOvertime,
    optimization,
  };
}

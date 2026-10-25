import {
  DayType,
  ZoneType,
  DurationType,
  GuestCategory,
  GuestCounts,
  PromosState,
  CalculationResult,
  TicketBreakdownItem,
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

export const PRESET_SCENARIOS = [
  {
    id: 'family',
    title: 'Семья (2 взр + 1 реб)',
    description: '2 взрослых + 1 ребенок (4–13 лет)',
    counts: { adult: 2, teen: 0, child: 1, infant: 0, privilege: 0 },
    groupPromo: 'none' as const,
  },
  {
    id: 'promo40_group',
    title: 'Промокод 40% на чек',
    description: '2 взрослых + 1 подросток со скидкой 40% на весь чек',
    counts: { adult: 2, teen: 1, child: 0, infant: 0, privilege: 0 },
    groupPromo: 'promo40' as const,
  },
  {
    id: 'group4',
    title: 'Компания 4 взрослых (-30%)',
    description: '4 взрослых с автоматической скидкой 30%',
    counts: { adult: 4, teen: 0, child: 0, infant: 0, privilege: 0 },
    groupPromo: 'group4' as const,
  },
  {
    id: 'gtk_family',
    title: 'Гости ГТК Суздаль (-30%)',
    description: '2 взрослых + 2 ребенка по карте гостя отеля',
    counts: { adult: 2, teen: 0, child: 2, infant: 0, privilege: 0 },
    groupPromo: 'gtk' as const,
  },
  {
    id: 'birthday',
    title: 'Именинник с компанией (-30%)',
    description: '3 взрослых + 1 подросток (скидка на всю группу)',
    counts: { adult: 3, teen: 1, child: 0, infant: 0, privilege: 0 },
    groupPromo: 'birthday' as const,
  },
  {
    id: 'pensioners',
    title: 'Льготные гости (2 пенсионера)',
    description: '2 гостя по льготному тарифу (скидки не суммируются)',
    counts: { adult: 0, teen: 0, child: 0, infant: 0, privilege: 2 },
    groupPromo: 'none' as const,
  },
];

/**
 * Calculates ticket totals, discounts, breakdowns and per-guest overtime
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
  const prices = PRICING_MATRIX[day][zone][duration];

  // Total visitors
  const totalVisitors =
    counts.adult + counts.teen + counts.child + counts.infant + counts.privilege;

  // Eligible for promos/coupons: adult, teen, child
  const eligibleVisitors = counts.adult + counts.teen + counts.child;

  // Non-infant visitors: adult, teen, child, privilege (infant is EXCLUDED from overtime)
  const nonInfantVisitors =
    counts.adult + counts.teen + counts.child + counts.privilege;

  // Clamp coupons count so they don't exceed eligible tickets
  const coupon100Count = Math.max(
    0,
    Math.min(promos.coupon100Count, eligibleVisitors)
  );
  const remainingFor60 = Math.max(0, eligibleVisitors - coupon100Count);
  const coupon60Count = Math.max(
    0,
    Math.min(promos.coupon60Count, remainingFor60)
  );

  // Group / Check discount label
  let appliedGroupPromoLabel: string | null = null;
  let checkDiscountPercent = 0;

  if (promos.groupPromo === 'promo40') {
    appliedGroupPromoLabel = 'Промокод 40% на весь чек';
    checkDiscountPercent = 40;
  } else if (promos.groupPromo === 'gtk') {
    appliedGroupPromoLabel = 'Проживание в ГТК «Суздаль» (-30%)';
    checkDiscountPercent = 30;
  } else if (promos.groupPromo === 'group4') {
    appliedGroupPromoLabel = 'Группа от 4 человек (-30%)';
    checkDiscountPercent = 30;
  } else if (promos.groupPromo === 'birthday') {
    appliedGroupPromoLabel = 'Группа с именинником ±7 дней (-30%)';
    checkDiscountPercent = 30;
  }

  // Create standard individual tickets (eligible for discounts)
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

  // Assign individual coupons first (100% first, then 60%) to high-value tickets
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

  // Group tickets into breakdown items
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

  // Add Privileged category if count > 0 (NO discounts or coupons allowed)
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

  // Add Infant category if count > 0 (0 ₽)
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

  // Subtotal without discount
  let baseSubtotal = breakdown.reduce(
    (sum, item) => sum + item.totalBeforeDiscount,
    0
  );
  let totalSavings = breakdown.reduce(
    (sum, item) => sum + item.totalDiscount,
    0
  );

  // Flat fixed discount (if applicable)
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

  // Overtime calculation: 10 rubles per minute PER GUEST (excluding infants!)
  const overtimeGuestsCount =
    typeof customOvertimeGuestsCount === 'number'
      ? Math.max(0, Math.min(customOvertimeGuestsCount, nonInfantVisitors))
      : nonInfantVisitors;

  const overtimeMinutes = Math.max(0, overtimeMinutesRaw);
  const overtimeFee = overtimeMinutes * 10 * overtimeGuestsCount;
  const grandTotalWithOvertime = grandTotal + overtimeFee;

  return {
    totalVisitors,
    eligibleVisitors,
    nonInfantVisitors,
    baseSubtotal,
    totalSavings,
    grandTotal,
    breakdown,
    appliedGroupPromoLabel,
    overtimeMinutes,
    overtimeGuestsCount,
    overtimeFee,
    grandTotalWithOvertime,
  };
}

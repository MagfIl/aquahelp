export type DayType = 'weekday' | 'weekend';
export type ZoneType = 'aquatory' | 'aquaterra';
export type DurationType = '2h' | '4h' | 'all_day';

export type GuestCategory = 'adult' | 'teen' | 'child' | 'infant' | 'privilege';

export interface GuestCounts {
  adult: number;
  teen: number;
  child: number;
  infant: number;
  privilege: number;
}

export type GroupDiscountType = 'none' | 'gtk' | 'group4' | 'birthday' | 'promo40';

export interface PromosState {
  groupPromo: GroupDiscountType;
  coupon100Count: number;
  coupon60Count: number;
  customDiscountType: 'none' | 'percent' | 'fixed';
  customDiscountValue: number;
}

export interface TicketBreakdownItem {
  id: string;
  category: GuestCategory;
  categoryName: string;
  ageNote: string;
  quantity: number;
  basePrice: number;
  discountPercent: number;
  discountAmountPerTicket: number;
  finalPricePerTicket: number;
  totalBeforeDiscount: number;
  totalDiscount: number;
  totalFinal: number;
  appliedPromoLabel?: string;
  isPrivileged?: boolean;
}

export interface OptimizationRecommendation {
  hasBetterOption: boolean;
  savingsAmount: number;
  currentTotal: number;
  optimizedTotal: number;
  reason: string;
  recommendedCounts: GuestCounts;
  recommendedGroupPromo?: GroupDiscountType;
  adultDiscountedPrice: number;
  privilegePrice: number;
}

export interface CalculationResult {
  totalVisitors: number;
  eligibleVisitors: number; // adult + teen + child
  nonInfantVisitors: number; // adult + teen + child + privilege (all except infant)
  baseSubtotal: number;
  totalSavings: number;
  grandTotal: number;
  breakdown: TicketBreakdownItem[];
  appliedGroupPromoLabel: string | null;
  overtimeMinutes: number;
  overtimeGuestsCount: number;
  overtimeFee: number;
  grandTotalWithOvertime: number;
  optimization: OptimizationRecommendation | null;
}

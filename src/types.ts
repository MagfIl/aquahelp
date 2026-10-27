export type DayType = 'weekday' | 'weekend';
export type ZoneType = 'aquatory' | 'aquaterra';
export type DurationType = '2h' | '4h' | 'all_day';
export type TariffType = 'standard' | 'premium';

export type UserRole = 'developer' | 'admin' | 'employee';

export interface EmployeeProfile {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  createdAt: string;
}

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

export type PageType = 'home' | 'calculator' | 'templates' | 'admin';

export type TemplateStatus = 'approved' | 'pending_approval' | 'rejected' | 'private';

export interface SupportTemplate {
  id: string;
  title: string;
  content: string;
  categories: string[];
  updatedAt: string;
  authorId?: string;
  authorName?: string;
  isPersonal?: boolean;
  status?: TemplateStatus;
}

export type PricingMatrixType = {
  [day in DayType]: {
    [zone in ZoneType]: {
      [duration in DurationType]: {
        adult: number;
        teen: number;
        child: number;
        privilege: number;
      };
    };
  };
};

export interface PremiumPricesType {
  weekday: {
    adult: number;
    teen: number;
    child: number;
  };
  weekend: {
    adult: number;
    teen: number;
    child: number;
  };
}

export interface FireplaceConfigType {
  enabled: boolean;
  hours: number;
  hourlyRate: number;
  minHours: number;
}

export interface UnitTicketPriceDetail {
  id: string;
  category: GuestCategory;
  categoryName: string;
  subLabel?: string;
  quantity: number;
  unitPriceWithDiscount: number;
  originalUnitPrice: number;
  hasDiscount: boolean;
}

export interface CalculationResult {
  totalVisitors: number;
  eligibleVisitors: number;
  nonInfantVisitors: number;
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
  // New features
  tariffType: TariffType;
  fireplaceFee: number;
  fireplaceHours: number;
  grandTotalWithAll: number;
  unitPricesBreakdown: UnitTicketPriceDetail[];
}

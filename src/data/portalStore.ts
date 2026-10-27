import { PricingMatrixType, SupportTemplate, PremiumPricesType, FireplaceConfigType } from '../types';
import { PRICING_MATRIX } from './pricing';
import { DEFAULT_TEMPLATES } from './defaultTemplates';

const STORAGE_KEYS = {
  PRICES: 'suzdalaqua_prices_v1',
  PREMIUM_PRICES: 'suzdalaqua_premium_prices_v1',
  OVERTIME_RATE: 'suzdalaqua_overtime_rate_v1',
  FIREPLACE_RATE: 'suzdalaqua_fireplace_rate_v1',
  TEMPLATES: 'suzdalaqua_templates_v1',
} as const;

export const DEFAULT_OVERTIME_RATE = 10; // 10 ₽/мин

export const DEFAULT_PREMIUM_PRICES: PremiumPricesType = {
  weekday: {
    adult: 3800,
    teen: 3800,
    child: 2800,
  },
  weekend: {
    adult: 5500,
    teen: 5500,
    child: 4100,
  },
};

export const DEFAULT_FIREPLACE_CONFIG: FireplaceConfigType = {
  enabled: false,
  hours: 3,
  hourlyRate: 8000,
  minHours: 3,
};

// Event dispatch for live tab/component reactivity
const STORE_UPDATE_EVENT = 'suzdalaqua_store_updated';

export function notifyStoreUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORE_UPDATE_EVENT));
  }
}

export function subscribeToStore(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(STORE_UPDATE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(STORE_UPDATE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

// Pricing matrix
export function getStoredPricingMatrix(): PricingMatrixType {
  if (typeof window === 'undefined') return PRICING_MATRIX as unknown as PricingMatrixType;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRICES);
    if (!raw) return PRICING_MATRIX as unknown as PricingMatrixType;
    const parsed = JSON.parse(raw);
    if (parsed.weekday && parsed.weekend) {
      return parsed as PricingMatrixType;
    }
  } catch (e) {
    console.error('Error loading stored pricing matrix:', e);
  }
  return PRICING_MATRIX as unknown as PricingMatrixType;
}

export function saveStoredPricingMatrix(matrix: PricingMatrixType) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(matrix));
  notifyStoreUpdated();
}

export function resetStoredPricingMatrix(): PricingMatrixType {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.PRICES);
  }
  notifyStoreUpdated();
  return PRICING_MATRIX as unknown as PricingMatrixType;
}

// Premium Prices
export function getStoredPremiumPrices(): PremiumPricesType {
  if (typeof window === 'undefined') return DEFAULT_PREMIUM_PRICES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREMIUM_PRICES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.weekday && parsed.weekend) {
        return parsed as PremiumPricesType;
      }
    }
  } catch (e) {
    console.error('Error loading premium prices:', e);
  }
  return DEFAULT_PREMIUM_PRICES;
}

export function saveStoredPremiumPrices(prices: PremiumPricesType) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PREMIUM_PRICES, JSON.stringify(prices));
  notifyStoreUpdated();
}

// Fireplace Rate
export function getStoredFireplaceRate(): number {
  if (typeof window === 'undefined') return DEFAULT_FIREPLACE_CONFIG.hourlyRate;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIREPLACE_RATE);
    if (raw !== null) {
      const val = parseInt(raw, 10);
      if (!isNaN(val) && val >= 0) return val;
    }
  } catch (e) {
    console.error('Error reading fireplace rate:', e);
  }
  return DEFAULT_FIREPLACE_CONFIG.hourlyRate;
}

export function saveStoredFireplaceRate(rate: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.FIREPLACE_RATE, rate.toString());
  notifyStoreUpdated();
}

// Overtime rate
export function getStoredOvertimeRate(): number {
  if (typeof window === 'undefined') return DEFAULT_OVERTIME_RATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OVERTIME_RATE);
    if (raw !== null) {
      const val = parseInt(raw, 10);
      if (!isNaN(val) && val >= 0) return val;
    }
  } catch (e) {
    console.error('Error reading overtime rate:', e);
  }
  return DEFAULT_OVERTIME_RATE;
}

export function saveStoredOvertimeRate(rate: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.OVERTIME_RATE, rate.toString());
  notifyStoreUpdated();
}

// Templates
export function getStoredTemplates(): SupportTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!raw) return DEFAULT_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as SupportTemplate[];
    }
  } catch (e) {
    console.error('Error loading templates:', e);
  }
  return DEFAULT_TEMPLATES;
}

export function saveStoredTemplates(templates: SupportTemplate[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  notifyStoreUpdated();
}

export function resetStoredTemplates(): SupportTemplate[] {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
  }
  notifyStoreUpdated();
  return DEFAULT_TEMPLATES;
}

// Backup JSON
export function createBackupJson(): string {
  const backup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    pricing: getStoredPricingMatrix(),
    premiumPricing: getStoredPremiumPrices(),
    overtimeRate: getStoredOvertimeRate(),
    fireplaceRate: getStoredFireplaceRate(),
    templates: getStoredTemplates(),
  };
  return JSON.stringify(backup, null, 2);
}

export function restoreBackupJson(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.pricing && parsed.pricing.weekday && parsed.pricing.weekend) {
      saveStoredPricingMatrix(parsed.pricing);
    }
    if (parsed.premiumPricing && parsed.premiumPricing.weekday && parsed.premiumPricing.weekend) {
      saveStoredPremiumPrices(parsed.premiumPricing);
    }
    if (typeof parsed.overtimeRate === 'number') {
      saveStoredOvertimeRate(parsed.overtimeRate);
    }
    if (typeof parsed.fireplaceRate === 'number') {
      saveStoredFireplaceRate(parsed.fireplaceRate);
    }
    if (Array.isArray(parsed.templates)) {
      saveStoredTemplates(parsed.templates);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Неверный формат JSON файла' };
  }
}

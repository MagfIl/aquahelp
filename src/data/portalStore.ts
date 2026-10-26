import { PricingMatrixType, SupportTemplate } from '../types';
import { PRICING_MATRIX } from './pricing';
import { DEFAULT_TEMPLATES } from './defaultTemplates';

const STORAGE_KEYS = {
  PRICES: 'suzdalaqua_prices_v1',
  OVERTIME_RATE: 'suzdalaqua_overtime_rate_v1',
  TEMPLATES: 'suzdalaqua_templates_v1',
  ADMIN_PIN: 'suzdalaqua_admin_pin_v1',
  ADMIN_AUTH: 'suzdalaqua_admin_auth_session',
} as const;

export const DEFAULT_OVERTIME_RATE = 10; // 10 ₽/мин
export const DEFAULT_ADMIN_PIN = '2026';

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
    // basic sanity check
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

// Admin PIN
export function getStoredAdminPin(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PIN;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
    if (saved && saved.trim().length > 0) return saved.trim();
  } catch (e) {
    console.error('Error reading admin pin:', e);
  }
  return DEFAULT_ADMIN_PIN;
}

export function saveStoredAdminPin(newPin: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, newPin.trim());
  notifyStoreUpdated();
}

// Admin Auth Session
export function isStoredAdminAuth(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  } catch {
    return false;
  }
}

export function setStoredAdminAuth(isAuth: boolean) {
  if (typeof window === 'undefined') return;
  if (isAuth) {
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  }
  notifyStoreUpdated();
}

// Backup JSON
export function createBackupJson(): string {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    pricing: getStoredPricingMatrix(),
    overtimeRate: getStoredOvertimeRate(),
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
    if (typeof parsed.overtimeRate === 'number') {
      saveStoredOvertimeRate(parsed.overtimeRate);
    }
    if (Array.isArray(parsed.templates)) {
      saveStoredTemplates(parsed.templates);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Неверный формат JSON файла' };
  }
}

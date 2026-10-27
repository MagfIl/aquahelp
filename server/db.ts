import fs from 'fs';
import path from 'path';
import { EmployeeProfile, SupportTemplate, PricingMatrixType, PremiumPricesType, FireplaceConfigType } from '../src/types';
import { DEFAULT_TEMPLATES } from '../src/data/defaultTemplates';
import { PRICING_MATRIX } from '../src/data/pricing';
import { DEFAULT_PREMIUM_PRICES, DEFAULT_FIREPLACE_CONFIG, DEFAULT_OVERTIME_RATE } from '../src/data/portalStore';

export interface DatabaseSchema {
  employees: EmployeeProfile[];
  templates: SupportTemplate[];
  personalTemplates: SupportTemplate[];
  settings: {
    pricingMatrix: PricingMatrixType;
    overtimeRate: number;
    premiumPrices: PremiumPricesType;
    fireplaceConfig: FireplaceConfigType;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

const INITIAL_EMPLOYEES: EmployeeProfile[] = [
  {
    id: 'emp-dev-001',
    name: 'Разработчик',
    role: 'developer',
    pin: '000000',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'emp-adm-001',
    name: 'Главный Администратор',
    role: 'admin',
    pin: '202600',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'emp-op-001',
    name: 'Оператор поддержки',
    role: 'employee',
    pin: '111111',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const DEFAULT_DATABASE: DatabaseSchema = {
  employees: INITIAL_EMPLOYEES,
  templates: DEFAULT_TEMPLATES,
  personalTemplates: [],
  settings: {
    pricingMatrix: PRICING_MATRIX as unknown as PricingMatrixType,
    overtimeRate: DEFAULT_OVERTIME_RATE,
    premiumPrices: DEFAULT_PREMIUM_PRICES,
    fireplaceConfig: DEFAULT_FIREPLACE_CONFIG,
  },
};

type ChangeListener = (eventType: 'employees' | 'templates' | 'personalTemplates' | 'settings', payload: any) => void;
const changeListeners: Set<ChangeListener> = new Set();

export function onDatabaseChange(listener: ChangeListener): () => void {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
}

function notifyChange(eventType: 'employees' | 'templates' | 'personalTemplates' | 'settings', payload: any) {
  for (const listener of changeListeners) {
    try {
      listener(eventType, payload);
    } catch (e) {
      console.error('Error in change listener:', e);
    }
  }
}

let memoryDb: DatabaseSchema | null = null;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDatabase(): DatabaseSchema {
  if (memoryDb) return memoryDb;

  ensureDataDirectory();

  if (!fs.existsSync(DB_FILE)) {
    saveDatabase(DEFAULT_DATABASE);
    memoryDb = JSON.parse(JSON.stringify(DEFAULT_DATABASE));
    return memoryDb!;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    // Normalize and ensure all keys exist
    const employees: EmployeeProfile[] = Array.isArray(parsed.employees) && parsed.employees.length > 0
      ? parsed.employees.map((e: any) => ({
          ...e,
          pin: e.role === 'developer' && (!e.pin || e.pin === '0000') ? '000000' : (e.pin || '000000').padEnd(6, '0'),
        }))
      : INITIAL_EMPLOYEES;

    memoryDb = {
      employees,
      templates: Array.isArray(parsed.templates) ? parsed.templates : DEFAULT_TEMPLATES,
      personalTemplates: Array.isArray(parsed.personalTemplates) ? parsed.personalTemplates : [],
      settings: {
        pricingMatrix: parsed.settings?.pricingMatrix || (PRICING_MATRIX as unknown as PricingMatrixType),
        overtimeRate: parsed.settings?.overtimeRate ?? DEFAULT_OVERTIME_RATE,
        premiumPrices: parsed.settings?.premiumPrices || DEFAULT_PREMIUM_PRICES,
        fireplaceConfig: parsed.settings?.fireplaceConfig || DEFAULT_FIREPLACE_CONFIG,
      },
    };

    return memoryDb;
  } catch (err) {
    console.error('Failed reading database file, using defaults:', err);
    memoryDb = JSON.parse(JSON.stringify(DEFAULT_DATABASE));
    return memoryDb!;
  }
}

export function saveDatabase(data: DatabaseSchema): void {
  ensureDataDirectory();
  memoryDb = data;
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed atomically saving database:', err);
    try {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch {}
  }
}

// ----------------------------------------------------
// ACTOR AUTH & PERMISSION VALIDATION
// ----------------------------------------------------
export function verifyActor(actorId?: string, actorPin?: string): { ok: boolean; role?: string; employee?: EmployeeProfile } {
  if (!actorId || !actorPin) return { ok: false };
  const db = loadDatabase();
  const found = db.employees.find((e) => e.id === actorId);
  if (!found || found.pin !== actorPin) {
    return { ok: false };
  }
  return { ok: true, role: found.role, employee: found };
}

// ----------------------------------------------------
// EMPLOYEES CRUD
// ----------------------------------------------------
export function getEmployees(): EmployeeProfile[] {
  return loadDatabase().employees;
}

export function authPin(pin: string): { success: boolean; employee?: EmployeeProfile; error?: string } {
  const clean = pin.trim();
  const db = loadDatabase();
  const matched = db.employees.find((e) => e.pin === clean);
  if (matched) {
    return { success: true, employee: matched };
  }
  return { success: false, error: 'Неверный PIN-код сотрудника' };
}

export function upsertEmployee(
  employee: EmployeeProfile,
  actorId?: string,
  actorPin?: string
): { success: boolean; error?: string; employee?: EmployeeProfile } {
  const db = loadDatabase();
  const actor = verifyActor(actorId, actorPin);

  // Validate PIN format (strictly 6 digits)
  const pin = (employee.pin || '').trim();
  if (!/^\d{6}$/.test(pin)) {
    return { success: false, error: 'PIN-код должен содержать ровно 6 цифр' };
  }

  const existingIndex = db.employees.findIndex((e) => e.id === employee.id);
  const existing = existingIndex >= 0 ? db.employees[existingIndex] : null;

  // Creating or modifying a developer requires developer permissions
  if (employee.role === 'developer' && actor.role !== 'developer') {
    return { success: false, error: 'Только разработчик может назначать роль Разработчик' };
  }

  // Modifying an existing developer requires developer permissions
  if (existing?.role === 'developer' && actor.role !== 'developer') {
    return { success: false, error: 'Администратор не имеет права изменять профиль разработчика' };
  }

  // Only admin or developer can create/edit employees
  if (actor.role !== 'admin' && actor.role !== 'developer') {
    // Exception: Allow self-update if actor is updating their own record without elevating role
    if (!actor.employee || actor.employee.id !== employee.id || actor.employee.role !== employee.role) {
      return { success: false, error: 'Недостаточно прав для управления сотрудниками' };
    }
  }

  const normalized: EmployeeProfile = {
    ...employee,
    name: employee.name.trim(),
    pin,
    createdAt: existing ? existing.createdAt : (employee.createdAt || new Date().toISOString()),
  };

  if (existingIndex >= 0) {
    db.employees[existingIndex] = normalized;
  } else {
    db.employees.push(normalized);
  }

  saveDatabase(db);
  notifyChange('employees', db.employees);
  return { success: true, employee: normalized };
}

export function deleteEmployee(
  employeeId: string,
  actorId?: string,
  actorPin?: string
): { success: boolean; error?: string } {
  const db = loadDatabase();
  const actor = verifyActor(actorId, actorPin);

  const emp = db.employees.find((e) => e.id === employeeId);
  if (!emp) {
    return { success: false, error: 'Сотрудник не найден' };
  }

  // Developer profile cannot be deleted by non-developer
  if (emp.role === 'developer' && actor.role !== 'developer') {
    return { success: false, error: 'Администратор не имеет права удалять профиль разработчика' };
  }

  // Cannot delete the last developer
  if (emp.role === 'developer') {
    const devCount = db.employees.filter((e) => e.role === 'developer').length;
    if (devCount <= 1) {
      return { success: false, error: 'Нельзя удалить единственного разработчика в системе' };
    }
  }

  // Non-admin / non-developer cannot delete
  if (actor.role !== 'admin' && actor.role !== 'developer') {
    return { success: false, error: 'Недостаточно прав для удаления сотрудников' };
  }

  db.employees = db.employees.filter((e) => e.id !== employeeId);
  saveDatabase(db);
  notifyChange('employees', db.employees);
  return { success: true };
}

// ----------------------------------------------------
// GLOBAL TEMPLATES CRUD
// ----------------------------------------------------
export function getGlobalTemplates(): SupportTemplate[] {
  return loadDatabase().templates;
}

export function upsertGlobalTemplate(
  template: SupportTemplate,
  actorId?: string,
  actorPin?: string
): { success: boolean; error?: string; template?: SupportTemplate } {
  const db = loadDatabase();
  const actor = verifyActor(actorId, actorPin);

  if (actor.role !== 'admin' && actor.role !== 'developer') {
    return { success: false, error: 'Только администратор или разработчик могут управлять общими шаблонами' };
  }

  const normalized: SupportTemplate = {
    ...template,
    title: template.title.trim(),
    content: template.content.trim(),
    updatedAt: new Date().toISOString(),
    isPersonal: false,
    status: 'approved',
  };

  const idx = db.templates.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    db.templates[idx] = normalized;
  } else {
    db.templates.push(normalized);
  }

  saveDatabase(db);
  notifyChange('templates', db.templates);
  return { success: true, template: normalized };
}

export function deleteGlobalTemplate(
  templateId: string,
  actorId?: string,
  actorPin?: string
): { success: boolean; error?: string } {
  const db = loadDatabase();
  const actor = verifyActor(actorId, actorPin);

  if (actor.role !== 'admin' && actor.role !== 'developer') {
    return { success: false, error: 'Только администратор или разработчик могут удалять общие шаблоны' };
  }

  db.templates = db.templates.filter((t) => t.id !== templateId);
  saveDatabase(db);
  notifyChange('templates', db.templates);
  return { success: true };
}

// ----------------------------------------------------
// PERSONAL TEMPLATES CRUD & MODERATION
// ----------------------------------------------------
export function getPersonalTemplates(): SupportTemplate[] {
  return loadDatabase().personalTemplates;
}

export function upsertPersonalTemplate(
  template: SupportTemplate
): { success: boolean; template: SupportTemplate } {
  const db = loadDatabase();
  const normalized: SupportTemplate = {
    ...template,
    title: template.title.trim(),
    content: template.content.trim(),
    updatedAt: new Date().toISOString(),
    isPersonal: true,
    status: template.status || 'private',
  };

  const idx = db.personalTemplates.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    db.personalTemplates[idx] = normalized;
  } else {
    db.personalTemplates.push(normalized);
  }

  saveDatabase(db);
  notifyChange('personalTemplates', db.personalTemplates);
  return { success: true, template: normalized };
}

export function deletePersonalTemplate(
  templateId: string
): { success: boolean } {
  const db = loadDatabase();
  db.personalTemplates = db.personalTemplates.filter((t) => t.id !== templateId);
  saveDatabase(db);
  notifyChange('personalTemplates', db.personalTemplates);
  return { success: true };
}

export function proposePersonalTemplate(
  templateId: string
): { success: boolean; error?: string } {
  const db = loadDatabase();
  const idx = db.personalTemplates.findIndex((t) => t.id === templateId);
  if (idx < 0) return { success: false, error: 'Шаблон не найден' };

  db.personalTemplates[idx].status = 'pending_approval';
  db.personalTemplates[idx].updatedAt = new Date().toISOString();

  saveDatabase(db);
  notifyChange('personalTemplates', db.personalTemplates);
  return { success: true };
}

export function moderatePersonalTemplate(
  templateId: string,
  action: 'approve' | 'reject',
  modifiedTemplate?: SupportTemplate,
  actorId?: string,
  actorPin?: string
): { success: boolean; error?: string } {
  const db = loadDatabase();
  const actor = verifyActor(actorId, actorPin);

  if (actor.role !== 'admin' && actor.role !== 'developer') {
    return { success: false, error: 'Недостаточно прав для модерации шаблонов' };
  }

  const idx = db.personalTemplates.findIndex((t) => t.id === templateId);
  if (idx < 0) return { success: false, error: 'Шаблон не найден' };

  const current = db.personalTemplates[idx];
  const target = modifiedTemplate || current;

  if (action === 'approve') {
    // 1. Mark personal template as approved
    db.personalTemplates[idx] = {
      ...target,
      status: 'approved',
      updatedAt: new Date().toISOString(),
    };

    // 2. Add to global templates
    const newGlobalTpl: SupportTemplate = {
      id: `tpl-pub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: target.title.trim(),
      content: target.content.trim(),
      categories: target.categories && target.categories.length > 0 ? target.categories : ['Общие вопросы'],
      updatedAt: new Date().toISOString(),
      isPersonal: false,
      status: 'approved',
      authorName: current.authorName || 'Сотрудник',
    };

    db.templates.push(newGlobalTpl);
    saveDatabase(db);
    notifyChange('personalTemplates', db.personalTemplates);
    notifyChange('templates', db.templates);
  } else {
    // Reject
    db.personalTemplates[idx] = {
      ...target,
      status: 'rejected',
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(db);
    notifyChange('personalTemplates', db.personalTemplates);
  }

  return { success: true };
}

// ----------------------------------------------------
// SETTINGS
// ----------------------------------------------------
export function getSettings() {
  return loadDatabase().settings;
}

export function updateSettings(
  settings: Partial<DatabaseSchema['settings']>,
  actorId?: string,
  actorPin?: string
): { success: boolean; error?: string; settings?: DatabaseSchema['settings'] } {
  const db = loadDatabase();
  const actor = verifyActor(actorId, actorPin);

  if (actor.role !== 'admin' && actor.role !== 'developer') {
    return { success: false, error: 'Только администратор или разработчик могут изменять настройки' };
  }

  db.settings = {
    ...db.settings,
    ...settings,
  };

  saveDatabase(db);
  notifyChange('settings', db.settings);
  return { success: true, settings: db.settings };
}

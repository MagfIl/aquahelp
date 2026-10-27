import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { EmployeeProfile, SupportTemplate, TemplateStatus } from '../types';
import { DEFAULT_TEMPLATES } from '../data/defaultTemplates';

// Default Initial Profiles
export const INITIAL_EMPLOYEES: EmployeeProfile[] = [
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

const LOCAL_STORAGE_KEYS = {
  EMPLOYEES: 'suzdalaqua_employees_v3',
  GLOBAL_TEMPLATES: 'suzdalaqua_global_templates_v2',
  PERSONAL_TEMPLATES: 'suzdalaqua_personal_templates_v2',
};

// ----------------------------------------------------
// EMPLOYEES
// ----------------------------------------------------
const employeeListeners: Array<(list: EmployeeProfile[]) => void> = [];

function getSessionActor(): { actorId?: string; actorPin?: string } {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem('suzdalaqua_current_employee_session');
    if (raw) {
      const emp = JSON.parse(raw);
      if (emp?.id && emp?.pin) {
        return { actorId: emp.id, actorPin: emp.pin };
      }
    }
  } catch (e) {
    console.error('Error reading session actor:', e);
  }
  return {};
}

function notifyEmployeeListeners(list: EmployeeProfile[]) {
  employeeListeners.forEach((fn) => {
    try {
      fn(list);
    } catch (err) {
      console.error('Error in employee listener:', err);
    }
  });
}

export function getLocalEmployees(): EmployeeProfile[] {
  if (typeof window === 'undefined') return INITIAL_EMPLOYEES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.EMPLOYEES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((e) => {
          let pin = e.pin;
          if (e.role === 'developer' && (!pin || pin === '0000')) {
            pin = '000000';
          } else if (pin && pin.length < 6) {
            pin = pin.padEnd(6, '0');
          }
          return { ...e, pin: pin || '000000' };
        });
      }
    }
  } catch (e) {
    console.error('Error reading local employees:', e);
  }
  return INITIAL_EMPLOYEES;
}

export function saveLocalEmployees(list: EmployeeProfile[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEYS.EMPLOYEES, JSON.stringify(list));
}

export function subscribeEmployees(
  onUpdate: (employees: EmployeeProfile[]) => void
): () => void {
  // Always immediately give current local data
  onUpdate(getLocalEmployees());

  // Register in-memory reactive listener
  employeeListeners.push(onUpdate);

  let unsubFirestore = () => {};
  try {
    const colRef = collection(db, 'employees');
    unsubFirestore = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: EmployeeProfile[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as any;
            let pin = data.pin;
            if (data.role === 'developer' && (!pin || pin === '0000')) {
              pin = '000000';
            } else if (pin && pin.length < 6) {
              pin = pin.padEnd(6, '0');
            }
            list.push({
              id: d.id,
              name: data.name,
              role: data.role,
              pin: pin || '000000',
              createdAt: data.createdAt || new Date().toISOString(),
            });
          });
          saveLocalEmployees(list);
          notifyEmployeeListeners(list);
        } else {
          // Seed defaults if collection is empty
          INITIAL_EMPLOYEES.forEach(async (emp) => {
            try {
              await setDoc(doc(db, 'employees', emp.id), emp);
            } catch (err) {
              console.warn('Could not seed employee in Firestore:', err);
            }
          });
        }
      },
      (err) => {
        console.warn('Firestore employees snapshot error, using local fallback:', err);
      }
    );
  } catch (e) {
    console.warn('Firestore subscribeEmployees failed, using local cache:', e);
  }

  return () => {
    const idx = employeeListeners.indexOf(onUpdate);
    if (idx >= 0) {
      employeeListeners.splice(idx, 1);
    }
    unsubFirestore();
  };
}

export async function upsertEmployee(employee: EmployeeProfile): Promise<void> {
  // Local first
  const current = getLocalEmployees();
  const idx = current.findIndex((e) => e.id === employee.id);
  let updated: EmployeeProfile[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = employee;
  } else {
    updated = [...current, employee];
  }
  saveLocalEmployees(updated);
  // Immediately notify all active listeners across the app
  notifyEmployeeListeners(updated);

  // Firestore sync with actor authorization verification
  try {
    const actor = getSessionActor();
    const payload = {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      pin: employee.pin,
      createdAt: employee.createdAt,
      ...(actor.actorId ? { actorId: actor.actorId, actorPin: actor.actorPin } : {}),
    };
    await setDoc(doc(db, 'employees', employee.id), payload);
  } catch (e) {
    console.warn('Firestore employee write error (saved locally):', e);
  }
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  const current = getLocalEmployees().filter((e) => e.id !== employeeId);
  saveLocalEmployees(current);
  // Immediately notify all active listeners across the app
  notifyEmployeeListeners(current);

  try {
    await deleteDoc(doc(db, 'employees', employeeId));
  } catch (e) {
    console.warn('Firestore employee delete error (removed locally):', e);
  }
}

// ----------------------------------------------------
// GLOBAL TEMPLATES
// ----------------------------------------------------
const globalTemplateListeners: Array<(list: SupportTemplate[]) => void> = [];

function notifyGlobalTemplateListeners(list: SupportTemplate[]) {
  globalTemplateListeners.forEach((fn) => {
    try {
      fn(list);
    } catch (err) {
      console.error('Error in global template listener:', err);
    }
  });
}

export function getLocalGlobalTemplates(): SupportTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.GLOBAL_TEMPLATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading local global templates:', e);
  }
  return DEFAULT_TEMPLATES;
}

export function saveLocalGlobalTemplates(list: SupportTemplate[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEYS.GLOBAL_TEMPLATES, JSON.stringify(list));
}

export function subscribeGlobalTemplates(
  onUpdate: (templates: SupportTemplate[]) => void
): () => void {
  onUpdate(getLocalGlobalTemplates());
  globalTemplateListeners.push(onUpdate);

  let unsubFirestore = () => {};
  try {
    const colRef = collection(db, 'templates');
    unsubFirestore = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: SupportTemplate[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as SupportTemplate);
          });
          saveLocalGlobalTemplates(list);
          notifyGlobalTemplateListeners(list);
        } else {
          // Seed defaults
          DEFAULT_TEMPLATES.forEach(async (tpl) => {
            try {
              await setDoc(doc(db, 'templates', tpl.id), tpl);
            } catch (err) {
              console.warn('Could not seed template in Firestore:', err);
            }
          });
        }
      },
      (err) => {
        console.warn('Firestore templates snapshot error, using local fallback:', err);
      }
    );
  } catch (e) {
    console.warn('Firestore subscribeGlobalTemplates failed:', e);
  }

  return () => {
    const idx = globalTemplateListeners.indexOf(onUpdate);
    if (idx >= 0) {
      globalTemplateListeners.splice(idx, 1);
    }
    unsubFirestore();
  };
}

export async function upsertGlobalTemplate(template: SupportTemplate): Promise<void> {
  const current = getLocalGlobalTemplates();
  const idx = current.findIndex((t) => t.id === template.id);
  let updated: SupportTemplate[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = template;
  } else {
    updated = [template, ...current];
  }
  saveLocalGlobalTemplates(updated);
  notifyGlobalTemplateListeners(updated);

  try {
    const actor = getSessionActor();
    const payload = {
      ...template,
      text: template.content, // sync text/content
      ...(actor.actorId ? { actorId: actor.actorId, actorPin: actor.actorPin } : {}),
    };
    await setDoc(doc(db, 'templates', template.id), payload);
  } catch (e) {
    console.warn('Firestore global template write error (saved locally):', e);
  }
}

export async function deleteGlobalTemplate(templateId: string): Promise<void> {
  const current = getLocalGlobalTemplates().filter((t) => t.id !== templateId);
  saveLocalGlobalTemplates(current);
  notifyGlobalTemplateListeners(current);

  try {
    await deleteDoc(doc(db, 'templates', templateId));
  } catch (e) {
    console.warn('Firestore global template delete error (removed locally):', e);
  }
}

// ----------------------------------------------------
// PERSONAL TEMPLATES (With Proposal & Moderation)
// ----------------------------------------------------
const personalTemplateListeners: Array<(list: SupportTemplate[]) => void> = [];

function notifyPersonalTemplateListeners(list: SupportTemplate[]) {
  personalTemplateListeners.forEach((fn) => {
    try {
      fn(list);
    } catch (err) {
      console.error('Error in personal template listener:', err);
    }
  });
}

export function getLocalPersonalTemplates(): SupportTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.PERSONAL_TEMPLATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading personal templates:', e);
  }
  return [];
}

export function saveLocalPersonalTemplates(list: SupportTemplate[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEYS.PERSONAL_TEMPLATES, JSON.stringify(list));
}

export function subscribePersonalTemplates(
  onUpdate: (templates: SupportTemplate[]) => void
): () => void {
  onUpdate(getLocalPersonalTemplates());
  personalTemplateListeners.push(onUpdate);

  let unsubFirestore = () => {};
  try {
    const colRef = collection(db, 'personal_templates');
    unsubFirestore = onSnapshot(
      colRef,
      (snapshot) => {
        const list: SupportTemplate[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as SupportTemplate);
        });
        saveLocalPersonalTemplates(list);
        notifyPersonalTemplateListeners(list);
      },
      (err) => {
        console.warn('Firestore personal templates error, using local fallback:', err);
      }
    );
  } catch (e) {
    console.warn('Firestore subscribePersonalTemplates failed:', e);
  }

  return () => {
    const idx = personalTemplateListeners.indexOf(onUpdate);
    if (idx >= 0) {
      personalTemplateListeners.splice(idx, 1);
    }
    unsubFirestore();
  };
}

export async function upsertPersonalTemplate(template: SupportTemplate): Promise<void> {
  const current = getLocalPersonalTemplates();
  const idx = current.findIndex((t) => t.id === template.id);
  let updated: SupportTemplate[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = template;
  } else {
    updated = [template, ...current];
  }
  saveLocalPersonalTemplates(updated);
  notifyPersonalTemplateListeners(updated);

  try {
    const actor = getSessionActor();
    const payload = {
      ...template,
      text: template.content, // sync text/content
      ...(actor.actorId ? { actorId: actor.actorId, actorPin: actor.actorPin } : {}),
    };
    await setDoc(doc(db, 'personal_templates', template.id), payload);
  } catch (e) {
    console.warn('Firestore personal template write error:', e);
  }
}

export async function deletePersonalTemplate(templateId: string): Promise<void> {
  const current = getLocalPersonalTemplates().filter((t) => t.id !== templateId);
  saveLocalPersonalTemplates(current);
  notifyPersonalTemplateListeners(current);

  try {
    await deleteDoc(doc(db, 'personal_templates', templateId));
  } catch (e) {
    console.warn('Firestore personal template delete error:', e);
  }
}

export async function proposePersonalTemplate(templateId: string): Promise<void> {
  const current = getLocalPersonalTemplates();
  const tpl = current.find((t) => t.id === templateId);
  if (!tpl) return;
  const updated: SupportTemplate = { ...tpl, status: 'pending_approval' };
  await upsertPersonalTemplate(updated);
}

export async function approvePersonalTemplate(template: SupportTemplate): Promise<void> {
  // 1. Add to global templates
  const globalTpl: SupportTemplate = {
    ...template,
    id: `tpl-pub-${Date.now()}`,
    isPersonal: false,
    status: 'approved',
    updatedAt: new Date().toISOString(),
  };
  await upsertGlobalTemplate(globalTpl);

  // 2. Mark personal template as approved
  const updatedPersonal: SupportTemplate = {
    ...template,
    status: 'approved',
  };
  await upsertPersonalTemplate(updatedPersonal);
}

export async function rejectPersonalTemplate(templateId: string): Promise<void> {
  const current = getLocalPersonalTemplates();
  const tpl = current.find((t) => t.id === templateId);
  if (!tpl) return;
  const updated: SupportTemplate = { ...tpl, status: 'rejected' };
  await upsertPersonalTemplate(updated);
}

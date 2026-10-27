import { EmployeeProfile, SupportTemplate } from '../types';
import { DEFAULT_TEMPLATES } from '../data/defaultTemplates';

// Initial default employee profiles
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
  EMPLOYEES: 'suzdalaqua_local_employees_v1',
  GLOBAL_TEMPLATES: 'suzdalaqua_local_templates_v1',
  PERSONAL_TEMPLATES: 'suzdalaqua_local_personal_templates_v1',
};

// Helper: read active session actor credentials to authorize server operations
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

// ----------------------------------------------------
// REAL-TIME EVENT STREAM (Server-Sent Events)
// ----------------------------------------------------
let eventSource: EventSource | null = null;
let sseInitialized = false;

function initEventSource() {
  if (typeof window === 'undefined' || sseInitialized) return;
  sseInitialized = true;

  try {
    eventSource = new EventSource('/api/events');

    eventSource.addEventListener('employees', (e) => {
      try {
        const list = JSON.parse(e.data);
        if (Array.isArray(list)) {
          saveLocalEmployees(list);
          notifyEmployeeListeners(list);
        }
      } catch (err) {
        console.error('SSE employees parse error:', err);
      }
    });

    eventSource.addEventListener('templates', (e) => {
      try {
        const list = JSON.parse(e.data);
        if (Array.isArray(list)) {
          saveLocalGlobalTemplates(list);
          notifyGlobalTemplateListeners(list);
        }
      } catch (err) {
        console.error('SSE templates parse error:', err);
      }
    });

    eventSource.addEventListener('personalTemplates', (e) => {
      try {
        const list = JSON.parse(e.data);
        if (Array.isArray(list)) {
          saveLocalPersonalTemplates(list);
          notifyPersonalTemplateListeners(list);
        }
      } catch (err) {
        console.error('SSE personalTemplates parse error:', err);
      }
    });

    eventSource.onerror = () => {
      // Browser EventSource automatically attempts to reconnect on error
    };
  } catch (err) {
    console.warn('Could not initialize SSE connection:', err);
  }
}

// ----------------------------------------------------
// EMPLOYEES
// ----------------------------------------------------
const employeeListeners: Array<(list: EmployeeProfile[]) => void> = [];

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
    console.error('Failed to read local employees:', e);
  }
  return INITIAL_EMPLOYEES;
}

export function saveLocalEmployees(list: EmployeeProfile[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEYS.EMPLOYEES, JSON.stringify(list));
}

export function subscribeEmployees(callback: (list: EmployeeProfile[]) => void): () => void {
  employeeListeners.push(callback);
  // Send current cache immediately
  callback(getLocalEmployees());

  initEventSource();

  // Fetch from server DB
  fetch('/api/employees')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((serverList: EmployeeProfile[]) => {
      if (Array.isArray(serverList) && serverList.length > 0) {
        saveLocalEmployees(serverList);
        notifyEmployeeListeners(serverList);
      }
    })
    .catch((err) => {
      console.warn('Local server /api/employees unreachable, using local cache:', err.message);
    });

  return () => {
    const index = employeeListeners.indexOf(callback);
    if (index >= 0) employeeListeners.splice(index, 1);
  };
}

export async function upsertEmployee(employee: EmployeeProfile): Promise<void> {
  // 1. Instant local optimistic update
  const current = getLocalEmployees();
  const existingIdx = current.findIndex((e) => e.id === employee.id);
  let updated: EmployeeProfile[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = employee;
  } else {
    updated = [...current, employee];
  }
  saveLocalEmployees(updated);
  notifyEmployeeListeners(updated);

  // 2. Persist to server local database
  const actor = getSessionActor();
  try {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee, actorId: actor.actorId, actorPin: actor.actorPin }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Ошибка сервера: ${res.status}`);
    }
    const data = await res.json();
    if (data.employee) {
      // Sync confirmed state from server
      const confirmed = getLocalEmployees().map((e) => (e.id === data.employee.id ? data.employee : e));
      saveLocalEmployees(confirmed);
      notifyEmployeeListeners(confirmed);
    }
  } catch (err: any) {
    console.error('Server save employee error:', err.message);
    throw err;
  }
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  // 1. Instant local optimistic update
  const current = getLocalEmployees();
  const updated = current.filter((e) => e.id !== employeeId);
  saveLocalEmployees(updated);
  notifyEmployeeListeners(updated);

  // 2. Persist to server local database
  const actor = getSessionActor();
  try {
    const res = await fetch(`/api/employees/${encodeURIComponent(employeeId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: actor.actorId, actorPin: actor.actorPin }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Ошибка сервера: ${res.status}`);
    }
  } catch (err: any) {
    console.error('Server delete employee error:', err.message);
    throw err;
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
    console.error('Failed to read local global templates:', e);
  }
  return DEFAULT_TEMPLATES;
}

export function saveLocalGlobalTemplates(list: SupportTemplate[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEYS.GLOBAL_TEMPLATES, JSON.stringify(list));
}

export function subscribeGlobalTemplates(callback: (list: SupportTemplate[]) => void): () => void {
  globalTemplateListeners.push(callback);
  callback(getLocalGlobalTemplates());

  initEventSource();

  fetch('/api/templates')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((serverList: SupportTemplate[]) => {
      if (Array.isArray(serverList) && serverList.length > 0) {
        saveLocalGlobalTemplates(serverList);
        notifyGlobalTemplateListeners(serverList);
      }
    })
    .catch((err) => {
      console.warn('Local server /api/templates unreachable, using local cache:', err.message);
    });

  return () => {
    const index = globalTemplateListeners.indexOf(callback);
    if (index >= 0) globalTemplateListeners.splice(index, 1);
  };
}

export async function upsertGlobalTemplate(template: SupportTemplate): Promise<void> {
  const current = getLocalGlobalTemplates();
  const existingIdx = current.findIndex((t) => t.id === template.id);
  let updated: SupportTemplate[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = template;
  } else {
    updated = [...current, template];
  }
  saveLocalGlobalTemplates(updated);
  notifyGlobalTemplateListeners(updated);

  const actor = getSessionActor();
  try {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template, actorId: actor.actorId, actorPin: actor.actorPin }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Ошибка сервера: ${res.status}`);
    }
  } catch (err: any) {
    console.error('Server save global template error:', err.message);
    throw err;
  }
}

export async function deleteGlobalTemplate(templateId: string): Promise<void> {
  const current = getLocalGlobalTemplates();
  const updated = current.filter((t) => t.id !== templateId);
  saveLocalGlobalTemplates(updated);
  notifyGlobalTemplateListeners(updated);

  const actor = getSessionActor();
  try {
    const res = await fetch(`/api/templates/${encodeURIComponent(templateId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: actor.actorId, actorPin: actor.actorPin }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Ошибка сервера: ${res.status}`);
    }
  } catch (err: any) {
    console.error('Server delete global template error:', err.message);
    throw err;
  }
}

// ----------------------------------------------------
// PERSONAL TEMPLATES
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
    console.error('Failed to read local personal templates:', e);
  }
  return [];
}

export function saveLocalPersonalTemplates(list: SupportTemplate[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEYS.PERSONAL_TEMPLATES, JSON.stringify(list));
}

export function subscribePersonalTemplates(callback: (list: SupportTemplate[]) => void): () => void {
  personalTemplateListeners.push(callback);
  callback(getLocalPersonalTemplates());

  initEventSource();

  fetch('/api/personal-templates')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((serverList: SupportTemplate[]) => {
      if (Array.isArray(serverList)) {
        saveLocalPersonalTemplates(serverList);
        notifyPersonalTemplateListeners(serverList);
      }
    })
    .catch((err) => {
      console.warn('Local server /api/personal-templates unreachable, using local cache:', err.message);
    });

  return () => {
    const index = personalTemplateListeners.indexOf(callback);
    if (index >= 0) personalTemplateListeners.splice(index, 1);
  };
}

export async function upsertPersonalTemplate(template: SupportTemplate): Promise<void> {
  const current = getLocalPersonalTemplates();
  const existingIdx = current.findIndex((t) => t.id === template.id);
  let updated: SupportTemplate[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = template;
  } else {
    updated = [...current, template];
  }
  saveLocalPersonalTemplates(updated);
  notifyPersonalTemplateListeners(updated);

  try {
    await fetch('/api/personal-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template }),
    });
  } catch (err: any) {
    console.warn('Server save personal template fallback to local:', err.message);
  }
}

export async function deletePersonalTemplate(templateId: string): Promise<void> {
  const current = getLocalPersonalTemplates();
  const updated = current.filter((t) => t.id !== templateId);
  saveLocalPersonalTemplates(updated);
  notifyPersonalTemplateListeners(updated);

  try {
    await fetch(`/api/personal-templates/${encodeURIComponent(templateId)}`, {
      method: 'DELETE',
    });
  } catch (err: any) {
    console.warn('Server delete personal template fallback to local:', err.message);
  }
}

export async function proposePersonalTemplate(templateId: string): Promise<void> {
  const current = getLocalPersonalTemplates();
  const tpl = current.find((t) => t.id === templateId);
  if (!tpl) return;
  const updated: SupportTemplate = { ...tpl, status: 'pending_approval', updatedAt: new Date().toISOString() };
  await upsertPersonalTemplate(updated);

  try {
    await fetch(`/api/personal-templates/${encodeURIComponent(templateId)}/propose`, {
      method: 'POST',
    });
  } catch (err: any) {
    console.warn('Server propose personal template fallback to local:', err.message);
  }
}

export async function approvePersonalTemplate(template: SupportTemplate): Promise<void> {
  const actor = getSessionActor();

  // Optimistic updates
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
    updatedAt: new Date().toISOString(),
  };
  await upsertPersonalTemplate(updatedPersonal);

  try {
    await fetch(`/api/personal-templates/${encodeURIComponent(template.id)}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approve',
        modifiedTemplate: template,
        actorId: actor.actorId,
        actorPin: actor.actorPin,
      }),
    });
  } catch (err: any) {
    console.warn('Server moderate personal template fallback:', err.message);
  }
}

export async function rejectPersonalTemplate(templateId: string): Promise<void> {
  const actor = getSessionActor();
  const current = getLocalPersonalTemplates();
  const tpl = current.find((t) => t.id === templateId);
  if (!tpl) return;
  const updated: SupportTemplate = { ...tpl, status: 'rejected', updatedAt: new Date().toISOString() };
  await upsertPersonalTemplate(updated);

  try {
    await fetch(`/api/personal-templates/${encodeURIComponent(templateId)}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reject',
        actorId: actor.actorId,
        actorPin: actor.actorPin,
      }),
    });
  } catch (err: any) {
    console.warn('Server reject personal template fallback:', err.message);
  }
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EmployeeProfile, UserRole } from '../types';
import {
  subscribeEmployees,
  upsertEmployee,
  deleteEmployee as dbDeleteEmployee,
} from '../services/dbService';

interface AuthContextType {
  currentEmployee: EmployeeProfile | null;
  employees: EmployeeProfile[];
  isAuthenticated: boolean;
  loginWithPin: (pin: string) => { success: boolean; error?: string };
  logout: () => void;
  addEmployee: (name: string, role: UserRole, pin: string) => Promise<void>;
  updateEmployee: (employee: EmployeeProfile) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<{ success: boolean; error?: string }>;
  canAccessAdmin: boolean;
  isDeveloper: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_EMP_STORAGE_KEY = 'suzdalaqua_current_employee_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(CURRENT_EMP_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.error('Failed reading session employee:', e);
      }
    }
    return null;
  });

  // Real-time employees subscription
  useEffect(() => {
    const unsub = subscribeEmployees((list) => {
      setEmployees(list);
      // If current employee was updated or removed, verify session authenticity against database
      setCurrentEmployee((prev) => {
        if (!prev) return null;
        const found = list.find((e) => e.id === prev.id);
        if (!found || found.pin !== prev.pin) {
          // Employee was deleted or PIN was changed - revoke session immediately
          sessionStorage.removeItem(CURRENT_EMP_STORAGE_KEY);
          return null;
        }
        // Always enforce authoritative role and data from database to prevent DevTools tampering
        sessionStorage.setItem(CURRENT_EMP_STORAGE_KEY, JSON.stringify(found));
        return found;
      });
    });
    return unsub;
  }, []);

  const loginWithPin = useCallback(
    (pin: string): { success: boolean; error?: string } => {
      const trimmed = pin.trim();
      if (!/^\d{6}$/.test(trimmed)) {
        return { success: false, error: 'PIN-код должен состоять из ровно 6 цифр' };
      }
      const matched = employees.find((e) => e.pin === trimmed);
      if (matched) {
        setCurrentEmployee(matched);
        sessionStorage.setItem(CURRENT_EMP_STORAGE_KEY, JSON.stringify(matched));
        return { success: true };
      }
      return { success: false, error: 'Неверный PIN-код сотрудника' };
    },
    [employees]
  );

  const logout = useCallback(() => {
    setCurrentEmployee(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CURRENT_EMP_STORAGE_KEY);
    }
  }, []);

  const addEmployee = async (name: string, role: UserRole, pin: string) => {
    const isDev = currentEmployee?.role === 'developer';
    const effectiveRole = role === 'developer' && !isDev ? 'employee' : role;
    const newEmp: EmployeeProfile = {
      id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      role: effectiveRole,
      pin: pin.trim(),
      createdAt: new Date().toISOString(),
    };
    // 1. Immediately update React state for instant UI rendering without page refresh
    setEmployees((prev) => {
      const exists = prev.some((e) => e.id === newEmp.id);
      if (exists) return prev;
      return [...prev, newEmp];
    });
    // 2. Persist to storage & Firestore
    await upsertEmployee(newEmp);
  };

  const updateEmployee = async (employee: EmployeeProfile) => {
    const existing = employees.find((e) => e.id === employee.id);
    const isDev = currentEmployee?.role === 'developer';
    if ((existing?.role === 'developer' || employee.role === 'developer') && !isDev) {
      throw new Error('Администратор не имеет права изменять профиль разработчика');
    }

    // 1. Immediately update React state for instant UI rendering
    setEmployees((prev) => prev.map((e) => (e.id === employee.id ? employee : e)));

    // 2. If current user updated their own profile, sync session immediately
    if (currentEmployee?.id === employee.id) {
      setCurrentEmployee(employee);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(CURRENT_EMP_STORAGE_KEY, JSON.stringify(employee));
      }
    }

    // 3. Persist to storage & Firestore
    await upsertEmployee(employee);
  };

  const deleteEmployee = async (
    employeeId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const empToDelete = employees.find((e) => e.id === employeeId);
    const isDev = currentEmployee?.role === 'developer';

    // Administrator cannot delete a developer profile
    if (empToDelete?.role === 'developer' && !isDev) {
      return {
        success: false,
        error: 'Администратор не имеет права удалять профиль разработчика',
      };
    }

    // Prevent deleting the last developer
    if (empToDelete?.role === 'developer') {
      const developersCount = employees.filter((e) => e.role === 'developer').length;
      if (developersCount <= 1) {
        return { success: false, error: 'Нельзя удалить единственного разработчика в системе' };
      }
    }

    // 1. Immediately update React state
    setEmployees((prev) => prev.filter((e) => e.id !== employeeId));

    // 2. If current logged-in employee was deleted, logout
    if (currentEmployee?.id === employeeId) {
      setCurrentEmployee(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(CURRENT_EMP_STORAGE_KEY);
      }
    }

    // 3. Persist deletion
    await dbDeleteEmployee(employeeId);
    return { success: true };
  };

  const isDeveloper = currentEmployee?.role === 'developer';
  const isAdmin = currentEmployee?.role === 'admin' || isDeveloper;
  const canAccessAdmin = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentEmployee,
        employees,
        isAuthenticated: !!currentEmployee,
        loginWithPin,
        logout,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        canAccessAdmin,
        isDeveloper,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

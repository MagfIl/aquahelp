import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Check,
  AlertCircle,
  Table2,
  MessageSquareText,
  Clock,
  X,
  FileJson,
  Search,
  KeyRound,
  Users,
  CheckCircle2,
  Flame,
  Crown,
  Inbox,
  UserPlus,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PricingMatrixType,
  SupportTemplate,
  DayType,
  ZoneType,
  DurationType,
  PremiumPricesType,
  EmployeeProfile,
  UserRole,
} from '../types';
import { useAuth } from '../context/AuthContext';
import {
  saveStoredPricingMatrix,
  resetStoredPricingMatrix,
  saveStoredOvertimeRate,
  getStoredPremiumPrices,
  saveStoredPremiumPrices,
  getStoredFireplaceRate,
  saveStoredFireplaceRate,
  createBackupJson,
  restoreBackupJson,
  DEFAULT_PREMIUM_PRICES,
  DEFAULT_OVERTIME_RATE,
} from '../data/portalStore';
import {
  subscribePersonalTemplates,
  approvePersonalTemplate,
  rejectPersonalTemplate,
  upsertPersonalTemplate,
  upsertGlobalTemplate,
  deleteGlobalTemplate,
  subscribeGlobalTemplates,
} from '../services/dbService';

interface AdminPageProps {
  isAdminAuth: boolean;
  onSetAdminAuth: (isAuth: boolean) => void;
  pricingMatrix: PricingMatrixType;
  onUpdatePricingMatrix: (matrix: PricingMatrixType) => void;
  overtimeRate: number;
  onUpdateOvertimeRate: (rate: number) => void;
  templates: SupportTemplate[];
  onUpdateTemplates: (templates: SupportTemplate[]) => void;
}

const CATEGORY_DEFINITIONS: {
  key: 'adult' | 'teen' | 'child' | 'privilege';
  label: string;
}[] = [
  { key: 'adult', label: 'Взрослый (18+)' },
  { key: 'teen', label: 'Тинейджер (14-17)' },
  { key: 'child', label: 'Детский (4-13)' },
  { key: 'privilege', label: 'Льготный' },
];

export const AdminPage: React.FC<AdminPageProps> = ({
  pricingMatrix,
  onUpdatePricingMatrix,
  overtimeRate,
  onUpdateOvertimeRate,
  templates: initialTemplates,
  onUpdateTemplates,
}) => {
  const {
    currentEmployee,
    canAccessAdmin,
    isDeveloper,
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  } = useAuth();

  // Tabs: 'tariffs' | 'templates' | 'moderation' | 'security' | 'backup'
  const [activeTab, setActiveTab] = useState<
    'tariffs' | 'templates' | 'moderation' | 'security' | 'backup'
  >('tariffs');

  // Tariffs state
  const [localMatrix, setLocalMatrix] = useState<PricingMatrixType>(() =>
    JSON.parse(JSON.stringify(pricingMatrix))
  );
  const [localPremium, setLocalPremium] = useState<PremiumPricesType>(getStoredPremiumPrices);
  const [localOvertimeRate, setLocalOvertimeRate] = useState<number>(overtimeRate);
  const [localFireplaceRate, setLocalFireplaceRate] = useState<number>(getStoredFireplaceRate);
  const [selectedDay, setSelectedDay] = useState<DayType>('weekday');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Global Templates State
  const [globalTemplatesList, setGlobalTemplatesList] = useState<SupportTemplate[]>(initialTemplates);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<SupportTemplate | null>(null);
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState(false);
  const [tplFormTitle, setTplFormTitle] = useState('');
  const [tplFormContent, setTplFormContent] = useState('');
  const [tplFormCategories, setTplFormCategories] = useState('');

  // Proposals for moderation & editing before approval
  const [proposals, setProposals] = useState<SupportTemplate[]>([]);
  const [editingProposal, setEditingProposal] = useState<SupportTemplate | null>(null);
  const [propFormTitle, setPropFormTitle] = useState('');
  const [propFormContent, setPropFormContent] = useState('');
  const [propFormCategories, setPropFormCategories] = useState('');

  // Employee Management State
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState<UserRole>('employee');
  const [empPin, setEmpPin] = useState('');
  const [empError, setEmpError] = useState<string | null>(null);

  // File Upload Reference for Backup
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupMsg, setBackupMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Real-time subscriptions
  useEffect(() => {
    const unsubGlobal = subscribeGlobalTemplates((list) => {
      setGlobalTemplatesList(list);
      onUpdateTemplates(list);
    });
    const unsubPersonal = subscribePersonalTemplates((list) => {
      setProposals(list.filter((t) => t.status === 'pending_approval'));
    });

    return () => {
      unsubGlobal();
      unsubPersonal();
    };
  }, [onUpdateTemplates]);

  const triggerSuccess = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => {
      setSaveSuccessMessage((curr) => (curr === msg ? null : curr));
    }, 2500);
  };

  // Tariff saving
  const handleSaveTariffs = () => {
    saveStoredPricingMatrix(localMatrix);
    onUpdatePricingMatrix(localMatrix);

    saveStoredPremiumPrices(localPremium);

    saveStoredOvertimeRate(localOvertimeRate);
    onUpdateOvertimeRate(localOvertimeRate);

    saveStoredFireplaceRate(localFireplaceRate);

    triggerSuccess('Все тарифы и цены успешно сохранены!');
  };

  const handleResetTariffsToDefault = () => {
    setConfirmModal({
      title: 'Сбросить тарифы?',
      message: 'Все пользовательские изменения цен будут сброшены к базовым фабричным значениям.',
      confirmLabel: 'Сбросить к базовым',
      isDestructive: true,
      onConfirm: () => {
        const resetMatrix = resetStoredPricingMatrix();
        setLocalMatrix(JSON.parse(JSON.stringify(resetMatrix)));
        onUpdatePricingMatrix(resetMatrix);

        setLocalPremium(DEFAULT_PREMIUM_PRICES);
        saveStoredPremiumPrices(DEFAULT_PREMIUM_PRICES);

        setLocalOvertimeRate(DEFAULT_OVERTIME_RATE);
        saveStoredOvertimeRate(DEFAULT_OVERTIME_RATE);
        onUpdateOvertimeRate(DEFAULT_OVERTIME_RATE);

        setLocalFireplaceRate(8000);
        saveStoredFireplaceRate(8000);

        setConfirmModal(null);
        triggerSuccess('Тарифы сброшены к значениям по умолчанию');
      },
    });
  };

  // Global Template CRUD
  const handleSaveGlobalTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplFormTitle.trim() || !tplFormContent.trim()) return;

    const cats = tplFormCategories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const templateToSave: SupportTemplate = {
      id: editingTemplate ? editingTemplate.id : `tpl-global-${Date.now()}`,
      title: tplFormTitle.trim(),
      content: tplFormContent.trim(),
      categories: cats.length > 0 ? cats : ['Общие вопросы'],
      updatedAt: new Date().toISOString(),
      isPersonal: false,
      status: 'approved',
    };

    await upsertGlobalTemplate(templateToSave);
    setIsCreatingNewTemplate(false);
    setEditingTemplate(null);
    setTplFormTitle('');
    setTplFormContent('');
    setTplFormCategories('');
    triggerSuccess('Шаблон успешно сохранен в базе данных');
  };

  const handleDeleteGlobalTemplate = (tpl: SupportTemplate) => {
    setConfirmModal({
      title: 'Удалить шаблон?',
      message: `Вы действительно хотите удалить шаблон «${tpl.title}» из общей базы? Это действие необратимо.`,
      confirmLabel: 'Удалить шаблон',
      isDestructive: true,
      onConfirm: async () => {
        await deleteGlobalTemplate(tpl.id);
        setConfirmModal(null);
        triggerSuccess('Шаблон удален из базы');
      },
    });
  };

  // Moderation
  const handleApproveProposal = async (tpl: SupportTemplate) => {
    await approvePersonalTemplate(tpl);
    triggerSuccess(`Шаблон «${tpl.title}» опубликован в общие!`);
  };

  const handleRejectProposal = async (templateId: string) => {
    await rejectPersonalTemplate(templateId);
    triggerSuccess('Предложение отклонено');
  };

  const handleOpenEditProposal = (prop: SupportTemplate) => {
    setEditingProposal(prop);
    setPropFormTitle(prop.title);
    setPropFormContent(prop.content);
    setPropFormCategories(prop.categories?.join(', ') || 'Общие вопросы');
  };

  const handleSaveAndApproveProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProposal) return;
    const cats = propFormCategories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const updatedProposal: SupportTemplate = {
      ...editingProposal,
      title: propFormTitle.trim(),
      content: propFormContent.trim(),
      categories: cats.length > 0 ? cats : ['Общие вопросы'],
      updatedAt: new Date().toISOString(),
    };

    await approvePersonalTemplate(updatedProposal);
    setEditingProposal(null);
    triggerSuccess(`Шаблон «${updatedProposal.title}» отредактирован и опубликован в общие!`);
  };

  const handleSaveProposalOnly = async () => {
    if (!editingProposal) return;
    const cats = propFormCategories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const updatedProposal: SupportTemplate = {
      ...editingProposal,
      title: propFormTitle.trim(),
      content: propFormContent.trim(),
      categories: cats.length > 0 ? cats : ['Общие вопросы'],
      updatedAt: new Date().toISOString(),
    };

    await upsertPersonalTemplate(updatedProposal);
    setEditingProposal(null);
    triggerSuccess(`Изменения в предложении «${updatedProposal.title}» сохранены`);
  };

  // Employee CRUD
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError(null);

    const pinClean = empPin.trim();
    if (!/^\d{6}$/.test(pinClean)) {
      setEmpError('PIN-код должен содержать ровно 6 цифр');
      return;
    }

    if (editingEmployee) {
      if (editingEmployee.role === 'developer' && !isDeveloper) {
        setEmpError('Администратор не имеет права изменять профиль разработчика');
        return;
      }
      if (empRole === 'developer' && !isDeveloper) {
        setEmpError('Только разработчик может назначать роль Разработчик');
        return;
      }
      try {
        await updateEmployee({
          ...editingEmployee,
          name: empName.trim(),
          role: empRole,
          pin: pinClean,
        });
        triggerSuccess('Данные сотрудника обновлены');
      } catch (err: any) {
        setEmpError(err?.message || 'Ошибка обновления сотрудника');
        return;
      }
    } else {
      if (empRole === 'developer' && !isDeveloper) {
        setEmpError('Только разработчик может создавать профиль Разработчика');
        return;
      }
      await addEmployee(empName.trim(), empRole, pinClean);
      triggerSuccess('Сотрудник добавлен');
    }

    setIsAddEmployeeModalOpen(false);
    setEditingEmployee(null);
    setEmpName('');
    setEmpPin('');
    setEmpRole('employee');
  };

  const handleDeleteEmployee = (emp: EmployeeProfile) => {
    if (emp.role === 'developer' && !isDeveloper) {
      setBackupMsg({
        text: 'Недостаточно прав: администратор не может удалять профиль разработчика',
        error: true,
      });
      return;
    }

    setConfirmModal({
      title: 'Удалить сотрудника?',
      message: `Удалить профиль «${emp.name}» (роль: ${emp.role})?`,
      confirmLabel: 'Удалить',
      isDestructive: true,
      onConfirm: async () => {
        const res = await deleteEmployee(emp.id);
        setConfirmModal(null);
        if (res.success) {
          triggerSuccess('Сотрудник удален');
        } else {
          setBackupMsg({ text: res.error || 'Ошибка удаления', error: true });
        }
      },
    });
  };

  // Backup file export & import
  const handleExportBackupFile = () => {
    const jsonStr = createBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `suzdalaqua_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerSuccess('Резервная копия сохранена в файл!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = restoreBackupJson(content);
      if (res.success) {
        setBackupMsg({ text: 'База данных успешно восстановлена из файла!', error: false });
        setTimeout(() => setBackupMsg(null), 3000);
      } else {
        setBackupMsg({ text: res.error || 'Ошибка формата файла JSON', error: true });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!canAccessAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Доступ ограничен</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Данный раздел доступен только Администраторам и Разработчикам портала.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-3.5 sm:space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h1 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Панель администратора
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
              {currentEmployee?.role}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Управление тарифами, премиум пакетами, сотрудниками и общей базой шаблонов
          </p>
        </div>

        {saveSuccessMessage && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('tariffs')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition ${
            activeTab === 'tariffs'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Table2 className="w-3.5 h-3.5 text-sky-500" />
          <span>Тарифы и цены</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition ${
            activeTab === 'templates'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquareText className="w-3.5 h-3.5 text-cyan-500" />
          <span>Глобальные шаблоны ({globalTemplatesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('moderation')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition ${
            activeTab === 'moderation'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Inbox className="w-3.5 h-3.5 text-amber-500" />
          <span>Модерация предложений ({proposals.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition ${
            activeTab === 'security'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-500" />
          <span>Сотрудники ({employees.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition ${
            activeTab === 'backup'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileJson className="w-3.5 h-3.5 text-purple-500" />
          <span>Резервная копия</span>
        </button>
      </div>

      {/* TAB 1: TARIFFS & PRICES */}
      {activeTab === 'tariffs' && (
        <div className="space-y-4">
          {/* Day selection */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDay('weekday')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  selectedDay === 'weekday'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Будние дни
              </button>
              <button
                type="button"
                onClick={() => setSelectedDay('weekend')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  selectedDay === 'weekend'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Выходные / Праздники
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetTariffsToDefault}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 cursor-pointer"
              >
                Сброс к фабричным
              </button>
              <button
                type="button"
                onClick={handleSaveTariffs}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Сохранить изменения</span>
              </button>
            </div>
          </div>

          {/* Standard Pricing Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Zone 1: Aquatory */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2.5">
                Зона «Акватория» ({selectedDay === 'weekday' ? 'Будни' : 'Выходные'})
              </h3>
              <div className="space-y-2 text-xs">
                {(['2h', '4h', 'all_day'] as DurationType[]).map((dur) => (
                  <div key={dur} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {dur === '2h' ? '2 часа' : dur === '4h' ? '4 часа' : 'Весь день (12ч)'}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {CATEGORY_DEFINITIONS.map((cat) => (
                        <div key={cat.key}>
                          <span className="text-[10px] text-slate-400 block">{cat.label}</span>
                          <input
                            type="number"
                            value={localMatrix[selectedDay].aquatory[dur][cat.key]}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setLocalMatrix((prev) => ({
                                ...prev,
                                [selectedDay]: {
                                  ...prev[selectedDay],
                                  aquatory: {
                                    ...prev[selectedDay].aquatory,
                                    [dur]: {
                                      ...prev[selectedDay].aquatory[dur],
                                      [cat.key]: val,
                                    },
                                  },
                                },
                              }));
                            }}
                            className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone 2: Aquaterra */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2.5">
                Зона «Акватория + АкваТерра» ({selectedDay === 'weekday' ? 'Будни' : 'Выходные'})
              </h3>
              <div className="space-y-2 text-xs">
                {(['2h', '4h', 'all_day'] as DurationType[]).map((dur) => (
                  <div key={dur} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {dur === '2h' ? '2 часа' : dur === '4h' ? '4 часа' : 'Весь день (12ч)'}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {CATEGORY_DEFINITIONS.map((cat) => (
                        <div key={cat.key}>
                          <span className="text-[10px] text-slate-400 block">{cat.label}</span>
                          <input
                            type="number"
                            value={localMatrix[selectedDay].aquaterra[dur][cat.key]}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setLocalMatrix((prev) => ({
                                ...prev,
                                [selectedDay]: {
                                  ...prev[selectedDay],
                                  aquaterra: {
                                    ...prev[selectedDay].aquaterra,
                                    [dur]: {
                                      ...prev[selectedDay].aquaterra[dur],
                                      [cat.key]: val,
                                    },
                                  },
                                },
                              }));
                            }}
                            className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Premium Tariff & Extras */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Premium Tariff Prices */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Crown className="w-4 h-4" />
                <span>Премиум тариф (12 часов)</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Взрослый (18+)</span>
                  <input
                    type="number"
                    value={localPremium[selectedDay].adult}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setLocalPremium((prev) => ({
                        ...prev,
                        [selectedDay]: { ...prev[selectedDay], adult: val },
                      }));
                    }}
                    className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Тинейджер (14-17)</span>
                  <input
                    type="number"
                    value={localPremium[selectedDay].teen}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setLocalPremium((prev) => ({
                        ...prev,
                        [selectedDay]: { ...prev[selectedDay], teen: val },
                      }));
                    }}
                    className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Детский (4-13)</span>
                  <input
                    type="number"
                    value={localPremium[selectedDay].child}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setLocalPremium((prev) => ({
                        ...prev,
                        [selectedDay]: { ...prev[selectedDay], child: val },
                      }));
                    }}
                    className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Fireplace Room */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                <Flame className="w-4 h-4" />
                <span>Каминная комната</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Стоимость почасовой аренды (минимальное время аренды — 3 часа).
              </p>
              <div>
                <span className="text-[10px] text-slate-400 block">Ставка (₽ в час)</span>
                <input
                  type="number"
                  value={localFireplaceRate}
                  onChange={(e) => setLocalFireplaceRate(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>
            </div>

            {/* Overtime Rate */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                <Clock className="w-4 h-4" />
                <span>Ставка перелимита</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Тариф за превышение лимита времени (в рублях за 1 минуту с 1 гостя).
              </p>
              <div>
                <span className="text-[10px] text-slate-400 block">Ставка (₽ в минуту)</span>
                <input
                  type="number"
                  value={localOvertimeRate}
                  onChange={(e) => setLocalOvertimeRate(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL TEMPLATES CRUD */}
      {activeTab === 'templates' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={templateSearchQuery}
                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                placeholder="Поиск по шаблонам..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingTemplate(null);
                setTplFormTitle('');
                setTplFormContent('');
                setTplFormCategories('Общие вопросы');
                setIsCreatingNewTemplate(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Создать глобальный шаблон</span>
            </button>
          </div>

          {/* Global Templates: Desktop Table (md+) and Mobile Cards (<md) */}
          {/* Desktop View */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3">Заголовок / Тема</th>
                    <th className="py-2.5 px-3">Категории</th>
                    <th className="py-2.5 px-3">Текст ответа</th>
                    <th className="py-2.5 px-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {globalTemplatesList
                    .filter(
                      (t) =>
                        !templateSearchQuery ||
                        t.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                        t.content.toLowerCase().includes(templateSearchQuery.toLowerCase())
                    )
                    .map((tpl) => (
                      <tr key={tpl.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">
                          {tpl.title}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[150px] truncate">
                          {tpl.categories?.join(', ')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[320px] truncate">
                          {tpl.content}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTemplate(tpl);
                              setTplFormTitle(tpl.title);
                              setTplFormContent(tpl.content);
                              setTplFormCategories(tpl.categories?.join(', ') || '');
                              setIsCreatingNewTemplate(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-sky-600 rounded transition cursor-pointer"
                            title="Редактировать"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGlobalTemplate(tpl)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View (<md) */}
          <div className="md:hidden space-y-2.5">
            {globalTemplatesList
              .filter(
                (t) =>
                  !templateSearchQuery ||
                  t.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                  t.content.toLowerCase().includes(templateSearchQuery.toLowerCase())
              )
              .map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {tpl.title}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplate(tpl);
                          setTplFormTitle(tpl.title);
                          setTplFormContent(tpl.content);
                          setTplFormCategories(tpl.categories?.join(', ') || '');
                          setIsCreatingNewTemplate(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-sky-600 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGlobalTemplate(tpl)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {tpl.categories && tpl.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tpl.categories.map((c, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-3 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                    {tpl.content}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: PROPOSALS MODERATION */}
      {activeTab === 'moderation' && (
        <div className="space-y-3.5">
          <div className="text-xs text-slate-500">
            Шаблоны, предложенные операторами чата для публикации в общую базу.
          </div>

          {proposals.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Нет шаблонов на модерации
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Все предложенные шаблоны проверены и опубликованы.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {proposals.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {prop.title}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Автор: {prop.authorName || 'Оператор'}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                      Предложение
                    </span>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    {prop.categories?.map((c, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap">
                    {prop.content}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleRejectProposal(prop.id)}
                      className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                    >
                      Отклонить
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditProposal(prop)}
                      className="px-2.5 py-1 text-xs rounded border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Редактировать</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveProposal(prop)}
                      className="px-3 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer shadow-xs flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Одобрить в общие</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EMPLOYEES & SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs text-slate-500">
              Список сотрудников, их уровни доступа и персональные PIN-коды.
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingEmployee(null);
                setEmpName('');
                setEmpRole('employee');
                setEmpPin('');
                setEmpError(null);
                setIsAddEmployeeModalOpen(true);
              }}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Добавить сотрудника</span>
            </button>
          </div>

          {/* Desktop Table (md+) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3">Имя сотрудника</th>
                    <th className="py-2.5 px-3">Уровень доступа</th>
                    <th className="py-2.5 px-3">PIN-код</th>
                    <th className="py-2.5 px-3">Дата регистрации</th>
                    <th className="py-2.5 px-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">
                        {emp.name}
                        {emp.id === currentEmployee?.id && (
                          <span className="ml-1.5 font-normal text-[10px] text-sky-600 font-sans">
                            (Вы)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            emp.role === 'developer'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : emp.role === 'admin'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {emp.role === 'developer'
                            ? 'Разработчик'
                            : emp.role === 'admin'
                            ? 'Администратор'
                            : 'Сотрудник'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 tracking-widest">
                        ••••••
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px]">
                        {new Date(emp.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1 font-sans">
                        {emp.role === 'developer' && !isDeveloper ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 py-1 px-2 rounded bg-slate-100 dark:bg-slate-800">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Защищен</span>
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEmployee(emp);
                                setEmpName(emp.name);
                                setEmpRole(emp.role);
                                setEmpPin(emp.pin);
                                setEmpError(null);
                                setIsAddEmployeeModalOpen(true);
                              }}
                              className="p-1 text-slate-500 hover:text-sky-600 rounded cursor-pointer"
                              title="Редактировать"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEmployee(emp)}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded cursor-pointer"
                              title="Удалить"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View (<md) */}
          <div className="md:hidden space-y-2.5">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{emp.name}</span>
                      {emp.id === currentEmployee?.id && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
                          Вы
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Зарегистрирован: {new Date(emp.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      emp.role === 'developer'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : emp.role === 'admin'
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {emp.role === 'developer'
                      ? 'Разработчик'
                      : emp.role === 'admin'
                      ? 'Администратор'
                      : 'Сотрудник'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="text-[11px] text-slate-500 font-mono">
                    PIN: <span className="tracking-widest">••••••</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {emp.role === 'developer' && !isDeveloper ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Только Разработчику</span>
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEmployee(emp);
                            setEmpName(emp.name);
                            setEmpRole(emp.role);
                            setEmpPin(emp.pin);
                            setEmpError(null);
                            setIsAddEmployeeModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Изменить</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteEmployee(emp)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Удалить</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-sky-500" />
              <span>Экспорт базы данных</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Сохраните полный снимок всех тарифов, цен премиума, каминной комнаты и базы шаблонов в файл <code>.json</code>.
            </p>
            <button
              type="button"
              onClick={handleExportBackupFile}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Скачать файл бекапа (.json)</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-purple-500" />
              <span>Восстановление из файла JSON</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Выберите сохраненный файл <code>.json</code> на компьютере или телефоне для восстановления базы данных.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Выбрать файл .json для загрузки</span>
            </button>

            {backupMsg && (
              <div
                className={`p-2.5 rounded text-xs font-medium ${
                  backupMsg.error
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {backupMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Global Template Create/Edit */}
      <AnimatePresence>
        {isCreatingNewTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden"
            >
              <form onSubmit={handleSaveGlobalTemplate}>
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingTemplate ? 'Редактировать шаблон' : 'Новый глобальный шаблон'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewTemplate(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Название / тема
                    </label>
                    <input
                      type="text"
                      required
                      value={tplFormTitle}
                      onChange={(e) => setTplFormTitle(e.target.value)}
                      placeholder="Например: Правила посещения с детьми"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Категории (через запятую)
                    </label>
                    <input
                      type="text"
                      value={tplFormCategories}
                      onChange={(e) => setTplFormCategories(e.target.value)}
                      placeholder="Дети, Безопасность, Правила"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Текст готового ответа
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={tplFormContent}
                      onChange={(e) => setTplFormContent(e.target.value)}
                      placeholder="Текст ответа оператора..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                    />
                  </div>
                </div>

                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewTemplate(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 text-white shadow-xs"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Edit Proposal Before Approval */}
      <AnimatePresence>
        {editingProposal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden"
            >
              <form onSubmit={handleSaveAndApproveProposal}>
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Редактирование перед публикацией
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Автор предложения: {editingProposal.authorName || 'Оператор'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingProposal(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Название / тема
                    </label>
                    <input
                      type="text"
                      required
                      value={propFormTitle}
                      onChange={(e) => setPropFormTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Категории (через запятую)
                    </label>
                    <input
                      type="text"
                      value={propFormCategories}
                      onChange={(e) => setPropFormCategories(e.target.value)}
                      placeholder="Дети, Безопасность, Правила"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Текст ответа оператора
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={propFormContent}
                      onChange={(e) => setPropFormContent(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                    />
                  </div>
                </div>

                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleSaveProposalOnly}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border border-slate-200 dark:border-slate-700 text-center"
                  >
                    Только сохранить правки
                  </button>

                  <div className="w-full sm:w-auto flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingProposal(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Сохранить и опубликовать</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Employee Create/Edit */}
      <AnimatePresence>
        {isAddEmployeeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden"
            >
              <form onSubmit={handleSaveEmployee}>
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingEmployee ? 'Редактировать сотрудника' : 'Новый сотрудник'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddEmployeeModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Имя / Должность сотрудника
                    </label>
                    <input
                      type="text"
                      required
                      value={empName}
                      onChange={(e) => setEmpName(e.target.value)}
                      placeholder="Иван Петров"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Уровень доступа
                    </label>
                    <select
                      value={empRole}
                      onChange={(e) => setEmpRole(e.target.value as UserRole)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="employee">Сотрудник (Калькулятор + Шаблоны)</option>
                      <option value="admin">Администратор (Полная панель управления)</option>
                      {isDeveloper && (
                        <option value="developer">Разработчик (Максимальные права)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Персональный PIN-код (ровно 6 цифр)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={empPin}
                      onChange={(e) => setEmpPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Например: 123456"
                      maxLength={6}
                      className="w-full px-3 py-2 font-mono tracking-widest text-center text-base font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  {empError && (
                    <div className="p-2 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[11px]">
                      {empError}
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEmployeeModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
                  >
                    Сохранить сотрудника
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-4 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {confirmModal.message}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs cursor-pointer ${
                    confirmModal.isDestructive
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-sky-600 hover:bg-sky-500'
                  }`}
                >
                  {confirmModal.confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

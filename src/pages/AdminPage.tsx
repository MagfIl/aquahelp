import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
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
  Minus,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PricingMatrixType, SupportTemplate, DayType, ZoneType, DurationType } from '../types';
import {
  getStoredAdminPin,
  saveStoredAdminPin,
  saveStoredPricingMatrix,
  resetStoredPricingMatrix,
  saveStoredOvertimeRate,
  saveStoredTemplates,
  resetStoredTemplates,
  createBackupJson,
  restoreBackupJson,
} from '../data/portalStore';
import { TEMPLATE_CATEGORIES } from '../data/defaultTemplates';

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
  badge: string;
}[] = [
  { key: 'adult', label: 'Взрослый', badge: 'от 18 лет' },
  { key: 'teen', label: 'Тинейджер', badge: '14–17 лет' },
  { key: 'child', label: 'Детский', badge: '4–13 лет' },
  { key: 'privilege', label: 'Льготный', badge: 'по документу' },
];

const DURATION_DEFINITIONS: { key: DurationType; label: string; shortLabel: string }[] = [
  { key: '2h', label: '2 часа', shortLabel: '2 ч' },
  { key: '4h', label: '4 часа', shortLabel: '4 ч' },
  { key: 'all_day', label: 'Весь день', shortLabel: 'День' },
];

export const AdminPage: React.FC<AdminPageProps> = ({
  isAdminAuth,
  onSetAdminAuth,
  pricingMatrix,
  onUpdatePricingMatrix,
  overtimeRate,
  onUpdateOvertimeRate,
  templates,
  onUpdateTemplates,
}) => {
  // Login State
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Tabs: 'tariffs' | 'templates' | 'backup' | 'settings'
  const [activeTab, setActiveTab] = useState<'tariffs' | 'templates' | 'backup' | 'settings'>('tariffs');

  // Edit Tariff Local State
  const [localMatrix, setLocalMatrix] = useState<PricingMatrixType>(() => JSON.parse(JSON.stringify(pricingMatrix)));
  const [localOvertimeRate, setLocalOvertimeRate] = useState<number>(overtimeRate);
  const [selectedDay, setSelectedDay] = useState<DayType>('weekday');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Templates Management State
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Все');
  const [editingTemplate, setEditingTemplate] = useState<SupportTemplate | null>(null);
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState(false);
  const [tplFormTitle, setTplFormTitle] = useState('');
  const [tplFormContent, setTplFormContent] = useState('');
  const [tplFormCategories, setTplFormCategories] = useState<string[]>([]);
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [tplFormError, setTplFormError] = useState<string | null>(null);

  // Confirmation Modal State (in-app dialog)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Access Code Change State
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Backup Import State
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Sync props to local when pricingMatrix/overtime changes
  React.useEffect(() => {
    setLocalMatrix(JSON.parse(JSON.stringify(pricingMatrix)));
  }, [pricingMatrix]);

  React.useEffect(() => {
    setLocalOvertimeRate(overtimeRate);
  }, [overtimeRate]);

  // Flash save notification
  const triggerSuccess = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => {
      setSaveSuccessMessage((curr) => (curr === msg ? null : curr));
    }, 2500);
  };

  // Access Code Verification
  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const correctPin = getStoredAdminPin();
    if (pinInput === correctPin) {
      onSetAdminAuth(true);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setPinInput('');
      setPinError(false);
    } else if (val === 'backspace') {
      setPinInput((prev) => prev.slice(0, -1));
      setPinError(false);
    } else if (pinInput.length < 6) {
      const next = pinInput + val;
      setPinInput(next);
      setPinError(false);
      const correctPin = getStoredAdminPin();
      if (next === correctPin) {
        onSetAdminAuth(true);
        setPinInput('');
      }
    }
  };

  // Save Pricing Changes
  const handleSavePrices = () => {
    saveStoredPricingMatrix(localMatrix);
    saveStoredOvertimeRate(localOvertimeRate);
    onUpdatePricingMatrix(localMatrix);
    onUpdateOvertimeRate(localOvertimeRate);
    triggerSuccess('Тарифы и ставка перелимита сохранены!');
  };

  // Reset to Default Factory Prices
  const handleResetPrices = () => {
    setConfirmModal({
      title: 'Сброс цен к заводским',
      message: 'Сбросить все тарифы и стоимость перелимита к официальным базовым настройкам «Суздаль АКВА»?',
      confirmLabel: 'Сбросить цены',
      isDestructive: true,
      onConfirm: () => {
        const def = resetStoredPricingMatrix();
        saveStoredOvertimeRate(10);
        setLocalMatrix(JSON.parse(JSON.stringify(def)));
        setLocalOvertimeRate(10);
        onUpdatePricingMatrix(def);
        onUpdateOvertimeRate(10);
        triggerSuccess('Тарифы сброшены к заводскому прайсу!');
        setConfirmModal(null);
      },
    });
  };

  // Template Form Open
  const handleStartCreateTemplate = () => {
    setEditingTemplate(null);
    setTplFormTitle('');
    setTplFormContent('');
    setTplFormCategories(['Общие вопросы']);
    setTplFormError(null);
    setIsCreatingNewTemplate(true);
  };

  const handleStartEditTemplate = (tpl: SupportTemplate) => {
    setEditingTemplate(tpl);
    setTplFormTitle(tpl.title);
    setTplFormContent(tpl.content);
    setTplFormCategories([...tpl.categories]);
    setTplFormError(null);
    setIsCreatingNewTemplate(false);
  };

  const handleSaveTemplateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplFormTitle.trim() || !tplFormContent.trim()) {
      setTplFormError('Пожалуйста, заполните заголовок и текст ответа');
      return;
    }
    setTplFormError(null);

    const categoriesToSave = tplFormCategories.length > 0 ? tplFormCategories : ['Общие вопросы'];

    if (editingTemplate) {
      // Update
      const updated = templates.map((t) =>
        t.id === editingTemplate.id
          ? {
              ...t,
              title: tplFormTitle.trim(),
              content: tplFormContent.trim(),
              categories: categoriesToSave,
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : t
      );
      saveStoredTemplates(updated);
      onUpdateTemplates(updated);
      triggerSuccess('Шаблон успешно обновлен!');
    } else {
      // Create
      const newTpl: SupportTemplate = {
        id: `tpl-${Date.now()}`,
        title: tplFormTitle.trim(),
        content: tplFormContent.trim(),
        categories: categoriesToSave,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      const updated = [newTpl, ...templates];
      saveStoredTemplates(updated);
      onUpdateTemplates(updated);
      triggerSuccess('Новый шаблон добавлен в базу!');
    }

    setEditingTemplate(null);
    setIsCreatingNewTemplate(false);
  };

  const handleDeleteTemplate = (id: string, title: string) => {
    setConfirmModal({
      title: 'Удаление шаблона',
      message: `Вы уверены, что хотите удалить шаблон «${title}»? Он будет удален из базы быстрых ответов.`,
      confirmLabel: 'Удалить шаблон',
      isDestructive: true,
      onConfirm: () => {
        const updated = templates.filter((t) => t.id !== id);
        saveStoredTemplates(updated);
        onUpdateTemplates(updated);
        triggerSuccess(`Шаблон «${title}» удален`);
        setConfirmModal(null);
      },
    });
  };

  const handleResetTemplates = () => {
    setConfirmModal({
      title: 'Восстановление базы шаблонов',
      message: 'Восстановить базовую библиотеку из 15 официальных шаблонов ответов? Все добавленные вручную шаблоны будут заменены.',
      confirmLabel: 'Восстановить шаблоны',
      isDestructive: true,
      onConfirm: () => {
        const def = resetStoredTemplates();
        onUpdateTemplates(def);
        triggerSuccess('База шаблонов восстановлена к исходной!');
        setConfirmModal(null);
      },
    });
  };

  // Change Access Code
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.trim().length < 4) {
      setPinChangeMsg({ text: 'Код доступа должен содержать минимум 4 символа', error: true });
      return;
    }
    saveStoredAdminPin(newPinInput.trim());
    setPinChangeMsg({ text: 'Код доступа успешно обновлен!' });
    setNewPinInput('');
  };

  // Backup Export
  const handleDownloadBackup = () => {
    const json = createBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suzdalaqua_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Backup Import
  const handleApplyImport = () => {
    if (!importJsonText.trim()) return;
    const res = restoreBackupJson(importJsonText);
    if (res.success) {
      setImportStatus('Резервная копия успешно загружена!');
      triggerSuccess('Данные восстановлены из резервной копии!');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } else {
      setImportStatus(`Ошибка импорта: ${res.error}`);
    }
  };

  // Filtered Templates for Admin List
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchCat =
        selectedCategoryFilter === 'Все' || tpl.categories.includes(selectedCategoryFilter);
      const matchSearch =
        !templateSearchQuery.trim() ||
        tpl.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        tpl.content.toLowerCase().includes(templateSearchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [templates, selectedCategoryFilter, templateSearchQuery]);

  // If NOT authenticated: Compact & Mobile-Optimized Access Code Entry
  if (!isAdminAuth) {
    return (
      <div className="w-full max-w-xs sm:max-w-sm mx-auto px-3 py-6 sm:py-14">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl text-center space-y-3.5 sm:space-y-5"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl sm:rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div className="space-y-0.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Вход в панель администратора
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Введите код доступа для управления тарифами и шаблонами
            </p>
          </div>

          {/* Masked PIN Display */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2 h-8">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all ${
                      filled
                        ? 'bg-sky-600 dark:bg-sky-400 scale-110 shadow-2xs'
                        : 'border-2 border-slate-300 dark:border-slate-700 bg-transparent'
                    }`}
                  />
                );
              })}
            </div>

            {pinError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Неверный код доступа. Попробуйте еще раз</span>
              </motion.div>
            )}
          </div>

          {/* Quick Number Keypad - Compact */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-[240px] sm:max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'backspace'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypadPress(key)}
                className="h-9 sm:h-11 rounded-lg sm:rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
              >
                {key === 'backspace' ? '⌫' : key}
              </button>
            ))}
          </div>

          {/* Keyboard input option for desktop */}
          <form onSubmit={handlePinSubmit} className="pt-0.5">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="Или введите с клавиатуры..."
              className="w-full text-center py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500"
            />
          </form>
        </motion.div>
      </div>
    );
  }

  // If Authenticated: Mobile-First Admin Control Panel - Tightly Proportioned
  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-3 sm:space-y-5">
      {/* Admin Top Header with Lock Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Панель администратора</span>
            </h1>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
              Авторизован
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Управление прайс-листом тарифов, ставкой перелимита и шаблонами поддержки
          </p>
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {saveSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 font-semibold truncate max-w-[200px] sm:max-w-none"
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{saveSuccessMessage}</span>
            </motion.div>
          )}

          <button
            type="button"
            onClick={() => onSetAdminAuth(false)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Выйти</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs - Compact Mobile Touch Scroll */}
      <div className="-mx-2.5 px-2.5 sm:mx-0 sm:px-0 border-b border-slate-200 dark:border-slate-800 pb-1.5 overflow-x-auto scrollbar-none flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('tariffs')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
            activeTab === 'tariffs'
              ? 'bg-sky-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-slate-50 dark:bg-slate-900 sm:bg-transparent'
          }`}
        >
          <Table2 className="w-3.5 h-3.5 shrink-0" />
          <span>Тарифы и перелимит</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
            activeTab === 'templates'
              ? 'bg-cyan-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-slate-50 dark:bg-slate-900 sm:bg-transparent'
          }`}
        >
          <MessageSquareText className="w-3.5 h-3.5 shrink-0" />
          <span>Шаблоны ({templates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
            activeTab === 'backup'
              ? 'bg-teal-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-slate-50 dark:bg-slate-900 sm:bg-transparent'
          }`}
        >
          <FileJson className="w-3.5 h-3.5 shrink-0" />
          <span>Резервная копия</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
            activeTab === 'settings'
              ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-slate-50 dark:bg-slate-900 sm:bg-transparent'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 shrink-0" />
          <span>Безопасность</span>
        </button>
      </div>

      {/* TAB 1: TARIFFS & OVERTIME */}
      {activeTab === 'tariffs' && (
        <div className="space-y-3 sm:space-y-4">
          {/* Overtime rate setting card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>Стоимость перелимита времени</span>
              </span>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight">
                Индивидуально для гостей (малыши до 4 лет бесплатно).
              </p>
            </div>

            {/* Stepper with touch buttons */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setLocalOvertimeRate((prev) => Math.max(0, prev - 1))}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 transition-colors cursor-pointer"
                  title="Уменьшить на 1 ₽"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={localOvertimeRate}
                  onChange={(e) => setLocalOvertimeRate(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-14 h-8 text-center text-xs font-bold font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-x border-slate-200 dark:border-slate-700 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setLocalOvertimeRate((prev) => prev + 1)}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 transition-colors cursor-pointer"
                  title="Увеличить на 1 ₽"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                ₽ / мин
              </span>
            </div>
          </div>

          {/* Day Selector & Action Bar */}
          <div className="space-y-2">
            {/* Day Toggle */}
            <div className="grid grid-cols-2 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg gap-0.5">
              <button
                type="button"
                onClick={() => setSelectedDay('weekday')}
                className={`py-1.5 px-2 text-center text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  selectedDay === 'weekday'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Будни (Пн–Пт)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDay('weekend')}
                className={`py-1.5 px-2 text-center text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  selectedDay === 'weekend'
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Выходные (Сб–Вс)
              </button>
            </div>

            {/* Quick action buttons row */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetPrices}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Сбросить все цены к официальному прайсу"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Сброс цен</span>
              </button>

              <button
                type="button"
                onClick={handleSavePrices}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-2xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span>Сохранить тарифы</span>
              </button>
            </div>
          </div>

          {/* Pricing Sections for Aquatory and Aquaterra */}
          {(['aquatory', 'aquaterra'] as ZoneType[]).map((zone) => (
            <div
              key={zone}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs space-y-2.5"
            >
              {/* Zone Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      zone === 'aquatory' ? 'bg-sky-500' : 'bg-teal-500'
                    }`}
                  />
                  <span className="truncate">
                    {zone === 'aquatory' ? '«Акватория» (водные горки)' : '«Акватерра» (+ СПА и бани)'}
                  </span>
                </h3>
                <span className="text-[10px] text-slate-400 shrink-0 font-medium">в рублях</span>
              </div>

              {/* MOBILE VIEW (< sm): Clean Compact Cards */}
              <div className="space-y-2 block sm:hidden">
                {CATEGORY_DEFINITIONS.map(({ key, label, badge }) => (
                  <div
                    key={key}
                    className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {label}
                      </span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-medium">
                        {badge}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {DURATION_DEFINITIONS.map(({ key: dur, label: durLabel }) => (
                        <div key={dur} className="space-y-0.5 text-center">
                          <label className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 block">
                            {durLabel}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={localMatrix[selectedDay][zone][dur][key]}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setLocalMatrix((prev) => {
                                const next = JSON.parse(JSON.stringify(prev));
                                next[selectedDay][zone][dur][key] = val;
                                return next;
                              });
                            }}
                            className="w-full py-1.5 px-0.5 text-center text-xs font-mono font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP VIEW (sm+): Compact Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="py-2 px-2.5 font-semibold">Категория гостя</th>
                      <th className="py-2 px-2.5 font-semibold text-center">2 часа</th>
                      <th className="py-2 px-2.5 font-semibold text-center">4 часа</th>
                      <th className="py-2 px-2.5 font-semibold text-center">Весь день</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {CATEGORY_DEFINITIONS.map(({ key, label, badge }) => (
                      <tr key={key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-1.5 px-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span>{label}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({badge})</span>
                          </div>
                        </td>
                        {DURATION_DEFINITIONS.map(({ key: dur }) => (
                          <td key={dur} className="py-1.5 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={localMatrix[selectedDay][zone][dur][key]}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                setLocalMatrix((prev) => {
                                  const next = JSON.parse(JSON.stringify(prev));
                                  next[selectedDay][zone][dur][key] = val;
                                  return next;
                                });
                              }}
                              className="w-20 px-2 py-1 text-center text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-sky-500 focus:outline-hidden"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Bottom Save Bar */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSavePrices}
              className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-2xs active:scale-98 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить изменения тарифов</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATES CRUD */}
      {activeTab === 'templates' && (
        <div className="space-y-3 sm:space-y-4">
          {/* Header & Controls */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Шаблоны быстрых ответов
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Добавляйте новые шаблоны, корректируйте формулировки или удаляйте устаревшие
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 pt-0.5 sm:pt-0">
                <button
                  type="button"
                  onClick={handleResetTemplates}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Сбросить все шаблоны к исходным 15 ответам"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Сброс базы</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartCreateTemplate}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>+ Шаблон</span>
                </button>
              </div>
            </div>

            {/* Quick Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  placeholder="Поиск по заголовку или тексту..."
                  className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-cyan-500"
                />
                {templateSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTemplateSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Category selector pills */}
              <div className="-mx-2.5 px-2.5 sm:mx-0 sm:px-0 flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                      selectedCategoryFilter === cat
                        ? 'bg-cyan-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Template Edit / Create Inline Form Card */}
          <AnimatePresence>
            {(editingTemplate || isCreatingNewTemplate) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white dark:bg-slate-900 border-2 border-cyan-500/40 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>{editingTemplate ? `Редактирование: ${editingTemplate.title}` : 'Новый шаблон ответа'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setIsCreatingNewTemplate(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form onSubmit={handleSaveTemplateForm} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Заголовок шаблона
                    </label>
                    <input
                      type="text"
                      required
                      value={tplFormTitle}
                      onChange={(e) => setTplFormTitle(e.target.value)}
                      placeholder="Например: Правила посещения с детьми"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Основной текст ответа
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={tplFormContent}
                      onChange={(e) => setTplFormContent(e.target.value)}
                      placeholder="Введите готовый текст ответа клиенту..."
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500 leading-relaxed font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Категории вопроса
                    </label>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {TEMPLATE_CATEGORIES.filter((c) => c !== 'Все').map((cat) => {
                        const isSelected = tplFormCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setTplFormCategories(tplFormCategories.filter((c) => c !== cat));
                              } else {
                                setTplFormCategories([...tplFormCategories, cat]);
                              }
                            }}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-600 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Category Input */}
                    <div className="flex items-center gap-1.5 max-w-xs">
                      <input
                        type="text"
                        value={newCustomCategory}
                        onChange={(e) => setNewCustomCategory(e.target.value)}
                        placeholder="Своя категория..."
                        className="flex-1 px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trim = newCustomCategory.trim();
                          if (trim && !tplFormCategories.includes(trim)) {
                            setTplFormCategories([...tplFormCategories, trim]);
                            setNewCustomCategory('');
                          }
                        }}
                        className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 shrink-0"
                      >
                        + Добавить
                      </button>
                    </div>
                  </div>

                  {tplFormError && (
                    <div className="flex items-center gap-1.5 p-2 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{tplFormError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(null);
                        setIsCreatingNewTemplate(false);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 text-center"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-2xs text-center"
                    >
                      {editingTemplate ? 'Сохранить' : 'Создать'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Templates List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xs">
            {filteredTemplates.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Шаблонов по запросу не найдено
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-2.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {tpl.title}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">
                          {tpl.categories.join(' · ')}
                        </div>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-2">
                        {tpl.content}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 pt-1.5 sm:pt-0 border-t border-slate-100 dark:border-slate-800/60 sm:border-t-0 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditTemplate(tpl)}
                        className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-cyan-600" />
                        <span>Изменить</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id, tpl.title)}
                        className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Удалить</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP / RESTORE */}
      {activeTab === 'backup' && (
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Экспорт и импорт резервной копии
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Сохраните все цены, перелимит и шаблоны в JSON-файл или перенесите их на другое устройство.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать бэкап (.json)</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Восстановление из JSON-копии
              </label>
              <textarea
                rows={4}
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  setImportStatus(null);
                }}
                placeholder="Вставьте содержимое сохраненного JSON-файла сюда..."
                className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />

              {importStatus && (
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                  {importStatus}
                </p>
              )}

              <button
                type="button"
                onClick={handleApplyImport}
                className="w-full sm:w-auto flex items-center justify-center gap-1 px-3.5 py-2 text-xs font-bold rounded-lg bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Применить данные из JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACCESS CODE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Смена кода доступа администратора
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Установите новый код для защиты доступа к панели управления
            </p>
          </div>

          <form onSubmit={handleChangePin} className="space-y-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                Новый код доступа (от 4 знаков)
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="Например: 7788"
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
              />
            </div>

            {pinChangeMsg && (
              <p
                className={`text-xs font-semibold ${
                  pinChangeMsg.error ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {pinChangeMsg.text}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-2xs cursor-pointer"
            >
              Сохранить новый код доступа
            </button>
          </form>
        </div>
      )}

      {/* Confirmation Modal (In-App Dialog, works reliably without window.confirm) */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="relative w-full max-w-xs sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3"
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    confirmModal.isDestructive
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      : 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400'
                  }`}
                >
                  {confirmModal.isDestructive ? (
                    <Trash2 className="w-4 h-4" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {confirmModal.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {confirmModal.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="w-full py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmModal.onConfirm();
                  }}
                  className={`w-full py-1.5 text-xs font-bold rounded-lg text-white shadow-2xs transition-colors cursor-pointer text-center ${
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

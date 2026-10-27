import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Copy,
  Check,
  Plus,
  MessageSquareText,
  RotateCcw,
  Sparkles,
  Send,
  User,
  Globe,
  Trash2,
  Clock,
  CheckCircle2,
  Edit2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SupportTemplate, PageType } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  subscribeGlobalTemplates,
  subscribePersonalTemplates,
  upsertPersonalTemplate,
  deletePersonalTemplate,
  proposePersonalTemplate,
} from '../services/dbService';

interface TemplatesPageProps {
  templates: SupportTemplate[];
  onNavigate: (page: PageType) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  templates: initialTemplates,
  onNavigate,
}) => {
  const { currentEmployee, canAccessAdmin } = useAuth();

  // Tab: 'global' | 'personal'
  const [activeTab, setActiveTab] = useState<'global' | 'personal'>('global');

  // Real-time templates from Firestore
  const [globalTemplates, setGlobalTemplates] = useState<SupportTemplate[]>(initialTemplates);
  const [personalTemplates, setPersonalTemplates] = useState<SupportTemplate[]>([]);

  useEffect(() => {
    const unsubGlobal = subscribeGlobalTemplates((list) => {
      setGlobalTemplates(list);
    });
    const unsubPersonal = subscribePersonalTemplates((list) => {
      // Filter for current employee
      if (currentEmployee) {
        setPersonalTemplates(list.filter((t) => t.authorId === currentEmployee.id));
      } else {
        setPersonalTemplates(list);
      }
    });

    return () => {
      unsubGlobal();
      unsubPersonal();
    };
  }, [currentEmployee]);

  // Active list based on tab
  const currentList = activeTab === 'global' ? globalTemplates : personalTemplates;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Personal template modal state (Create & Edit)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPersonalTemplate, setEditingPersonalTemplate] = useState<SupportTemplate | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>(['Общие вопросы']);
  const [customCatInput, setCustomCatInput] = useState('');

  const POPULAR_CATEGORIES = [
    'Общие вопросы',
    'Цены и тарифы',
    'Правила посещения',
    'СПА и бани',
    'Дети и льготы',
    'Бронирование',
    'Каминная комната',
    'Парковка',
    'Акции и скидки',
  ];

  const handleOpenCreateModal = () => {
    setEditingPersonalTemplate(null);
    setNewTitle('');
    setNewContent('');
    setSelectedCats(['Общие вопросы']);
    setCustomCatInput('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditPersonal = (tpl: SupportTemplate) => {
    setEditingPersonalTemplate(tpl);
    setNewTitle(tpl.title);
    setNewContent(tpl.content);
    setSelectedCats(tpl.categories && tpl.categories.length > 0 ? tpl.categories : ['Общие вопросы']);
    setCustomCatInput('');
    setIsAddModalOpen(true);
  };

  const handleToggleCategory = (cat: string) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleAddCustomCategory = () => {
    if (!customCatInput.trim()) return;
    const parts = customCatInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    setSelectedCats((prev) => Array.from(new Set([...prev, ...parts])));
    setCustomCatInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    setSelectedCats((prev) => prev.filter((c) => c !== cat));
  };

  // Available unique categories
  const categories = useMemo(() => {
    const set = new Set<string>(['Все']);
    currentList.forEach((t) => t.categories?.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [currentList]);

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return currentList.filter((tpl) => {
      // Category match
      if (selectedCategory !== 'Все' && !tpl.categories?.includes(selectedCategory)) {
        return false;
      }
      // Search match
      if (!q) return true;
      const matchTitle = tpl.title.toLowerCase().includes(q);
      const matchContent = (tpl.content || '').toLowerCase().includes(q);
      const matchCategory = tpl.categories?.some((c) => c.toLowerCase().includes(q));
      return matchTitle || matchContent || matchCategory;
    });
  }, [currentList, selectedCategory, searchQuery]);

  const handleCopy = async (id: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr));
      }, 2000);
    } catch (e) {
      console.error('Failed to copy template:', e);
    }
  };

  const handleSavePersonalTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    let finalCats = [...selectedCats];
    if (customCatInput.trim()) {
      const parts = customCatInput
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      finalCats = Array.from(new Set([...finalCats, ...parts]));
    }

    if (finalCats.length === 0) {
      finalCats = ['Общие вопросы'];
    }

    if (editingPersonalTemplate) {
      const updated: SupportTemplate = {
        ...editingPersonalTemplate,
        title: newTitle.trim(),
        content: newContent.trim(),
        categories: finalCats,
        updatedAt: new Date().toISOString(),
        status: editingPersonalTemplate.status,
      };
      await upsertPersonalTemplate(updated);
    } else {
      const newTpl: SupportTemplate = {
        id: `tpl-user-${Date.now()}`,
        title: newTitle.trim(),
        content: newContent.trim(),
        categories: finalCats,
        updatedAt: new Date().toISOString(),
        authorId: currentEmployee?.id || 'unknown',
        authorName: currentEmployee?.name || 'Оператор',
        isPersonal: true,
        status: 'private',
      };
      await upsertPersonalTemplate(newTpl);
    }

    setIsAddModalOpen(false);
    setEditingPersonalTemplate(null);
  };

  const handleProposeToGlobal = async (templateId: string) => {
    await proposePersonalTemplate(templateId);
  };

  const handleDeletePersonal = async (templateId: string) => {
    await deletePersonalTemplate(templateId);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-3 sm:space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              База быстрых ответов
            </h1>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-semibold tabular-nums">
              {filteredTemplates.length} из {currentList.length}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Официальные готовые формулировки для чатов с гостями. Копирование в один клик.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'personal' ? (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Создать личный шаблон</span>
            </button>
          ) : (
            canAccessAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Управление в админке</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Tabs: Global vs. Personal Templates */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => {
            setActiveTab('global');
            setSelectedCategory('Все');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'global'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-sky-500" />
          <span>Глобальные шаблоны ({globalTemplates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('personal');
            setSelectedCategory('Все');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'personal'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5 text-emerald-500" />
          <span>Мои шаблоны ({personalTemplates.length})</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по фразе, теме, ключевым словам (баня, горки, тариф, справка)..."
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
            >
              Очистить
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition cursor-pointer font-medium ${
                  isSelected
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
          <MessageSquareText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {activeTab === 'personal'
              ? 'У вас пока нет личных шаблонов'
              : 'Шаблоны по вашему запросу не найдены'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {activeTab === 'personal'
              ? 'Создавайте свои персональные шаблоны для частых ответов и предлагайте их в общую базу.'
              : 'Попробуйте изменить поисковую фразу или выберите категорию «Все».'}
          </p>
          {activeTab === 'personal' && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Создать первый шаблон</span>
            </button>
          )}
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {filteredTemplates.map((tpl) => {
          const isCopied = copiedId === tpl.id;
          const isPending = tpl.status === 'pending_approval';
          const isApproved = tpl.status === 'approved';

          return (
            <div
              key={tpl.id}
              className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div>
                {/* Header row with title & status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {tpl.title}
                  </h3>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeTab === 'personal' && (
                      <>
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            На модерации
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Опубликован
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditPersonal(tpl)}
                          className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded transition cursor-pointer"
                          title="Редактировать личный шаблон"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePersonal(tpl.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition cursor-pointer"
                          title="Удалить личный шаблон"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-2.5">
                  {tpl.categories?.map((c, i) => (
                    <span key={i}>
                      {c}
                      {i < tpl.categories.length - 1 ? ' ·' : ''}
                    </span>
                  ))}
                </div>

                {/* Body Content */}
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed select-all font-sans">
                  {tpl.content}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                {activeTab === 'personal' && !isPending && !isApproved ? (
                  <button
                    type="button"
                    onClick={() => handleProposeToGlobal(tpl.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Предложить в общие</span>
                  </button>
                ) : (
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(tpl.updatedAt).toLocaleDateString('ru-RU')}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleCopy(tpl.id, tpl.content)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800/60'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Скопировать</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Personal Template */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden"
            >
              <form onSubmit={handleSavePersonalTemplate}>
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingPersonalTemplate ? 'Редактировать личный шаблон' : 'Новый личный шаблон'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingPersonalTemplate(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>

                <div className="p-4 space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Название / тема вопроса
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Например: Как забронировать беседку"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Категории шаблона (выберите или введите свои)
                    </label>

                    {/* Quick selection chips */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {POPULAR_CATEGORIES.map((cat) => {
                        const isSelected = selectedCats.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleToggleCategory(cat)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition cursor-pointer ${
                              isSelected
                                ? 'bg-sky-600 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected categories badge list */}
                    {selectedCats.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-2">
                        <span className="text-[10px] text-slate-400 font-medium">Выбрано:</span>
                        {selectedCats.map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                          >
                            <span>{cat}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cat)}
                              className="text-sky-500 hover:text-sky-700 dark:hover:text-sky-200 cursor-pointer"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Custom Category Input */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={customCatInput}
                        onChange={(e) => setCustomCatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomCategory();
                          }
                        }}
                        placeholder="Своя категория (например: Сауна, Полотенца)..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        + Добавить
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Текст готового ответа
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Здравствуйте! Чтобы забронировать..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    />
                  </div>
                </div>

                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingPersonalTemplate(null);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-xs"
                  >
                    Сохранить шаблон
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

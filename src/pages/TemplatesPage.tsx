import React, { useState, useMemo } from 'react';
import {
  Search,
  Copy,
  Check,
  Plus,
  MessageSquareText,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SupportTemplate, PageType } from '../types';

interface TemplatesPageProps {
  templates: SupportTemplate[];
  onNavigate: (page: PageType) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  templates,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Available unique categories
  const categories = useMemo(() => {
    const set = new Set<string>(['Все']);
    templates.forEach((t) => t.categories.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [templates]);

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return templates.filter((tpl) => {
      // Category match
      if (selectedCategory !== 'Все' && !tpl.categories.includes(selectedCategory)) {
        return false;
      }
      // Search match
      if (!q) return true;
      const matchTitle = tpl.title.toLowerCase().includes(q);
      const matchContent = tpl.content.toLowerCase().includes(q);
      const matchCategory = tpl.categories.some((c) => c.toLowerCase().includes(q));
      return matchTitle || matchContent || matchCategory;
    });
  }, [templates, selectedCategory, searchQuery]);

  const handleCopy = async (id: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-3 sm:space-y-4">
      {/* Top Header & Search Bar - Compact & Balanced */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              База быстрых ответов
            </h1>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-semibold tabular-nums">
              {filteredTemplates.length} из {templates.length}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Официальные готовые формулировки для чатов с гостями. Копирование в один клик.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('admin')}
          className="inline-flex items-center gap-1 self-start sm:self-auto px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Добавить шаблон</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по словам: режим, цены, дети, справка, льготы, скидка..."
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1 py-0.5"
            >
              Очистить
            </button>
          )}
        </div>

        {/* Categories Horizontal Tabs */}
        <div className="-mx-3 px-3 sm:mx-0 sm:px-0 flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates List - Sleek & Compact Cards */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3.5">
          {filteredTemplates.map((tpl) => {
            const isCopied = copiedId === tpl.id;
            return (
              <motion.div
                key={tpl.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between transition-all"
              >
                <div className="space-y-2">
                  {/* Card Title, Categories, and Copy Button */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {tpl.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        {tpl.categories.map((c, idx) => (
                          <React.Fragment key={c}>
                            {idx > 0 && <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>}
                            <span className="text-cyan-700 dark:text-cyan-400 font-medium">
                              {c}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(tpl.id, tpl.content)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        isCopied
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-cyan-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-cyan-700 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700'
                      }`}
                      title="Скопировать текст в буфер обмена"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Скопировано!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Копировать</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Preformatted Content Body */}
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-lg p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap select-all max-h-44 overflow-y-auto">
                    {tpl.content}
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
                  <span>{tpl.content.length} знаков</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(tpl.id, tpl.content)}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    {isCopied ? '✓ В буфере' : 'Копировать в чат'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-6 sm:p-10 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              По запросу «{searchQuery}» ничего не найдено
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Попробуйте изменить формулировку или сбросить фильтр по категории.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Все');
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Сбросить фильтры
            </button>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer"
            >
              + Новый шаблон
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { PRIVILEGE_DOCUMENTS } from '../data/pricing';
import { FileText, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export const DocumentChecklist: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm transition-colors">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Документы для кассы (Памятка оператору)
          </h4>
        </div>
        <div className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <span className="text-[11px] font-medium hidden sm:inline">
            {isExpanded ? 'Свернуть' : 'Развернуть'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Warning info */}
      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Льготные билеты оформляются <strong className="text-slate-700 dark:text-slate-300">исключительно в кассе</strong> при предъявлении подлинников документов.
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {PRIVILEGE_DOCUMENTS.map((doc, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <div className="font-semibold text-slate-900 dark:text-white">
                  {doc.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {doc.doc}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Скидки по акциям (-30%, промокоды 40%/60%) на категорию «Льготный» не распространяются.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

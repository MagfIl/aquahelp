import React, { useState, useEffect, useCallback } from 'react';
import { NavigationHeader } from './components/NavigationHeader';
import { HomePage } from './pages/HomePage';
import { CalculatorPage, INITIAL_COUNTS, INITIAL_PROMOS } from './pages/CalculatorPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { AdminPage } from './pages/AdminPage';
import {
  PageType,
  DayType,
  ZoneType,
  DurationType,
  GuestCounts,
  PromosState,
  PricingMatrixType,
  SupportTemplate,
} from './types';
import {
  getStoredPricingMatrix,
  getStoredOvertimeRate,
  getStoredTemplates,
  isStoredAdminAuth,
  setStoredAdminAuth,
  subscribeToStore,
} from './data/portalStore';

export default function App() {
  // Theme state with animated circular wave
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('suzdalaqua_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('suzdalaqua_theme', 'dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('suzdalaqua_theme', 'light');
    }
  }, [darkMode]);

  const handleToggleTheme = (event?: React.MouseEvent<HTMLButtonElement>) => {
    const nextMode = !darkMode;

    if (
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const rect = event?.currentTarget.getBoundingClientRect();
      const x = rect ? rect.left + rect.width / 2 : event?.clientX ?? window.innerWidth - 40;
      const y = rect ? rect.top + rect.height / 2 : event?.clientY ?? 32;

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = (document as any).startViewTransition(() => {
        setDarkMode(nextMode);
      });

      transition.ready
        ?.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ];
          document.documentElement.animate(
            {
              clipPath: nextMode ? clipPath : [...clipPath].reverse(),
            },
            {
              duration: 450,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              pseudoElement: nextMode
                ? '::view-transition-new(root)'
                : '::view-transition-old(root)',
            }
          );
        })
        .catch(() => {
          setDarkMode(nextMode);
        });
    } else {
      setDarkMode(nextMode);
    }
  };

  // Hash-based Page Routing: home | calculator | templates | admin
  const getPageFromHash = (): PageType => {
    if (typeof window === 'undefined') return 'home';
    const hash = window.location.hash.toLowerCase();
    if (hash === '#/calculator' || hash === '#calculator') return 'calculator';
    if (hash === '#/templates' || hash === '#templates') return 'templates';
    if (hash === '#/admin' || hash === '#admin') return 'admin';
    return 'home';
  };

  const [currentPage, setCurrentPage] = useState<PageType>(getPageFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page: PageType) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.location.hash = page === 'home' ? '#/' : `#/${page}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Admin Auth State
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(isStoredAdminAuth);

  const handleSetAdminAuth = (auth: boolean) => {
    setStoredAdminAuth(auth);
    setIsAdminAuth(auth);
  };

  // Dynamic Pricing, Overtime, and Templates Stores
  const [pricingMatrix, setPricingMatrix] = useState<PricingMatrixType>(getStoredPricingMatrix);
  const [overtimeRate, setOvertimeRate] = useState<number>(getStoredOvertimeRate);
  const [templates, setTemplates] = useState<SupportTemplate[]>(getStoredTemplates);

  // Re-sync with store updates
  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      setPricingMatrix(getStoredPricingMatrix());
      setOvertimeRate(getStoredOvertimeRate());
      setTemplates(getStoredTemplates());
      setIsAdminAuth(isStoredAdminAuth());
    });
    return unsubscribe;
  }, []);

  // Calculator Parameters
  const [day, setDay] = useState<DayType>('weekday');
  const [zone, setZone] = useState<ZoneType>('aquatory');
  const [duration, setDuration] = useState<DurationType>('2h');
  const [counts, setCounts] = useState<GuestCounts>(INITIAL_COUNTS);
  const [promos, setPromos] = useState<PromosState>(INITIAL_PROMOS);
  const [overtimeMinutes, setOvertimeMinutes] = useState<number>(0);
  const [customOvertimeGuests, setCustomOvertimeGuests] = useState<number | undefined>(undefined);
  const [isPriceTableOpen, setIsPriceTableOpen] = useState(false);

  const handleResetCalculator = useCallback(() => {
    setDay('weekday');
    setZone('aquatory');
    setDuration('2h');
    setCounts(INITIAL_COUNTS);
    setPromos(INITIAL_PROMOS);
    setOvertimeMinutes(0);
    setCustomOvertimeGuests(undefined);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors ${darkMode ? 'dark' : ''}`}>
      {/* Universal Responsive Top Navigation Header */}
      <NavigationHeader
        currentPage={currentPage}
        onNavigate={handleNavigate}
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
        isAdminAuth={isAdminAuth}
        onResetCalculator={currentPage === 'calculator' ? handleResetCalculator : undefined}
        onOpenPriceTable={currentPage === 'calculator' ? () => setIsPriceTableOpen(true) : undefined}
      />

      {/* Main Page View */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            isAdminAuth={isAdminAuth}
            templatesCount={templates.length}
            overtimeRate={overtimeRate}
          />
        )}

        {currentPage === 'calculator' && (
          <CalculatorPage
            pricingMatrix={pricingMatrix}
            overtimeRate={overtimeRate}
            isPriceTableOpen={isPriceTableOpen}
            onClosePriceTable={() => setIsPriceTableOpen(false)}
            day={day}
            setDay={setDay}
            zone={zone}
            setZone={setZone}
            duration={duration}
            setDuration={setDuration}
            counts={counts}
            setCounts={setCounts}
            promos={promos}
            setPromos={setPromos}
            overtimeMinutes={overtimeMinutes}
            setOvertimeMinutes={setOvertimeMinutes}
            customOvertimeGuests={customOvertimeGuests}
            setCustomOvertimeGuests={setCustomOvertimeGuests}
            onReset={handleResetCalculator}
          />
        )}

        {currentPage === 'templates' && (
          <TemplatesPage
            templates={templates}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'admin' && (
          <AdminPage
            isAdminAuth={isAdminAuth}
            onSetAdminAuth={handleSetAdminAuth}
            pricingMatrix={pricingMatrix}
            onUpdatePricingMatrix={setPricingMatrix}
            overtimeRate={overtimeRate}
            onUpdateOvertimeRate={setOvertimeRate}
            templates={templates}
            onUpdateTemplates={setTemplates}
          />
        )}
      </main>

      {/* Universal Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-3.5 px-3 sm:px-6 lg:px-8 text-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
          <div>
            Аквапарк «Суздаль АКВА» · ГТК «Суздаль» (ул. Коровники, 45)
          </div>
          <div className="font-mono text-[10px] sm:text-[11px] text-slate-400">
            Портал оператора · Перелимит: {overtimeRate} ₽/мин с гостя
          </div>
        </div>
      </footer>
    </div>
  );
}

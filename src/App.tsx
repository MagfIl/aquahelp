import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PinLoginModal } from './components/PinLoginModal';
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
  subscribeToStore,
} from './data/portalStore';

function AppContent() {
  const { isAuthenticated, canAccessAdmin } = useAuth();

  // Instant Theme Switcher without Lag
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
      localStorage.setItem('suzdalaqua_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('suzdalaqua_theme', 'light');
    }
  }, [darkMode]);

  const handleToggleTheme = () => {
    setDarkMode((prev) => !prev);
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
      const page = getPageFromHash();
      // If employee tries to open admin, redirect to home
      if (page === 'admin' && !canAccessAdmin) {
        setCurrentPage('home');
        window.location.hash = '#/';
      } else {
        setCurrentPage(page);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [canAccessAdmin]);

  const handleNavigate = (page: PageType) => {
    if (page === 'admin' && !canAccessAdmin) {
      setCurrentPage('home');
      window.location.hash = '#/';
      return;
    }
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.location.hash = page === 'home' ? '#/' : `#/${page}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Dynamic Stores
  const [pricingMatrix, setPricingMatrix] = useState<PricingMatrixType>(getStoredPricingMatrix);
  const [overtimeRate, setOvertimeRate] = useState<number>(getStoredOvertimeRate);
  const [templates, setTemplates] = useState<SupportTemplate[]>(getStoredTemplates);

  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      setPricingMatrix(getStoredPricingMatrix());
      setOvertimeRate(getStoredOvertimeRate());
      setTemplates(getStoredTemplates());
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

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <PinLoginModal />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${
        darkMode ? 'dark' : ''
      }`}
    >
      {/* Top Navigation */}
      <NavigationHeader
        currentPage={currentPage}
        onNavigate={handleNavigate}
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            templatesCount={templates.length}
            overtimeRate={overtimeRate}
          />
        )}

        {currentPage === 'calculator' && (
          <CalculatorPage
            pricingMatrix={pricingMatrix}
            overtimeRate={overtimeRate}
            isPriceTableOpen={isPriceTableOpen}
            onOpenPriceTable={() => setIsPriceTableOpen(true)}
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
          <TemplatesPage templates={templates} onNavigate={handleNavigate} />
        )}

        {currentPage === 'admin' && canAccessAdmin && (
          <AdminPage
            isAdminAuth={true}
            onSetAdminAuth={() => {}}
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
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-3 sm:px-6 text-center text-[11px] text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <div>Аквапарк «Суздаль АКВА» · ГТК «Суздаль» (ул. Коровники, 45)</div>
          <div className="font-mono text-[10px] text-slate-400">
            Портал оператора поддержки · Перелимит: {overtimeRate} ₽/мин
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

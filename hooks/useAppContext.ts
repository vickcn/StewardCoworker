'use client';
import { createContext, useContext, useMemo, useState } from 'react';
type ViewMode = 'grid' | 'table';
interface AppContextValue {
  isLarge: boolean;
  setIsLarge: (value: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
}
const AppContext = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLarge, setIsLarge] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const value = useMemo(() => ({ isLarge, setIsLarge, viewMode, setViewMode }), [isLarge, viewMode]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}

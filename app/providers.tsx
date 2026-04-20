'use client';
import { AppProvider } from '@/hooks/useAppContext';
export function Providers({ children }: { children: React.ReactNode }) { return <AppProvider>{children}</AppProvider>; }

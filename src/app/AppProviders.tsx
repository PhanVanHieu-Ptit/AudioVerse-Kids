import { useEffect, type PropsWithChildren } from 'react';
import { ErrorBoundary } from '@/components/organisms/ErrorBoundary';
import { usePreferences } from '@/hooks/usePreferences';

export function AppProviders({ children }: PropsWithChildren) {
  const { preferences, initialize } = usePreferences();

  useEffect(() => {
    void initialize();
  }, [initialize]);
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.dataset.largeText = String(preferences.largeText);
    document.documentElement.dataset.highContrast = String(
      preferences.highContrast,
    );
    document.documentElement.dataset.reducedMotion = String(
      preferences.reducedMotion,
    );
  }, [preferences]);

  return <ErrorBoundary>{children}</ErrorBoundary>;
}

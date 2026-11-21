import { useEffect } from 'react';
import { LoadingState } from '@/components/molecules/LoadingState';
import { env } from '@/lib/env';

export function RouteLoadingState() {
  useEffect(() => {
    document.title = `Đang mở trang | ${env.appName}`;
    if (!document.querySelector('dialog[open]'))
      document.getElementById('main-content')?.focus({ preventScroll: true });
  }, []);
  return <LoadingState />;
}

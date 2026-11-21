import { useEffect, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';
import { guidanceCopy } from '@/content/accessibility';
import { preferencesStore } from '@/stores/preferencesStore';

export function GuidanceStatus() {
  const { pathname } = useLocation();
  const status = useSyncExternalStore(
    voiceGuidance.subscribe,
    voiceGuidance.getSnapshot,
  );
  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.hidden) voiceGuidance.stop();
    };
    document.addEventListener('visibilitychange', stopWhenHidden);
    const unsubscribe = preferencesStore.subscribe((state) => {
      if (!state.preferences.voiceGuidance) voiceGuidance.stop();
    });
    return () => {
      document.removeEventListener('visibilitychange', stopWhenHidden);
      unsubscribe();
      voiceGuidance.stop();
    };
  }, [pathname]);
  return (
    <div
      className={
        status === 'error' || status === 'unavailable'
          ? 'guidance-status'
          : 'sr-only'
      }
      role="status"
      aria-label="Trạng thái hướng dẫn giọng nói"
      aria-atomic="true"
    >
      {status === 'unavailable'
        ? guidanceCopy.unavailable
        : status === 'error'
          ? guidanceCopy.error
          : ''}
    </div>
  );
}

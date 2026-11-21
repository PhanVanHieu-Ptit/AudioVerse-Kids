import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';
import { voiceUi } from '@/content/voiceMessages';
import { preferencesStore } from '@/stores/preferencesStore';
import {
  configureVoiceGuidance,
  useVoiceGuidance,
} from '@/hooks/useVoiceGuidance';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';

export function GuidanceStatus() {
  const { key } = useLocation();
  const guidance = useVoiceGuidance();
  const { status } = guidance;
  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.hidden) voiceGuidance.stop();
    };
    document.addEventListener('visibilitychange', stopWhenHidden);
    window.addEventListener('pagehide', voiceGuidance.stop);
    configureVoiceGuidance();
    const unsubscribe = preferencesStore.subscribe(configureVoiceGuidance);
    return () => {
      document.removeEventListener('visibilitychange', stopWhenHidden);
      window.removeEventListener('pagehide', voiceGuidance.stop);
      unsubscribe();
      voiceGuidance.reset();
    };
  }, [key]);
  return (
    <>
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
          ? voiceUi.unavailable
          : status === 'error'
            ? voiceUi.error
            : ''}
      </div>
      {guidance.enabled && guidance.message && (
        <section className="guidance-status" aria-label="Hướng dẫn vừa yêu cầu">
          <p>{guidance.message.text}</p>
          <p aria-hidden="true">
            {status === 'loading' ? voiceUi.loading : ''}
          </p>
          <AccessibleButton
            variant="secondary"
            onClick={guidance.busy ? guidance.stop : guidance.repeat}
          >
            {guidance.busy ? voiceUi.stopCurrent : voiceUi.repeat}
          </AccessibleButton>
        </section>
      )}
    </>
  );
}

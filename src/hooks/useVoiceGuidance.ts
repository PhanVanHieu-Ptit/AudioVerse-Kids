import { useSyncExternalStore } from 'react';
import { clearAnnouncement } from '@/accessibility/announcements';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';
import type { VoiceMessage } from '@/engines/audio/voiceTypes';
import { preferencesStore } from '@/stores/preferencesStore';
import { usePreferences } from './usePreferences';

/** Read the latest persisted settings synchronously at the user gesture. */
export function configureVoiceGuidance() {
  const { preferences, status } = preferencesStore.getState();
  voiceGuidance.configure({
    enabled: status !== 'loading' && preferences.voiceGuidance,
    rate: preferences.guidanceRate,
    volume: preferences.guidanceVolume,
    ttsEnabled: preferences.guidanceTts,
  });
}

function speak(message: VoiceMessage) {
  configureVoiceGuidance();
  clearAnnouncement();
  void voiceGuidance.speak(message);
}

export function useVoiceGuidance() {
  const state = useSyncExternalStore(
    voiceGuidance.subscribe,
    voiceGuidance.getState,
    voiceGuidance.getState,
  );
  const { preferences, status } = usePreferences();
  return {
    ...state,
    enabled: status !== 'loading' && preferences.voiceGuidance,
    busy: state.status === 'loading' || state.status === 'speaking',
    speak,
    stop: voiceGuidance.stop,
    repeat: () => {
      const message = voiceGuidance.getState().message;
      if (message) speak(message);
    },
  };
}

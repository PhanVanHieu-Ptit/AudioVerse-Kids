import { useSyncExternalStore } from 'react';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';
import { usePreferences } from '@/hooks/usePreferences';

export function VoiceGuidanceButton({ text }: { text: string }) {
  const { preferences } = usePreferences();
  const status = useSyncExternalStore(
    voiceGuidance.subscribe,
    voiceGuidance.getSnapshot,
  );
  if (!preferences.voiceGuidance) return null;
  return (
    <AccessibleButton
      variant="secondary"
      onClick={() => {
        if (status === 'speaking') voiceGuidance.stop();
        else voiceGuidance.speak(text, preferences.guidanceRate);
      }}
    >
      {status === 'speaking' ? 'Dừng hướng dẫn' : 'Nghe hướng dẫn'}
    </AccessibleButton>
  );
}

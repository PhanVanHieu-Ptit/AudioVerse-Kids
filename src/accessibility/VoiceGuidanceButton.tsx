import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import type { VoiceMessage } from '@/engines/audio/voiceTypes';
import { useVoiceGuidance } from '@/hooks/useVoiceGuidance';
import { voiceUi } from '@/content/voiceMessages';

export function VoiceGuidanceButton({
  message,
  label = voiceUi.listen,
}: {
  message: VoiceMessage;
  label?: string;
}) {
  const guidance = useVoiceGuidance();
  const active = guidance.busy && guidance.message?.id === message.id;
  if (!guidance.enabled) return null;
  return (
    <AccessibleButton
      variant="secondary"
      aria-busy={active && guidance.status === 'loading' ? true : undefined}
      onClick={() => {
        if (active) guidance.stop();
        else guidance.speak(message);
      }}
    >
      {active
        ? guidance.status === 'loading'
          ? voiceUi.cancel
          : voiceUi.stop
        : label}
    </AccessibleButton>
  );
}

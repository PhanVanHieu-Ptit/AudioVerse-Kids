import { AccessibleButton } from '@/design-system';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { audioManager } from '@/engines/audio/AudioManager';
import type { StoryRecording } from '@/content/storyAudio';

export function StoryClipButton({
  recording,
  label,
}: {
  recording: StoryRecording | undefined;
  label: string;
}) {
  const player = useAudioPlayer();
  const active =
    !!recording &&
    recording.resource.id === player.resource?.id &&
    recording.resource.src === player.resource.src;
  const busy = active && player.status === 'playing';
  const loading = active && player.status === 'loading';
  return (
    <div className="story-clip">
      <AccessibleButton
        variant="secondary"
        disabled={!recording}
        loading={loading}
        loadingLabel="Đang tải lời đọc…"
        onClick={() => {
          if (!recording) return;
          if (busy) audioManager.stop();
          else void audioManager.interrupt(recording.resource);
        }}
      >
        {busy ? 'Dừng lời đọc' : label}
      </AccessibleButton>
      <p role="status" aria-label={`Trạng thái: ${label}`}>
        {active && player.status === 'error'
          ? 'Chưa phát được lời đọc. Em có thể thử lại hoặc đọc bằng chữ.'
          : ''}
      </p>
    </div>
  );
}

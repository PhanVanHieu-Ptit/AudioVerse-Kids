import { AccessibleButton } from './AccessibleButton';
import { Icon } from './Icon';
import { audioControls, type AudioControlState } from '@/content/audioControls';

export interface AudioButtonProps {
  title: string;
  state: AudioControlState;
  onActivate?: () => void;
  disabled?: boolean;
  describedBy?: string;
}

/** Controlled transport: playback and failures belong to the audio adapter. */
export function AudioButton({
  title,
  state,
  onActivate,
  disabled,
  describedBy,
}: AudioButtonProps) {
  const control = audioControls[state];
  return (
    <AccessibleButton
      variant={state === 'playing' ? 'secondary' : 'primary'}
      disabled={
        disabled ||
        state === 'unavailable' ||
        (!onActivate && state !== 'loading')
      }
      loading={state === 'loading'}
      loadingLabel={`${control.label}: ${title}…`}
      aria-label={`${control.label}: ${title}`}
      aria-describedby={describedBy}
      onClick={onActivate}
      className="audio-button"
    >
      <Icon name={control.icon} />
      <span>
        {control.label}
        <span className="sr-only">: {title}</span>
      </span>
    </AccessibleButton>
  );
}

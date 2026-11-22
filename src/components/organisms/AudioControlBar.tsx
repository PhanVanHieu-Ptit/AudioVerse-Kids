import { useId } from 'react';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import { AudioControlSettings } from '@/components/molecules/AudioControlSettings';
import {
  useAudioControls,
  type AudioControlsOptions,
} from '@/hooks/useAudioControls';
import { controlBarLabels as labels } from '@/content/audioControls';
import {
  playerErrors,
  playerLabels,
  playerStatus,
} from '@/content/audioPlayer';
import { voiceUi } from '@/content/voiceMessages';
import { KeyboardHelpDialog } from './KeyboardHelpDialog';
import './AudioControlBar.css';

export type AudioControlBarProps = AudioControlsOptions;

export function AudioControlBar(props: AudioControlBarProps) {
  const controls = useAudioControls(props);
  const id = useId();
  const { selected, status, loading, error } = controls;
  return (
    <section className="audio-control-bar" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{labels.title}</h2>
      <p className="audio-control-title">
        {selected?.title ?? playerLabels.empty}
      </p>
      <p
        id={`${id}-status`}
        role="status"
        aria-label="Trạng thái âm thanh"
        aria-atomic="true"
      >
        {!!props.playlist?.length && selected && `${selected.title}. `}
        {!selected
          ? playerLabels.empty
          : !controls.active
            ? playerStatus.ready
            : playerStatus[status]}
        {error && ` ${playerErrors[error]}`}
      </p>
      <p id={`${id}-sequential`}>{labels.sequential}</p>
      <div
        className="audio-control-actions"
        role="group"
        aria-label={labels.title}
        aria-describedby={`${id}-sequential`}
      >
        <AccessibleButton
          onKeyDown={controls.onKeyDown}
          size="large"
          disabled={!selected}
          loading={loading}
          loadingLabel={playerStatus.loading}
          aria-describedby={`${id}-status`}
          onClick={controls.toggle}
        >
          {controls.actionLabel}
        </AccessibleButton>
        <AccessibleButton
          onKeyDown={controls.onKeyDown}
          size="large"
          variant="secondary"
          disabled={!selected || loading}
          onClick={controls.replay}
        >
          {playerLabels.replay}
        </AccessibleButton>
        <AccessibleButton
          onKeyDown={controls.onKeyDown}
          size="large"
          variant="secondary"
          disabled={!controls.active}
          onClick={controls.stop}
        >
          {playerLabels.stop}
        </AccessibleButton>
        <AccessibleButton
          onKeyDown={controls.onKeyDown}
          size="large"
          variant="secondary"
          disabled={!controls.canPrevious}
          onClick={controls.previous}
        >
          {labels.previous}
        </AccessibleButton>
        <AccessibleButton
          onKeyDown={controls.onKeyDown}
          size="large"
          variant="secondary"
          disabled={!controls.canNext}
          onClick={controls.next}
        >
          {labels.next}
        </AccessibleButton>
        <AccessibleButton
          onKeyDown={controls.onKeyDown}
          size="large"
          variant="secondary"
          disabled={!controls.guidanceEnabled}
          aria-describedby={`${id}-instructions`}
          aria-busy={controls.guidanceLoading || undefined}
          onClick={controls.listenToGuidance}
        >
          {controls.guidanceActive
            ? controls.guidanceLoading
              ? voiceUi.cancel
              : voiceUi.stop
            : voiceUi.listen}
        </AccessibleButton>
        <AccessibleButton
          onKeyDown={controls.onKeyDown}
          size="large"
          variant="secondary"
          onClick={controls.openHelp}
          aria-haspopup="dialog"
        >
          {labels.help}
        </AccessibleButton>
        <AccessibleButton
          onKeyDown={controls.onKeyDown}
          size="large"
          variant="quiet"
          disabled={!controls.canBack}
          onClick={controls.back}
        >
          {labels.back}
        </AccessibleButton>
        <AccessibleButton
          onKeyDown={controls.onKeyDown}
          size="large"
          variant="danger"
          disabled={!controls.canExit}
          onClick={controls.exit}
        >
          {labels.exit}
        </AccessibleButton>
      </div>
      <p>{labels.navigationHint}</p>
      <AudioControlSettings controls={controls} />
      <div id={`${id}-instructions`}>
        <p>{controls.instructions.text}</p>
        {!controls.guidanceEnabled && <p>{labels.guidanceDisabled}</p>}
      </div>
      {/* Successful speech is not repeated in a live region over the recording. */}
      <p
        role="status"
        aria-label="Thông báo hướng dẫn điều khiển"
        aria-atomic="true"
      >
        {controls.guidanceError ? voiceUi[controls.guidanceError] : ''}
      </p>
      {selected?.transcript && (
        <details>
          <summary>{playerLabels.transcript}</summary>
          <p>{selected.transcript}</p>
        </details>
      )}
      <KeyboardHelpDialog
        open={controls.helpOpen}
        onClose={controls.closeHelp}
      />
    </section>
  );
}

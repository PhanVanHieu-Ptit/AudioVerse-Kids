import { useId } from 'react';
import type { AudioControls } from '@/hooks/useAudioControls';
import { playerLabels, playbackRates } from '@/content/audioPlayer';
import { controlBarLabels as labels } from '@/content/audioControls';

export function AudioControlSettings({
  controls,
}: {
  controls: AudioControls;
}) {
  const id = useId();
  const { player } = controls;
  return (
    <div className="audio-control-settings">
      <label htmlFor={`${id}-volume`}>
        {playerLabels.volume} ({Math.round(player.volume * 100)}%)
      </label>
      <input
        id={`${id}-volume`}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={player.volume}
        aria-valuetext={`${Math.round(player.volume * 100)} phần trăm`}
        onChange={(event) => controls.setVolume(Number(event.target.value))}
      />
      <label htmlFor={`${id}-rate`}>{playerLabels.rate}</label>
      <select
        id={`${id}-rate`}
        value={player.playbackRate}
        onChange={(event) =>
          controls.setPlaybackRate(Number(event.target.value))
        }
      >
        {/* Engines can also set a valid non-preset rate. Keep it representable. */}
        {[...new Set([...playbackRates, player.playbackRate])]
          .sort((a, b) => a - b)
          .map((rate) => (
            <option key={rate} value={rate}>
              {rate}×
            </option>
          ))}
      </select>
      <label className="audio-control-option">
        <input
          type="checkbox"
          checked={controls.shortcutsEnabled}
          aria-describedby={`${id}-scope`}
          onChange={(event) =>
            controls.setShortcutsEnabled(event.target.checked)
          }
        />
        <span>{labels.shortcuts}</span>
      </label>
      <p id={`${id}-scope`}>{labels.scope}</p>
      <label className="audio-control-option">
        <input
          type="checkbox"
          checked={controls.feedbackEnabled}
          aria-describedby={`${id}-feedback`}
          onChange={(event) =>
            controls.setFeedbackEnabled(event.target.checked)
          }
        />
        <span>{labels.feedback}</span>
      </label>
      <p id={`${id}-feedback`}>{labels.feedbackHint}</p>
      <p
        role="status"
        aria-label="Trạng thái âm báo thao tác"
        aria-atomic="true"
      >
        {controls.feedbackUnavailable ? labels.feedbackUnavailable : ''}
      </p>
    </div>
  );
}

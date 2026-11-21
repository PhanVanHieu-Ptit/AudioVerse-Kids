import { useId } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import {
  playerErrors,
  playerLabels as labels,
  playerStatus,
  playbackRates,
} from '@/content/audioPlayer';
import type { AudioEngine } from '@/engines/audio/AudioEngine';
import type { AudioChannelName, AudioResource } from '@/engines/audio/types';
import './AudioPlayer.css';

interface AudioPlayerProps {
  resource?: AudioResource;
  channel?: AudioChannelName;
  engine?: AudioEngine;
}

function timeLabel(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

/** Channel transport: follows the shared channel when another engine selects a track. */
export function AudioPlayer({
  resource,
  channel = 'narration',
  engine,
}: AudioPlayerProps) {
  const player = useAudioPlayer(channel, engine);
  const id = useId();
  const selected = resource ?? player.resource;
  const active =
    !!selected &&
    selected.id === player.resource?.id &&
    selected.src === player.resource.src;
  const status = active ? player.status : 'idle';
  const loading = status === 'loading';
  const playing = status === 'playing';
  const error = active ? player.error : null;
  const actionLabel = playing
    ? labels.pause
    : status === 'blocked' || status === 'paused'
      ? labels.resume
      : status === 'error'
        ? labels.retry
        : labels.play;

  function activate() {
    if (!selected) return;
    if (playing) player.pause();
    else if (
      active &&
      (status === 'paused' || status === 'blocked' || status === 'error')
    )
      void player.resume();
    else void player.play(selected);
  }

  return (
    <section className="audio-player" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{selected?.title ?? labels.title}</h2>
      <p id={`${id}-status`} role="status" aria-atomic="true">
        {!selected ? labels.empty : playerStatus[status]}
        {error && ` ${playerErrors[error]}`}
      </p>
      <div className="audio-player-actions">
        <AccessibleButton
          disabled={!selected}
          loading={loading}
          loadingLabel={playerStatus.loading}
          onClick={activate}
          aria-describedby={`${id}-status`}
        >
          {actionLabel}
        </AccessibleButton>
        <AccessibleButton disabled={!active} onClick={player.stop}>
          {labels.stop}
        </AccessibleButton>
        <AccessibleButton
          disabled={!active || loading}
          onClick={() => {
            void player.replay();
          }}
        >
          {labels.replay}
        </AccessibleButton>
      </div>
      <label htmlFor={`${id}-seek`}>
        {labels.seek} ({timeLabel(active ? player.currentTime : 0)} /{' '}
        {timeLabel(active ? player.duration : 0)})
      </label>
      <input
        id={`${id}-seek`}
        type="range"
        min={0}
        max={active ? player.duration : 0}
        step={1}
        value={active ? player.currentTime : 0}
        disabled={!active || loading || !player.duration}
        aria-valuetext={`${timeLabel(active ? player.currentTime : 0)} trên ${timeLabel(active ? player.duration : 0)}`}
        onChange={(event) => player.seek(Number(event.target.value))}
      />
      <label htmlFor={`${id}-volume`}>
        {labels.volume} ({Math.round(player.volume * 100)}%)
      </label>
      <input
        id={`${id}-volume`}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={player.volume}
        aria-valuetext={`${Math.round(player.volume * 100)} phần trăm`}
        onChange={(event) => player.setVolume(Number(event.target.value))}
      />
      <label htmlFor={`${id}-rate`}>{labels.rate}</label>
      <select
        id={`${id}-rate`}
        value={player.playbackRate}
        onChange={(event) => player.setPlaybackRate(Number(event.target.value))}
      >
        {playbackRates.map((rate) => (
          <option key={rate} value={rate}>
            {rate}×
          </option>
        ))}
      </select>
      {channel === 'narration' && player.queue.length > 0 && (
        <p>
          {labels.queue}: {player.queue.length}
        </p>
      )}
      {selected?.transcript && (
        <details>
          <summary>{labels.transcript}</summary>
          <p>{selected.transcript}</p>
        </details>
      )}
    </section>
  );
}

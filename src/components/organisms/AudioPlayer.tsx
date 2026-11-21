import { useId } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AudioControlBar } from './AudioControlBar';
import { playerLabels as labels } from '@/content/audioPlayer';
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

  return (
    <section className="audio-player" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{selected?.title ?? labels.title}</h2>
      <AudioControlBar resource={resource} channel={channel} engine={engine} />
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
      {channel === 'narration' && player.queue.length > 0 && (
        <p>
          {labels.queue}: {player.queue.length}
        </p>
      )}
    </section>
  );
}

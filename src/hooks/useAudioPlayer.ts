import { useStore } from 'zustand';
import { audioManager } from '@/engines/audio/AudioManager';
import type { AudioEngine } from '@/engines/audio/AudioEngine';
import type { AudioChannelName, AudioResource } from '@/engines/audio/types';

/** Ownership belongs to the app manager, not to an individual control's mount. */
export function useAudioPlayer(
  channel: AudioChannelName = 'narration',
  engine: AudioEngine = audioManager,
) {
  const state = useStore(engine.store, (store) => store.channels[channel]);
  const queue = useStore(engine.store, (store) => store.queue);
  const interrupted = useStore(engine.store, (store) => store.interrupted);
  return {
    ...state,
    queue,
    interrupted,
    play: (resource: AudioResource) => engine.play(resource, channel),
    pause: () => engine.pause(channel),
    resume: () => engine.resume(channel),
    stop: () => engine.stop(channel),
    replay: () => engine.replay(channel),
    seek: (seconds: number) => engine.seek(seconds, channel),
    setVolume: (volume: number) => engine.setVolume(volume, channel),
    setPlaybackRate: (rate: number) => engine.setPlaybackRate(rate, channel),
  };
}

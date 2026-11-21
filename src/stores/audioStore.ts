import { createStore } from 'zustand/vanilla';
import type {
  AudioChannelName,
  AudioResource,
  ChannelSnapshot,
} from '@/engines/audio/types';

export function initialChannel(): ChannelSnapshot {
  return {
    resource: null,
    status: 'idle',
    currentTime: 0,
    duration: 0,
    volume: 1,
    effectiveVolume: 1,
    playbackRate: 1,
    error: null,
  };
}

export interface AudioState {
  channels: Record<AudioChannelName, ChannelSnapshot>;
  queue: readonly AudioResource[];
  interrupted: boolean;
}

export function createAudioStore() {
  return createStore<AudioState>(() => ({
    channels: {
      narration: initialChannel(),
      music: initialChannel(),
      effects: initialChannel(),
    },
    queue: [],
    interrupted: false,
  }));
}
export type AudioStore = ReturnType<typeof createAudioStore>;

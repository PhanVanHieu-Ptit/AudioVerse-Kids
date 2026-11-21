export interface AudioResource {
  id: string;
  src: string;
  title: string;
  transcript: string;
}

export type AudioChannelName = 'narration' | 'music' | 'effects';
export type AudioStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'ended'
  | 'blocked'
  | 'error';
export type AudioErrorCode = 'load' | 'playback' | 'autoplay' | 'unsupported';
export interface ChannelSnapshot {
  resource: AudioResource | null;
  status: AudioStatus;
  currentTime: number;
  duration: number;
  volume: number;
  effectiveVolume: number;
  playbackRate: number;
  error: AudioErrorCode | null;
}

export interface AudioAssetSource {
  resolve(resource: AudioResource, signal: AbortSignal): Promise<Blob | string>;
}

export interface PlayOptions {
  loop?: boolean;
  startAt?: number;
}

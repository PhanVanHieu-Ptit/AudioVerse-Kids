// Contract only. No player is exposed until real, reviewed audio assets exist.
export interface AudioResource {
  id: string;
  src: string;
  title: string;
  transcript: string;
}

export interface AudioEngine {
  load: (resource: AudioResource) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  dispose: () => Promise<void>;
}

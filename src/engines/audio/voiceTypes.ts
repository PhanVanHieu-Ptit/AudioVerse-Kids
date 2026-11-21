export interface VoiceMessage {
  readonly id: string;
  readonly text: string;
  /** Only point to a real, reviewed recording whose transcript matches text. */
  readonly audioSrc?: string;
}

export type GuidanceStatus =
  'idle' | 'loading' | 'speaking' | 'unavailable' | 'error';

export interface GuidanceSnapshot {
  readonly status: GuidanceStatus;
  readonly message: VoiceMessage | null;
  readonly source: 'recording' | 'tts' | null;
}

export interface VoiceOptions {
  enabled: boolean;
  rate: number;
  volume: number;
  ttsEnabled: boolean;
}

export interface VoicePlayback {
  rate: number;
  volume: number;
  signal: AbortSignal;
  onStarted: () => void;
}

/** Adapters must release media and settle promptly on abort. No remote TTS by default. */
export interface VoiceAdapter {
  play(message: VoiceMessage, playback: VoicePlayback): Promise<void>;
}

export class VoiceUnavailableError extends Error {}

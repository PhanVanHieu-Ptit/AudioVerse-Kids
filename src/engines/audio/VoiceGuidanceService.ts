import { stopAudio } from './audioFocus';
import {
  VoiceUnavailableError,
  type GuidanceSnapshot,
  type VoiceAdapter,
  type VoiceMessage,
  type VoiceOptions,
  type VoicePlayback,
} from './voiceTypes';

/** Even a custom adapter that ignores abort must not keep callers pending. */
async function playWithCancellation(
  adapter: VoiceAdapter,
  message: VoiceMessage,
  playback: VoicePlayback,
) {
  playback.signal.throwIfAborted();
  let aborted = () => {};
  const cancelled = new Promise<never>((_resolve, reject) => {
    aborted = () => reject(new DOMException('Aborted', 'AbortError'));
    playback.signal.addEventListener('abort', aborted, { once: true });
  });
  try {
    await Promise.race([adapter.play(message, playback), cancelled]);
  } finally {
    playback.signal.removeEventListener('abort', aborted);
  }
}

const defaults: VoiceOptions = {
  enabled: false,
  rate: 1,
  volume: 0.7,
  ttsEnabled: true,
};

/** One request at a time. Construction and configuration never autoplay. */
export class VoiceGuidanceService {
  private state: GuidanceSnapshot = {
    status: 'idle',
    message: null,
    source: null,
  };
  private options = { ...defaults };
  private request: AbortController | null = null;
  private listeners = new Set<() => void>();

  constructor(
    private readonly recording: VoiceAdapter,
    private readonly tts: VoiceAdapter | null = null,
  ) {}

  getSnapshot = () => this.state.status;
  getState = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private update(patch: Partial<GuidanceSnapshot>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  configure(options: Partial<VoiceOptions>) {
    this.options = {
      ...this.options,
      ...options,
      rate: Number.isFinite(options.rate)
        ? Math.min(1.5, Math.max(0.5, options.rate ?? 1))
        : this.options.rate,
      volume: Number.isFinite(options.volume)
        ? Math.min(1, Math.max(0, options.volume ?? 0.7))
        : this.options.volume,
    };
    if (
      !this.options.enabled ||
      this.options.volume === 0 ||
      (!this.options.ttsEnabled && this.state.source === 'tts')
    )
      this.stop();
  }

  stop = () => {
    const previous = this.request;
    this.request = null;
    previous?.abort();
    this.update({ status: 'idle', source: null });
  };

  /** Forget the previous activity so repeat cannot revive instructions from it. */
  reset = () => {
    this.stop();
    this.update({ message: null });
  };

  repeat = () => {
    if (this.state.message) return this.speak(this.state.message);
    return Promise.resolve();
  };

  speak = async (message: VoiceMessage): Promise<void> => {
    this.stop();
    this.update({ message });
    if (
      !this.options.enabled ||
      this.options.volume === 0 ||
      !message.text.trim()
    )
      return;

    const request = new AbortController();
    this.request = request;
    const { rate, volume, ttsEnabled } = this.options;
    const adapters: Array<{
      adapter: VoiceAdapter;
      source: 'recording' | 'tts';
    }> = [];
    if (message.audioSrc)
      adapters.push({ adapter: this.recording, source: 'recording' });
    if (ttsEnabled && this.tts)
      adapters.push({ adapter: this.tts, source: 'tts' });
    if (!adapters.length) {
      this.request = null;
      this.update({ status: 'unavailable' });
      return;
    }

    stopAudio();
    this.update({ status: 'loading' });
    // Bound hung adapters; late callbacks are ignored, even after cancellation.
    const timeout = setTimeout(() => {
      if (this.request !== request) return;
      this.stop();
      this.update({ status: 'error' });
    }, 120_000);
    const clearWatchdog = () => clearTimeout(timeout);
    request.signal.addEventListener('abort', clearWatchdog, { once: true });
    let unavailable = true;
    try {
      for (const { adapter, source } of adapters) {
        if (this.request !== request) return;
        if (source === 'tts' && !this.options.ttsEnabled) continue;
        this.update({ source, status: 'loading' });
        try {
          await playWithCancellation(adapter, message, {
            rate,
            volume,
            signal: request.signal,
            onStarted: () => {
              if (this.request === request) this.update({ status: 'speaking' });
            },
          });
          if (this.request === request) {
            this.request = null;
            this.update({ status: 'idle', source: null });
          }
          return;
        } catch (error: unknown) {
          if (this.request !== request) return;
          if (!(error instanceof VoiceUnavailableError)) unavailable = false;
        }
      }
      if (this.request === request) {
        this.request = null;
        this.update({
          status: unavailable ? 'unavailable' : 'error',
          source: null,
        });
      }
    } finally {
      clearTimeout(timeout);
      request.signal.removeEventListener('abort', clearWatchdog);
    }
  };
}

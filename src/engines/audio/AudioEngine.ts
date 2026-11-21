import { createAudioStore, type AudioStore } from '@/stores/audioStore';
import { offlineAudioSource } from '@/lib/storage/audioRepository';
import { AudioChannel } from './AudioChannel';
import { AudioMixer } from './AudioMixer';
import type {
  AudioAssetSource,
  AudioChannelName,
  AudioResource,
  ChannelSnapshot,
  PlayOptions,
} from './types';

export interface AudioEngineOptions {
  source?: AudioAssetSource;
  createElement?: () => HTMLAudioElement;
  store?: AudioStore;
  duckingFactor?: number;
  loadTimeoutMs?: number;
}

interface InterruptedNarration {
  resource: AudioResource;
  position: number;
  duration: number;
  resume: boolean;
}

/** One engine is shared by Story, Game and Learning; latest direct play wins. */
export class AudioEngine {
  readonly store: AudioStore;
  private readonly mixer = new AudioMixer();
  private readonly channels: Record<AudioChannelName, AudioChannel>;
  private interrupted: InterruptedNarration | undefined;
  private disposed = false;
  private duckingFactor: number;

  constructor(options: AudioEngineOptions = {}) {
    this.store = options.store ?? createAudioStore();
    const factor = options.duckingFactor ?? 0.25;
    this.duckingFactor = Number.isFinite(factor)
      ? Math.max(0, Math.min(1, factor))
      : 0.25;
    const createChannel = (name: AudioChannelName) =>
      new AudioChannel({
        source: options.source ?? offlineAudioSource,
        createElement: options.createElement ?? (() => new Audio()),
        mixer: this.mixer,
        ...(options.loadTimeoutMs === undefined
          ? {}
          : { loadTimeoutMs: options.loadTimeoutMs }),
        onChange: (snapshot) => this.changed(name, snapshot),
        onEnded: () => {
          if (name === 'narration') this.advance();
        },
      });
    this.channels = {
      narration: createChannel('narration'),
      music: createChannel('music'),
      effects: createChannel('effects'),
    };
  }

  private changed(name: AudioChannelName, snapshot: ChannelSnapshot) {
    this.store.setState((state) => ({
      channels: { ...state.channels, [name]: snapshot },
    }));
    if (name === 'narration')
      this.channels.music.setDucking(
        snapshot.status === 'playing' ? this.duckingFactor : 1,
      );
  }

  private resetInterruption() {
    this.interrupted = undefined;
    this.store.setState({ interrupted: false });
  }

  private advance() {
    const interrupted = this.interrupted;
    if (interrupted) {
      this.resetInterruption();
      if (interrupted.resume)
        void this.channels.narration.play(interrupted.resource, {
          startAt: interrupted.position,
        });
      else {
        this.channels.narration.restorePaused(
          interrupted.resource,
          interrupted.position,
          interrupted.duration,
        );
      }
      return;
    }
    const [next, ...queue] = this.store.getState().queue;
    if (next) {
      this.store.setState({ queue });
      void this.channels.narration.play(next);
    }
  }

  /** Call directly from a trusted user gesture. Playback rejection is represented in store. */
  play(
    resource: AudioResource,
    channel: AudioChannelName = 'narration',
    options: PlayOptions = {},
  ) {
    if (this.disposed) return Promise.resolve(false);
    void this.mixer.unlock();
    if (channel === 'narration') {
      this.resetInterruption();
      this.clearQueue();
    }
    return this.channels[channel].play(resource, options);
  }

  pause(channel: AudioChannelName = 'narration') {
    this.channels[channel].pause();
  }
  resume(channel: AudioChannelName = 'narration') {
    if (this.disposed || !this.channels[channel].getSnapshot().resource)
      return Promise.resolve(false);
    void this.mixer.unlock();
    return this.channels[channel].resume();
  }
  stop(channel: AudioChannelName = 'narration') {
    if (channel === 'narration') {
      this.clearQueue();
      this.resetInterruption();
    }
    this.channels[channel].stop();
  }
  stopAll = () => {
    for (const name of ['narration', 'music', 'effects'] as const)
      this.stop(name);
  };
  replay(channel: AudioChannelName = 'narration') {
    if (this.disposed || !this.channels[channel].getSnapshot().resource)
      return Promise.resolve(false);
    void this.mixer.unlock();
    return this.channels[channel].replay();
  }
  seek(seconds: number, channel: AudioChannelName = 'narration') {
    this.channels[channel].seek(seconds);
  }
  setVolume(volume: number, channel: AudioChannelName = 'narration') {
    this.channels[channel].setVolume(volume);
  }
  setPlaybackRate(rate: number, channel: AudioChannelName = 'narration') {
    this.channels[channel].setPlaybackRate(rate);
  }
  setDucking(factor: number) {
    if (!Number.isFinite(factor)) return;
    this.duckingFactor = Math.max(0, Math.min(1, factor));
    this.channels.music.setDucking(
      this.channels.narration.getSnapshot().status === 'playing'
        ? this.duckingFactor
        : 1,
    );
  }

  /** Queue only advances on ended; errors/blocked playback wait for explicit retry. */
  enqueue(resources: readonly AudioResource[]) {
    if (this.disposed) return;
    this.store.setState((state) => ({ queue: [...state.queue, ...resources] }));
  }
  clearQueue() {
    this.store.setState({ queue: [] });
  }
  playQueue() {
    if (this.disposed) return Promise.resolve(false);
    const [next, ...queue] = this.store.getState().queue;
    if (!next) return Promise.resolve(false);
    void this.mixer.unlock();
    this.resetInterruption();
    this.store.setState({ queue });
    return this.channels.narration.play(next);
  }

  /** A single temporary prompt; a newer prompt replaces it but preserves the original. */
  interrupt(resource: AudioResource) {
    if (this.disposed) return Promise.resolve(false);
    void this.mixer.unlock();
    const current = this.channels.narration.getSnapshot();
    if (
      !this.interrupted &&
      current.resource &&
      !['ended', 'stopped', 'idle'].includes(current.status)
    ) {
      this.interrupted = {
        resource: current.resource,
        position: this.channels.narration.getPosition(),
        duration: current.duration,
        resume: current.status === 'playing' || current.status === 'loading',
      };
      this.store.setState({ interrupted: true });
    }
    return this.channels.narration.play(resource);
  }

  async dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.clearQueue();
    this.resetInterruption();
    for (const channel of Object.values(this.channels)) channel.dispose();
    await this.mixer.dispose();
  }

  protected async releaseResources() {
    this.stopAll();
    await this.mixer.reset();
  }
}

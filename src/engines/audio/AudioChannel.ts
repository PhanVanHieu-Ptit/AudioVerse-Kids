import { initialChannel } from '@/stores/audioStore';
import type {
  AudioAssetSource,
  AudioResource,
  ChannelSnapshot,
  PlayOptions,
} from './types';
import { AudioMixer } from './AudioMixer';

export interface AudioChannelOptions {
  source: AudioAssetSource;
  mixer: AudioMixer;
  createElement: () => HTMLAudioElement;
  onChange: (snapshot: ChannelSnapshot) => void;
  onEnded: () => void;
  loadTimeoutMs?: number;
}

export class AudioChannel {
  private state = initialChannel();
  private element: HTMLAudioElement | undefined;
  private controller: AbortController | undefined;
  private revision = 0;
  private disposed = false;
  private objectUrl: string | undefined;
  private removeEvents: (() => void) | undefined;
  private loop = false;
  private duck = 1;

  constructor(private readonly options: AudioChannelOptions) {}
  getSnapshot = () => this.state;
  getPosition = () => this.element?.currentTime ?? this.state.currentTime;

  private update(patch: Partial<ChannelSnapshot>) {
    this.state = { ...this.state, ...patch };
    this.options.onChange(this.state);
  }

  private release() {
    this.controller?.abort();
    this.controller = undefined;
    this.removeEvents?.();
    this.removeEvents = undefined;
    if (this.element) {
      this.element.pause();
      this.options.mixer.release(this.element);
      this.element.removeAttribute('src');
      this.element.load();
      this.element = undefined;
    }
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = undefined;
  }

  private wait<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
    return new Promise((resolve, reject) => {
      const aborted = () => reject(new DOMException('Aborted', 'AbortError'));
      if (signal.aborted) aborted();
      else signal.addEventListener('abort', aborted, { once: true });
      promise.then(
        (value) => {
          signal.removeEventListener('abort', aborted);
          resolve(value);
        },
        (error: unknown) => {
          signal.removeEventListener('abort', aborted);
          reject(error);
        },
      );
    });
  }

  private observe(
    element: HTMLAudioElement,
    signal: AbortSignal,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let loaded = false;
      const clearLoading = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', aborted);
      };
      const metadata = () => {
        loaded = true;
        clearLoading();
        this.update({
          duration: Number.isFinite(element.duration) ? element.duration : 0,
        });
        resolve();
      };
      const aborted = () => {
        clearLoading();
        reject(new DOMException('Aborted', 'AbortError'));
      };
      const failed = () => {
        clearLoading();
        if (!loaded) reject(new Error('Media load failed'));
        else {
          ++this.revision;
          this.release();
          this.update({ status: 'error', error: 'playback' });
        }
      };
      const time = () => this.update({ currentTime: element.currentTime });
      const duration = () =>
        this.update({
          duration: Number.isFinite(element.duration) ? element.duration : 0,
        });
      const ended = () => {
        this.update({ status: 'ended', currentTime: element.currentTime });
        this.options.onEnded();
      };
      const paused = () => {
        if (this.state.status === 'playing' && !element.ended)
          this.update({ status: 'paused' });
      };
      const events: [string, () => void][] = [
        ['loadedmetadata', metadata],
        ['durationchange', duration],
        ['timeupdate', time],
        ['error', failed],
        ['ended', ended],
        ['pause', paused],
      ];
      for (const [name, handler] of events)
        element.addEventListener(name, handler);
      const timer = setTimeout(() => {
        clearLoading();
        reject(new Error('Media load timed out'));
      }, this.options.loadTimeoutMs ?? 30_000);
      signal.addEventListener('abort', aborted, { once: true });
      this.removeEvents = () => {
        clearLoading();
        for (const [name, handler] of events)
          element.removeEventListener(name, handler);
      };
    });
  }

  async play(
    resource: AudioResource,
    options: PlayOptions = {},
  ): Promise<boolean> {
    if (this.disposed) return false;
    const revision = ++this.revision;
    this.release();
    this.loop = options.loop ?? false;
    const controller = new AbortController();
    this.controller = controller;
    this.update({
      resource,
      status: 'loading',
      error: null,
      currentTime: 0,
      duration: 0,
    });
    if (revision !== this.revision || this.disposed) return false;
    // Include IndexedDB/source resolution in the loading timeout.
    const timeout = setTimeout(
      () => controller.abort(),
      this.options.loadTimeoutMs ?? 30_000,
    );
    try {
      const source = await this.wait(
        this.options.source.resolve(resource, controller.signal),
        controller.signal,
      );
      if (revision !== this.revision || this.disposed) return false;
      const element = this.options.createElement();
      this.element = element;
      element.preload = 'auto';
      // Remote sources must opt into CORS to be usable by the Web Audio graph.
      element.crossOrigin = 'anonymous';
      element.loop = this.loop;
      element.playbackRate = this.state.playbackRate;
      this.options.mixer.volume(element, this.state.effectiveVolume);
      if (typeof source !== 'string')
        this.objectUrl = URL.createObjectURL(source);
      const ready = this.observe(element, controller.signal);
      element.src = typeof source === 'string' ? source : this.objectUrl!;
      element.load();
      await ready;
      if (revision !== this.revision || this.disposed) return false;
      this.update({ status: 'ready' });
      this.seek(options.startAt ?? 0);
      return await this.start(element, revision);
    } catch {
      if (revision === this.revision && !this.disposed) {
        this.release();
        this.update({ status: 'error', error: 'load' });
      }
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async start(element: HTMLAudioElement, revision: number) {
    if (revision !== this.revision || this.disposed) return false;
    this.update({ status: 'loading' });
    if (revision !== this.revision || this.disposed) return false;
    const controller = this.controller ?? new AbortController();
    this.controller = controller;
    const timer = setTimeout(
      () => controller.abort(),
      this.options.loadTimeoutMs ?? 30_000,
    );
    try {
      await this.wait(element.play(), controller.signal);
      if (revision !== this.revision || this.disposed) return false;
      this.update({ status: 'playing', error: null });
      return true;
    } catch (error) {
      if (revision !== this.revision || this.disposed) return false;
      element.pause();
      const blocked =
        error instanceof DOMException && error.name === 'NotAllowedError';
      if (!blocked) this.release();
      this.update({
        status: blocked ? 'blocked' : 'error',
        error: blocked ? 'autoplay' : 'playback',
      });
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  pause() {
    if (
      this.disposed ||
      !this.state.resource ||
      !['playing', 'loading', 'ready'].includes(this.state.status)
    )
      return;
    ++this.revision;
    const currentTime = this.getPosition();
    if (this.state.status === 'loading') this.release();
    this.element?.pause();
    this.update({ status: 'paused', error: null, currentTime });
  }

  resume(): Promise<boolean> {
    if (this.disposed || !this.state.resource) return Promise.resolve(false);
    if (this.state.status === 'playing') return Promise.resolve(true);
    if (
      !this.element ||
      this.options.mixer.requiresReload(this.element) ||
      this.state.status === 'error' ||
      this.state.status === 'loading'
    )
      return this.play(this.state.resource, {
        loop: this.loop,
        startAt: this.state.currentTime,
      });
    if (this.state.status === 'ended') this.seek(0);
    return this.start(this.element, ++this.revision);
  }

  stop() {
    ++this.revision;
    this.release();
    this.update({
      status: this.state.resource ? 'stopped' : 'idle',
      currentTime: 0,
      error: null,
    });
  }

  replay() {
    const resource = this.state.resource;
    return resource
      ? this.play(resource, { loop: this.loop })
      : Promise.resolve(false);
  }

  restorePaused(resource: AudioResource, position: number, duration: number) {
    ++this.revision;
    this.release();
    this.update({
      resource,
      currentTime: position,
      duration,
      status: 'paused',
      error: null,
    });
  }

  seek(seconds: number) {
    if (!Number.isFinite(seconds)) return;
    const currentTime = Math.max(
      0,
      Math.min(seconds, this.state.duration || 0),
    );
    if (this.element) {
      try {
        this.element.currentTime = currentTime;
      } catch {
        return;
      }
    }
    this.update({ currentTime });
  }

  setVolume(value: number) {
    if (!Number.isFinite(value)) return;
    this.update({ volume: Math.max(0, Math.min(1, value)) });
    this.setDucking(this.duck);
  }

  setDucking(factor: number) {
    if (!Number.isFinite(factor)) return;
    this.duck = Math.max(0, Math.min(1, factor));
    const effectiveVolume = this.state.volume * this.duck;
    if (this.element) this.options.mixer.volume(this.element, effectiveVolume);
    this.update({ effectiveVolume });
  }

  setPlaybackRate(value: number) {
    if (!Number.isFinite(value)) return;
    const playbackRate = Math.max(0.5, Math.min(2, value));
    if (this.element) this.element.playbackRate = playbackRate;
    this.update({ playbackRate });
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
  }
}

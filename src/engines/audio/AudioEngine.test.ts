import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioEngine, type AudioEngineOptions } from './AudioEngine';
import {
  audioResource as resource,
  deferred,
  fakeAudio,
} from '@/test/audioTestUtils';

const engines: AudioEngine[] = [];
function setup(
  options: AudioEngineOptions = {},
  mediaOptions: Parameters<typeof fakeAudio>[0] = {},
) {
  const media: ReturnType<typeof fakeAudio>[] = [];
  const engine = new AudioEngine({
    source: { resolve: async (item) => item.src },
    createElement: () => {
      const item = fakeAudio(mediaOptions);
      media.push(item);
      return item.element;
    },
    ...options,
  });
  engines.push(engine);
  return { engine, media, state: () => engine.store.getState() };
}
afterEach(async () => {
  await Promise.all(engines.splice(0).map((engine) => engine.dispose()));
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('AudioEngine concurrency and interruption', () => {
  it('creates neither media nor AudioContext at construction', () => {
    const context = vi.fn();
    vi.stubGlobal('AudioContext', context);
    const { media } = setup();
    expect(media).toHaveLength(0);
    expect(context).not.toHaveBeenCalled();
  });

  it('latest narration wins even when an older source resolves last', async () => {
    const slow = deferred<string>();
    const { engine, media, state } = setup({
      source: {
        resolve: (item) =>
          item.id === 'old' ? slow.promise : Promise.resolve(item.src),
      },
    });
    const older = engine.play(resource('old'));
    expect(await engine.play(resource('new'))).toBe(true);
    slow.resolve('/old.wav');
    expect(await older).toBe(false);
    expect(media).toHaveLength(1);
    expect(state().channels.narration.resource?.id).toBe('new');
    expect(state().channels.narration.status).toBe('playing');
  });

  it('supports a subscriber replacing playback synchronously during loading', async () => {
    const { engine, state } = setup();
    let replacement: Promise<boolean> | undefined;
    let requested = false;
    const unsubscribe = engine.store.subscribe((snapshot) => {
      if (!requested && snapshot.channels.narration.resource?.id === 'old') {
        requested = true;
        replacement = engine.play(resource('new'));
      }
    });
    expect(await engine.play(resource('old'))).toBe(false);
    expect(await replacement).toBe(true);
    expect(state().channels.narration.resource?.id).toBe('new');
    engine.stop();
    expect(state().channels.narration.status).toBe('stopped');
    unsubscribe();
  });

  it('ignores a late play resolution after stop and cleans the old element', async () => {
    const started = deferred<void>();
    const { engine, media, state } = setup({}, { play: () => started.promise });
    const playback = engine.play(resource('a'));
    await vi.waitFor(() => expect(media[0]?.play).toHaveBeenCalled());
    engine.stop();
    expect(await playback).toBe(false);
    started.resolve();
    expect(state().channels.narration.status).toBe('stopped');
    expect(media[0]?.pause).toHaveBeenCalled();
    expect(media[0]?.element.hasAttribute('src')).toBe(false);
  });

  it('aborts pending source resolution on pause and reloads only on explicit resume', async () => {
    const slow = deferred<string>();
    const resolve = vi
      .fn()
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValue('/a.wav');
    const { engine, state } = setup({ source: { resolve } });
    const playback = engine.play(resource('a'));
    engine.pause();
    expect(await playback).toBe(false);
    slow.resolve('/stale.wav');
    expect(state().channels.narration.status).toBe('paused');
    expect(await engine.resume()).toBe(true);
  });

  it('pauses, resumes, seeks, changes volume/rate, stops and replays', async () => {
    const { engine, media, state } = setup();
    await engine.play(resource('a'));
    engine.seek(20);
    engine.pause();
    expect(state().channels.narration.status).toBe('paused');
    await engine.resume();
    expect(media[0]?.element.currentTime).toBe(20);
    engine.setVolume(0.4);
    engine.setPlaybackRate(1.5);
    expect(media[0]?.element.volume).toBe(0.4);
    expect(media[0]?.element.playbackRate).toBe(1.5);
    engine.seek(999);
    expect(state().channels.narration.currentTime).toBe(90);
    engine.seek(-10);
    expect(state().channels.narration.currentTime).toBe(0);
    engine.setVolume(Number.NaN);
    expect(state().channels.narration.volume).toBe(0.4);
    engine.setPlaybackRate(99);
    expect(state().channels.narration.playbackRate).toBe(2);
    engine.stop();
    await engine.replay();
    expect(state().channels.narration.currentTime).toBe(0);
    expect(media).toHaveLength(2);
    expect(state().channels.narration.status).toBe('playing');
  });

  it('starts the queue explicitly and advances only on the current narration ending', async () => {
    const { engine, media, state } = setup();
    engine.enqueue([resource('a'), resource('b'), resource('c')]);
    expect(media).toHaveLength(0);
    await engine.playQueue();
    expect(state().queue.map((item) => item.id)).toEqual(['b', 'c']);
    media[0]?.element.dispatchEvent(new Event('ended'));
    await vi.waitFor(() =>
      expect(state().channels.narration.status).toBe('playing'),
    );
    expect(state().channels.narration.resource?.id).toBe('b');
    media[0]?.element.dispatchEvent(new Event('ended'));
    expect(state().channels.narration.resource?.id).toBe('b');
    await engine.play(resource('direct'));
    expect(state().queue).toEqual([]);
  });

  it('interrupts narration, replaces a prompt, then restores the original position and queue', async () => {
    const { engine, media, state } = setup();
    await engine.play(resource('story'));
    engine.enqueue([resource('next')]);
    engine.seek(32);
    await engine.interrupt(resource('prompt1'));
    await engine.interrupt(resource('prompt2'));
    expect(state().interrupted).toBe(true);
    expect(media[0]?.pause).toHaveBeenCalled();
    media[1]?.element.dispatchEvent(new Event('ended'));
    expect(state().channels.narration.resource?.id).toBe('prompt2');
    media[2]?.element.dispatchEvent(new Event('ended'));
    await vi.waitFor(() =>
      expect(state().channels.narration.status).toBe('playing'),
    );
    expect(state().channels.narration.resource?.id).toBe('story');
    expect(state().channels.narration.currentTime).toBe(32);
    expect(state().interrupted).toBe(false);
    expect(state().queue[0]?.id).toBe('next');
  });

  it('restores paused narration without autoplay after interruption', async () => {
    const { engine, media, state } = setup();
    await engine.play(resource('story'));
    engine.seek(12);
    engine.pause();
    await engine.interrupt(resource('prompt'));
    media[1]?.element.dispatchEvent(new Event('ended'));
    expect(state().channels.narration.resource?.id).toBe('story');
    expect(state().channels.narration.status).toBe('paused');
    expect(media).toHaveLength(2);
    await engine.resume();
    expect(state().channels.narration.currentTime).toBe(12);
  });

  it('stop cancels interruption and queue; late events cannot restart them', async () => {
    const { engine, media, state } = setup();
    await engine.play(resource('story'));
    engine.enqueue([resource('next')]);
    await engine.interrupt(resource('prompt'));
    engine.stop();
    media[1]?.element.dispatchEvent(new Event('ended'));
    expect(state().channels.narration.status).toBe('stopped');
    expect(state().interrupted).toBe(false);
    expect(state().queue).toEqual([]);
    expect(media).toHaveLength(2);
  });

  it('ducks music only while narration plays and keeps effects independent', async () => {
    const { engine, media, state } = setup();
    engine.setVolume(0.8, 'music');
    await engine.play(resource('music'), 'music', { loop: true });
    await engine.play(resource('story'));
    expect(media[0]?.element.loop).toBe(true);
    expect(state().channels.music.effectiveVolume).toBeCloseTo(0.2);
    await engine.play(resource('effect'), 'effects');
    expect(state().channels.narration.status).toBe('playing');
    engine.pause();
    expect(state().channels.music.effectiveVolume).toBe(0.8);
    await engine.resume();
    engine.setDucking(0.5);
    expect(state().channels.music.effectiveVolume).toBe(0.4);
    engine.stop();
    expect(state().channels.music.effectiveVolume).toBe(0.8);
  });
});

describe('audio failures, browser policies and resource lifecycle', () => {
  it('surfaces autoplay denial and retries the existing media on a user resume', async () => {
    const play = vi
      .fn()
      .mockRejectedValueOnce(
        new DOMException('Gesture required', 'NotAllowedError'),
      )
      .mockResolvedValue(undefined);
    const { engine, media, state } = setup({}, { play });
    expect(await engine.play(resource('a'))).toBe(false);
    expect(state().channels.narration.status).toBe('blocked');
    expect(state().channels.narration.error).toBe('autoplay');
    expect(await engine.resume()).toBe(true);
    expect(media).toHaveLength(1);
  });

  it('keeps the queue on load failure and permits retry', async () => {
    const resolve = vi
      .fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue('/a.wav');
    const { engine, state } = setup({ source: { resolve } });
    engine.enqueue([resource('a'), resource('b')]);
    expect(await engine.playQueue()).toBe(false);
    expect(state().channels.narration.error).toBe('load');
    expect(state().queue[0]?.id).toBe('b');
    expect(await engine.resume()).toBe(true);
  });

  it('reports decode errors and restores music volume', async () => {
    const { engine, media, state } = setup();
    await engine.play(resource('a'));
    media[0]?.element.dispatchEvent(new Event('error'));
    expect(state().channels.narration.error).toBe('playback');
    expect(state().channels.music.effectiveVolume).toBe(1);
    engine.pause();
    expect(state().channels.narration.status).toBe('error');
  });

  it('times out stalled metadata and source resolution, releasing media', async () => {
    vi.useFakeTimers();
    const { engine, media, state } = setup(
      { loadTimeoutMs: 100 },
      { metadata: false },
    );
    const playback = engine.play(resource('a'));
    await vi.advanceTimersByTimeAsync(100);
    expect(await playback).toBe(false);
    expect(state().channels.narration.error).toBe('load');
    expect(media[0]?.element.hasAttribute('src')).toBe(false);
    const other = setup({
      loadTimeoutMs: 100,
      source: { resolve: () => new Promise(() => undefined) },
    });
    const stalled = other.engine.play(resource('b'));
    await vi.advanceTimersByTimeAsync(100);
    expect(await stalled).toBe(false);
    expect(other.state().channels.narration.status).toBe('error');
  });

  it('times out a media play promise that never settles', async () => {
    vi.useFakeTimers();
    const { engine, media, state } = setup(
      { loadTimeoutMs: 100 },
      { play: () => new Promise(() => undefined) },
    );
    const playback = engine.play(resource('a'));
    await vi.advanceTimersByTimeAsync(100);
    expect(await playback).toBe(false);
    expect(state().channels.narration.status).toBe('error');
    expect(media[0]?.element.hasAttribute('src')).toBe(false);
  });

  it('captures the media position between timeupdate events when interrupting', async () => {
    const { engine, media, state } = setup();
    await engine.play(resource('story'));
    media[0]!.element.currentTime = 7.125;
    expect(state().channels.narration.currentTime).toBe(0);
    await engine.interrupt(resource('prompt'));
    media[1]?.element.dispatchEvent(new Event('ended'));
    await vi.waitFor(() =>
      expect(state().channels.narration.status).toBe('playing'),
    );
    expect(state().channels.narration.currentTime).toBe(7.125);
  });

  it('revokes cached blob URLs, removes event handlers and refuses playback after disposal', async () => {
    const create = vi.fn().mockReturnValue('blob:cached');
    const revoke = vi.fn();
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }),
    );
    const { engine, media, state } = setup({
      source: { resolve: async () => new Blob(['audio']) },
    });
    await engine.play(resource('a'));
    expect(media[0]?.element.src).toBe('blob:cached');
    await engine.dispose();
    const snapshot = state();
    media[0]?.element.dispatchEvent(new Event('ended'));
    media[0]?.element.dispatchEvent(new Event('timeupdate'));
    expect(state()).toBe(snapshot);
    expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:cached');
    expect(await engine.play(resource('b'))).toBe(false);
    await engine.dispose();
  });

  it('uses HTML audio when AudioContext is missing or construction fails', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const { engine } = setup();
    expect(await engine.play(resource('a'))).toBe(true);
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('No hardware');
        }
      },
    );
    const other = setup();
    expect(await other.engine.play(resource('b'))).toBe(true);
    other.engine.setVolume(0.5);
    expect(other.media[0]?.element.volume).toBe(0.5);
  });
});

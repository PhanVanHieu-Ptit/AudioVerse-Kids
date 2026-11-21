import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerAudioStop } from './audioFocus';
import { VoiceGuidanceService } from './VoiceGuidanceService';
import {
  VoiceUnavailableError,
  type VoiceAdapter,
  type VoicePlayback,
} from './voiceTypes';
import { deferred } from '@/test/audioTestUtils';

const message = { id: 'test', text: 'Hướng dẫn kiểm thử' };
const recordingMessage = { ...message, audioSrc: '/test-only/voice.wav' };
const services: VoiceGuidanceService[] = [];
function adapter() {
  return { play: vi.fn<VoiceAdapter['play']>().mockResolvedValue(undefined) };
}
function setup(enabled = true) {
  const recording = adapter();
  const tts = adapter();
  const engine = new VoiceGuidanceService(recording, tts);
  services.push(engine);
  engine.configure({ enabled });
  return { recording, tts, engine };
}
afterEach(() => {
  services.forEach((service) => service.reset());
  services.length = 0;
  vi.useRealTimers();
});

describe('VoiceGuidanceService', () => {
  it('does not autoplay on construction or configuration and respects disabled/muted guidance', async () => {
    const { recording, tts, engine } = setup(false);
    engine.configure({ rate: 0.8, volume: 0.5 });
    await engine.speak(recordingMessage);
    expect(recording.play).not.toHaveBeenCalled();
    expect(tts.play).not.toHaveBeenCalled();
    expect(engine.getState().message).toEqual(recordingMessage);
    engine.configure({ enabled: true, volume: 0 });
    await engine.repeat();
    expect(recording.play).not.toHaveBeenCalled();
  });

  it('prefers recordings, passes rate/volume, and releases audio focus', async () => {
    const { recording, tts, engine } = setup();
    const stop = vi.fn();
    const unregister = registerAudioStop(stop);
    try {
      engine.configure({ rate: 0.8, volume: 0.35 });
      await engine.speak(recordingMessage);
      expect(recording.play).toHaveBeenCalledWith(
        recordingMessage,
        expect.objectContaining({ rate: 0.8, volume: 0.35 }),
      );
      expect(tts.play).not.toHaveBeenCalled();
      expect(stop).toHaveBeenCalledOnce();
      expect(engine.getSnapshot()).toBe('idle');
    } finally {
      unregister();
    }
  });

  it('cancels pending work before a new request and ignores stale start/end/failure callbacks', async () => {
    const { tts, engine } = setup();
    const old = deferred<void>();
    let oldPlayback: VoicePlayback | undefined;
    tts.play.mockImplementationOnce((_message, playback) => {
      oldPlayback = playback;
      playback.onStarted();
      return old.promise;
    });
    const first = engine.speak(message);
    expect(engine.getSnapshot()).toBe('speaking');
    const next = deferred<void>();
    tts.play.mockImplementationOnce((_message, playback) => {
      playback.onStarted();
      return next.promise;
    });
    const second = engine.speak({ id: 'next', text: 'Tiếp theo' });
    expect(oldPlayback?.signal.aborted).toBe(true);
    oldPlayback?.onStarted();
    old.reject(new Error('Late failure'));
    await first;
    expect(engine.getState()).toMatchObject({
      status: 'speaking',
      message: { id: 'next' },
    });
    engine.stop();
    next.resolve();
    await second;
    expect(engine.getSnapshot()).toBe('idle');
  });

  it('exposes loading and allows cancellation before playback starts without TTS fallback', async () => {
    const { recording, tts, engine } = setup();
    const load = deferred<void>();
    recording.play.mockReturnValue(load.promise);
    const pending = engine.speak(recordingMessage);
    expect(engine.getSnapshot()).toBe('loading');
    const playback = recording.play.mock.calls[0]?.[1];
    engine.stop();
    expect(playback?.signal.aborted).toBe(true);
    load.reject(new Error('Cancelled load'));
    await pending;
    expect(tts.play).not.toHaveBeenCalled();
    expect(engine.getSnapshot()).toBe('idle');
  });

  it('falls back from a failed recording to optional TTS', async () => {
    const { recording, tts, engine } = setup();
    recording.play.mockRejectedValue(new Error('Missing recording'));
    await engine.speak(recordingMessage);
    expect(tts.play).toHaveBeenCalledOnce();
    expect(engine.getSnapshot()).toBe('idle');
    engine.configure({ ttsEnabled: false });
    await engine.speak(recordingMessage);
    expect(tts.play).toHaveBeenCalledOnce();
    expect(engine.getSnapshot()).toBe('error');
  });

  it('works with recordings when no TTS adapter exists and reports missing sources', async () => {
    const recording = adapter();
    const engine = new VoiceGuidanceService(recording);
    services.push(engine);
    engine.configure({ enabled: true });
    await engine.speak(recordingMessage);
    expect(recording.play).toHaveBeenCalledOnce();
    await engine.speak(message);
    expect(engine.getState()).toMatchObject({ status: 'unavailable', message });
  });

  it('does not fall back to TTS if it was disabled while a recording was loading', async () => {
    const { recording, tts, engine } = setup();
    const load = deferred<void>();
    recording.play.mockReturnValue(load.promise);
    const pending = engine.speak(recordingMessage);
    engine.configure({ ttsEnabled: false });
    load.reject(new Error('Missing recording'));
    await pending;
    expect(tts.play).not.toHaveBeenCalled();
    expect(engine.getSnapshot()).toBe('error');
  });

  it('distinguishes unavailable voices from playback failures without rejecting UI callers', async () => {
    const { tts, engine } = setup();
    tts.play.mockRejectedValue(new VoiceUnavailableError());
    await engine.speak(message);
    expect(engine.getSnapshot()).toBe('unavailable');
    tts.play.mockImplementation(() => {
      throw new Error('Adapter failed');
    });
    await expect(engine.speak(message)).resolves.toBeUndefined();
    expect(engine.getSnapshot()).toBe('error');
  });

  it('repeats the last message with new settings and forgets it on activity reset', async () => {
    const { tts, engine } = setup();
    await engine.repeat();
    expect(tts.play).not.toHaveBeenCalled();
    await engine.speak(message);
    engine.configure({ rate: 1.2, volume: 0.5 });
    expect(tts.play).toHaveBeenCalledOnce();
    await engine.repeat();
    expect(tts.play).toHaveBeenLastCalledWith(
      message,
      expect.objectContaining({ rate: 1.2, volume: 0.5 }),
    );
    engine.reset();
    await engine.repeat();
    expect(tts.play).toHaveBeenCalledTimes(2);
    expect(engine.getState().message).toBeNull();
  });

  it.each([{ enabled: false }, { volume: 0 }, { ttsEnabled: false }])(
    'stops active speech immediately when settings change: %o',
    async (settings) => {
      const { tts, engine } = setup();
      const speech = deferred<void>();
      tts.play.mockImplementation((_message, playback) => {
        playback.onStarted();
        return speech.promise;
      });
      const pending = engine.speak(message);
      engine.configure(settings);
      expect(tts.play.mock.calls[0]?.[1].signal.aborted).toBe(true);
      expect(engine.getSnapshot()).toBe('idle');
      speech.resolve();
      await pending;
    },
  );

  it('bounds hung playback and clears its watchdog when stopped', async () => {
    vi.useFakeTimers();
    const { tts, engine } = setup();
    const speech = deferred<void>();
    tts.play.mockReturnValue(speech.promise);
    const pending = engine.speak(message);
    vi.advanceTimersByTime(120_000);
    expect(engine.getSnapshot()).toBe('error');
    expect(tts.play.mock.calls[0]?.[1].signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    await pending;
    speech.resolve();
    expect(engine.getSnapshot()).toBe('error');
  });

  it('clamps invalid settings and unsubscribes cleanly', async () => {
    const { tts, engine } = setup();
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);
    engine.configure({ rate: -3, volume: 10 });
    await engine.speak(message);
    expect(tts.play).toHaveBeenLastCalledWith(
      message,
      expect.objectContaining({ rate: 0.5, volume: 1 }),
    );
    unsubscribe();
    listener.mockClear();
    engine.configure({ rate: Number.NaN, volume: Number.POSITIVE_INFINITY });
    await engine.speak(message);
    expect(listener).not.toHaveBeenCalled();
    expect(tts.play).toHaveBeenLastCalledWith(
      message,
      expect.objectContaining({ rate: 0.5, volume: 1 }),
    );
  });
});

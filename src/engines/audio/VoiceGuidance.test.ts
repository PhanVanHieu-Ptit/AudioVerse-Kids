import { describe, expect, it, vi } from 'vitest';
import { registerAudioStop } from './audioFocus';
import { VoiceGuidance, type SpeechPort } from './VoiceGuidance';

function setup() {
  const port: SpeechPort = {
    cancel: vi.fn(),
    speak: vi.fn().mockReturnValue(true),
  };
  return { port, engine: new VoiceGuidance(() => port) };
}

describe('voice guidance', () => {
  it('does not autoplay, cancels previous speech and stops content audio', () => {
    const { port, engine } = setup();
    const stop = vi.fn();
    const unregister = registerAudioStop(stop);
    expect(port.speak).not.toHaveBeenCalled();
    engine.speak('Hướng dẫn đầu', 0.8);
    engine.speak('Hướng dẫn tiếp', 1);
    expect(port.cancel).toHaveBeenCalledOnce();
    expect(stop).toHaveBeenCalledTimes(2);
    expect(port.speak).toHaveBeenLastCalledWith(
      'Hướng dẫn tiếp',
      1,
      expect.any(Function),
      expect.any(Function),
    );
    expect(engine.getSnapshot()).toBe('speaking');
    unregister();
  });
  it('ignores stale completion or failure events after a new request or stop', () => {
    const { port, engine } = setup();
    const callbacks: Array<{ ended: () => void; failed: () => void }> = [];
    vi.mocked(port.speak).mockImplementation((_text, _rate, ended, failed) => {
      callbacks.push({ ended, failed });
      return true;
    });
    engine.speak('Đầu', 1);
    engine.speak('Tiếp', 1);
    callbacks[0]?.ended();
    callbacks[0]?.failed();
    expect(engine.getSnapshot()).toBe('speaking');
    engine.stop();
    callbacks[1]?.failed();
    expect(engine.getSnapshot()).toBe('idle');
  });
  it('exposes unsupported speech, missing local voice and playback errors', () => {
    const unsupported = new VoiceGuidance(() => null);
    unsupported.speak('Nội dung', 1);
    expect(unsupported.getSnapshot()).toBe('unavailable');
    const { port, engine } = setup();
    vi.mocked(port.speak).mockReturnValue(false);
    engine.speak('Nội dung', 1);
    expect(engine.getSnapshot()).toBe('unavailable');
    vi.mocked(port.speak).mockImplementation(() => {
      throw new Error('Speech error');
    });
    engine.speak('Nội dung', 1);
    expect(engine.getSnapshot()).toBe('error');
  });
  it('notifies subscribers when speech ends and stops notifying after unsubscribe', () => {
    const { port, engine } = setup();
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);
    vi.mocked(port.speak).mockImplementation((_text, _rate, ended) => {
      ended();
      return true;
    });
    engine.speak('Nội dung', 1);
    expect(engine.getSnapshot()).toBe('idle');
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    listener.mockClear();
    engine.stop();
    expect(listener).not.toHaveBeenCalled();
  });
});

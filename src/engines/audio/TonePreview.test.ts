import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TonePreview } from './TonePreview';
import { tonePreview } from '@/content/designSystem';

function audioPlatform() {
  const envelope = {
    gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const oscillator = {
    frequency: { value: 0 },
    onended: null as (() => void) | null,
    connect: vi.fn(() => envelope),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
  };
  const context = {
    currentTime: 0,
    state: 'running',
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => envelope),
  };
  const constructor = vi.fn(function () {
    return context;
  });
  vi.stubGlobal('AudioContext', constructor);
  return { context, oscillator, envelope, constructor };
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => vi.unstubAllGlobals());

describe('real tone preview lifecycle', () => {
  it('creates no audio context before interaction and releases nodes at natural end', async () => {
    const platform = audioPlatform();
    const onEnded = vi.fn();
    const preview = new TonePreview(onEnded);
    expect(platform.constructor).not.toHaveBeenCalled();
    await preview.play(tonePreview);
    expect(platform.oscillator.start).toHaveBeenCalledOnce();
    platform.oscillator.onended?.();
    expect(onEnded).toHaveBeenCalledOnce();
    expect(platform.oscillator.disconnect).toHaveBeenCalledOnce();
    expect(platform.envelope.disconnect).toHaveBeenCalledOnce();
    await preview.dispose();
    expect(platform.context.close).toHaveBeenCalledOnce();
  });

  it('cancels a pending start when navigation disposes the engine', async () => {
    const platform = audioPlatform();
    let resume: (() => void) | undefined;
    platform.context.resume.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resume = resolve;
        }),
    );
    const onEnded = vi.fn();
    const preview = new TonePreview(onEnded);
    const playing = preview.play(tonePreview);
    await preview.dispose();
    resume?.();
    await playing;
    expect(platform.context.createOscillator).not.toHaveBeenCalled();
    expect(onEnded).not.toHaveBeenCalled();
    expect(platform.context.close).toHaveBeenCalledOnce();
  });

  it('stops promptly and ignores a stale ended event after manual pause', async () => {
    const platform = audioPlatform();
    const onEnded = vi.fn();
    const preview = new TonePreview(onEnded);
    await preview.play(tonePreview);
    platform.oscillator.stop.mockClear();
    preview.stop();
    expect(platform.oscillator.stop).toHaveBeenCalledOnce();
    platform.oscillator.onended?.();
    expect(onEnded).not.toHaveBeenCalled();
    await preview.dispose();
  });
});

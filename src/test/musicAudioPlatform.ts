import { vi } from 'vitest';

/** Mock only the browser boundary; exercise the real synthesizer and scheduling. */
export function musicAudioPlatform() {
  const gains: ReturnType<typeof makeGain>[] = [];
  const oscillators: ReturnType<typeof makeOscillator>[] = [];
  function makeGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  function makeOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(() => gains.at(-1)!),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as (() => void) | null,
    };
  }
  const context = {
    currentTime: 10,
    state: 'running',
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    createGain: vi.fn(() => {
      const node = makeGain();
      gains.push(node);
      return node;
    }),
    createOscillator: vi.fn(() => {
      const node = makeOscillator();
      oscillators.push(node);
      return node;
    }),
  };
  const constructor = vi.fn(function () {
    return context;
  });
  vi.stubGlobal('AudioContext', constructor);
  return {
    context,
    gains,
    oscillators,
    constructor,
    end: () => {
      for (const node of [...oscillators]) {
        const end = node.onended;
        node.onended = null;
        end?.();
      }
    },
  };
}

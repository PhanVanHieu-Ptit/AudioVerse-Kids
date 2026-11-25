import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  animalSounds,
  instrumentSounds,
  memorySounds,
} from '@/content/gameSounds';
import { deferred } from '@/test/audioTestUtils';
import { GameAudio, rhythmSound, sequenceSound } from './GameAudio';

function platform() {
  const nodes: {
    oscillator: ReturnType<typeof makeOscillator>;
    envelope: ReturnType<typeof makeEnvelope>;
  }[] = [];
  function makeEnvelope() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  function makeOscillator(envelope: ReturnType<typeof makeEnvelope>) {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(() => envelope),
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
    createOscillator: vi.fn(() => {
      const envelope = makeEnvelope();
      const oscillator = makeOscillator(envelope);
      nodes.push({ oscillator, envelope });
      return oscillator;
    }),
    createGain: vi.fn(() => nodes.at(-1)!.envelope),
  };
  const constructor = vi.fn(function () {
    return context;
  });
  vi.stubGlobal('AudioContext', constructor);
  return { context, nodes, constructor };
}
afterEach(() => vi.unstubAllGlobals());

describe('game audio synthesis', () => {
  it('renders every animal and instrument cue without fetching any file', async () => {
    const p = platform();
    const ended = vi.fn();
    const engine = new GameAudio(ended);
    expect(p.constructor).not.toHaveBeenCalled();
    for (const sound of [...animalSounds, ...instrumentSounds]) {
      await engine.play(sound);
      const nodes = p.nodes.slice(-sound.notes.length);
      for (const node of nodes) node.oscillator.onended?.();
      expect(
        nodes.every(
          (node) =>
            node.oscillator.disconnect.mock.calls.length === 1 &&
            node.envelope.disconnect.mock.calls.length === 1,
        ),
      ).toBe(true);
    }
    expect(ended).toHaveBeenCalledTimes(16);
    await engine.dispose();
    expect(p.context.close).toHaveBeenCalledOnce();
  });

  it('places notes and rhythm intervals on the audio clock and ends after all voices', async () => {
    const p = platform();
    const ended = vi.fn();
    const engine = new GameAudio(ended);
    await engine.play(rhythmSound([1, 2]));
    expect(
      p.nodes.map((node) => node.oscillator.start.mock.calls[0]?.[0]),
    ).toEqual([10.03, 10.53, 11.53]);
    p.nodes[2]!.oscillator.onended?.();
    expect(ended).not.toHaveBeenCalled();
    p.nodes[1]!.oscillator.onended?.();
    p.nodes[0]!.oscillator.onended?.();
    expect(ended).toHaveBeenCalledOnce();
    expect(
      sequenceSound(memorySounds.slice(0, 2)).notes.map((note) => note.start),
    ).toEqual([0, 0.55]);
    await engine.dispose();
  });

  it('cancels pending resume and ignores stale callbacks after stopping', async () => {
    const p = platform();
    const pending = deferred<void>();
    p.context.resume.mockReturnValueOnce(pending.promise);
    const ended = vi.fn();
    const engine = new GameAudio(ended);
    const playing = engine.play(animalSounds[0]!);
    engine.stop();
    pending.resolve();
    await playing;
    expect(p.context.createOscillator).not.toHaveBeenCalled();
    await engine.play(animalSounds[0]!);
    const oldEnded = p.nodes[0]!.oscillator.onended;
    engine.stop();
    oldEnded?.();
    expect(ended).not.toHaveBeenCalled();
    expect(p.nodes.every((node) => node.oscillator.onended === null)).toBe(
      true,
    );
    await engine.dispose();
  });

  it('fails cleanly when audio is unsupported or cue data is invalid', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const engine = new GameAudio(vi.fn());
    await expect(engine.play(animalSounds[0]!)).rejects.toThrow(
      'Web Audio unavailable',
    );
    await expect(
      engine.play({
        id: 'bad',
        label: '',
        description: '',
        notes: [{ frequency: NaN, start: 0, duration: 0.2 }],
      }),
    ).rejects.toThrow('Invalid sound');
    await engine.dispose();
  });
});

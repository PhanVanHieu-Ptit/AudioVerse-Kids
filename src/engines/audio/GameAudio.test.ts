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
    decodeAudioData: vi.fn(async () => ({ duration: 3 }) as AudioBuffer),
    createBufferSource: vi.fn(() => ({
      buffer: null as AudioBuffer | null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as (() => void) | null,
    })),
  };
  const constructor = vi.fn(function () {
    return context;
  });
  vi.stubGlobal('AudioContext', constructor);
  return { context, nodes, constructor };
}
afterEach(() => vi.unstubAllGlobals());

describe('game audio synthesis', () => {
  it('synthesizes every instrument cue without fetching any file', async () => {
    const p = platform();
    const ended = vi.fn();
    const engine = new GameAudio(ended);
    expect(p.constructor).not.toHaveBeenCalled();
    for (const sound of instrumentSounds) {
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
    expect(ended).toHaveBeenCalledTimes(8);
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
    const playing = engine.play(memorySounds[0]!);
    engine.stop();
    pending.resolve();
    await playing;
    expect(p.context.createOscillator).not.toHaveBeenCalled();
    await engine.play(memorySounds[0]!);
    const oldEnded = p.nodes[0]!.oscillator.onended;
    engine.stop();
    oldEnded?.();
    expect(ended).not.toHaveBeenCalled();
    expect(p.nodes.every((node) => node.oscillator.onended === null)).toBe(
      true,
    );
    await engine.dispose();
  });

  it('plays all real animal recordings without the quiet synthesis envelope and caches replays', async () => {
    const p = platform();
    const fetch = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }));
    vi.stubGlobal('fetch', fetch);
    const ended = vi.fn();
    const engine = new GameAudio(ended);
    for (const sound of animalSounds) {
      await engine.play(sound);
      expect(fetch).toHaveBeenLastCalledWith(sound.audioSrc, {
        signal: expect.any(AbortSignal),
      });
      const source = p.context.createBufferSource.mock.results.at(-1)!.value;
      expect(source.buffer).toEqual({ duration: 3 });
      expect(source.connect).toHaveBeenCalledWith(p.context.destination);
      expect(source.start).toHaveBeenCalledOnce();
      source.onended?.();
      expect(source.disconnect).toHaveBeenCalledOnce();
      await engine.play(sound);
    }
    expect(fetch).toHaveBeenCalledTimes(8);
    expect(p.context.decodeAudioData).toHaveBeenCalledTimes(8);
    expect(p.context.createOscillator).not.toHaveBeenCalled();
    expect(ended).toHaveBeenCalledTimes(8);
    await engine.dispose();
    expect(p.context.close).toHaveBeenCalledOnce();
  });

  it('aborts recording loads and never starts audio after a cancelled decode', async () => {
    const p = platform();
    const pending = deferred<AudioBuffer>();
    const fetch = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }));
    vi.stubGlobal('fetch', fetch);
    p.context.decodeAudioData.mockReturnValueOnce(pending.promise);
    const engine = new GameAudio(vi.fn());
    const playing = engine.play(animalSounds[0]!);
    await vi.waitFor(() =>
      expect(p.context.decodeAudioData).toHaveBeenCalledOnce(),
    );
    const signal = (
      fetch.mock.calls[0] as unknown as [string, { signal: AbortSignal }]
    )[1].signal;
    engine.stop();
    expect(signal.aborted).toBe(true);
    pending.resolve({ duration: 3 } as AudioBuffer);
    await playing;
    expect(p.context.createBufferSource).not.toHaveBeenCalled();
    await engine.dispose();
  });

  it('stops a recording and ignores its stale ended callback', async () => {
    const p = platform();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
      })),
    );
    const ended = vi.fn();
    const engine = new GameAudio(ended);
    await engine.play(animalSounds[0]!);
    const source = p.context.createBufferSource.mock.results[0]!.value;
    const oldEnded = source.onended;
    engine.stop();
    expect(source.stop).toHaveBeenCalledOnce();
    expect(source.onended).toBeNull();
    expect(source.disconnect).toHaveBeenCalledOnce();
    oldEnded?.();
    expect(ended).not.toHaveBeenCalled();
    await engine.dispose();
  });

  it('reports missing or undecodable recordings without playing synthetic substitutes', async () => {
    const p = platform();
    const fetch = vi.fn(async () => ({
      ok: false,
      arrayBuffer: async () => new ArrayBuffer(8),
    }));
    vi.stubGlobal('fetch', fetch);
    const engine = new GameAudio(vi.fn());
    await expect(engine.play(animalSounds[0]!)).rejects.toThrow(
      'Recording unavailable',
    );
    fetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    });
    p.context.decodeAudioData.mockRejectedValueOnce(new Error('Bad recording'));
    await expect(engine.play(animalSounds[0]!)).rejects.toThrow(
      'Bad recording',
    );
    expect(p.context.createOscillator).not.toHaveBeenCalled();
    expect(p.context.createBufferSource).not.toHaveBeenCalled();
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

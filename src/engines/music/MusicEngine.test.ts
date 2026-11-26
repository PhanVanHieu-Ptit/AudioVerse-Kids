import { afterEach, describe, expect, it, vi } from 'vitest';
import { deferred } from '@/test/audioTestUtils';
import { musicAudioPlatform } from '@/test/musicAudioPlatform';
import {
  InstrumentLibrary,
  isMusicStep,
  musicNotes,
  type MusicStep,
} from './InstrumentLibrary';
import { MusicEngine } from './MusicEngine';

const note: MusicStep = { note: 'C4', instrument: 'piano', beats: 1 };
afterEach(() => vi.unstubAllGlobals());

describe('MusicEngine and InstrumentLibrary', () => {
  it('is silent until a gesture, synthesizes every instrument locally and frees resources', async () => {
    const p = musicAudioPlatform();
    const engine = new MusicEngine();
    const ended = vi.fn();
    expect(p.constructor).not.toHaveBeenCalled();
    for (const instrument of InstrumentLibrary) {
      await engine.play([{ ...note, instrument: instrument.id }], 100, ended);
      p.end();
    }
    expect(ended).toHaveBeenCalledTimes(4);
    expect(
      p.oscillators.every((node) => node.disconnect.mock.calls.length === 1),
    ).toBe(true);
    expect(p.oscillators.map((node) => node.type)).toEqual([
      'triangle',
      'sine',
      'sine',
      'sine',
    ]);
    expect(new Set(musicNotes.map((n) => n.key)).size).toBe(8);
    await engine.dispose();
    expect(p.context.close).toHaveBeenCalledOnce();
    await expect(engine.play([note])).rejects.toThrow('disposed');
  });

  it('schedules notes, rests and tempo on the audio clock with silent gaps', async () => {
    const p = musicAudioPlatform();
    const engine = new MusicEngine();
    const ended = vi.fn();
    await engine.play(
      [
        note,
        { ...note, note: null, beats: 0.5 },
        { ...note, note: 'E4', beats: 2 },
      ],
      120,
      ended,
    );
    expect(p.oscillators.map((n) => n.start.mock.calls[0]?.[0])).toEqual([
      10.025, 10.525, 10.775,
    ]);
    expect(p.oscillators.map((n) => n.stop.mock.calls[0]?.[0])).toEqual([
      10.525, 10.775, 11.775,
    ]);
    expect(
      p.gains[2]!.gain.linearRampToValueAtTime.mock.calls.every(
        (call) => call[0] === 0,
      ),
    ).toBe(true);
    p.end();
    expect(ended).toHaveBeenCalledOnce();
    await engine.dispose();
  });

  it('uses a quiet default, caps volume and fades volume changes and replacement notes', async () => {
    const p = musicAudioPlatform();
    const engine = new MusicEngine();
    await engine.play([note]);
    expect(p.gains[0]!.gain.setValueAtTime).toHaveBeenLastCalledWith(0.036, 10);
    engine.setVolume(100);
    expect(p.gains[0]!.gain.setTargetAtTime).toHaveBeenLastCalledWith(
      0.12,
      10,
      0.02,
    );
    engine.setVolume(-1);
    expect(p.gains[0]!.gain.setTargetAtTime).toHaveBeenLastCalledWith(
      0,
      10,
      0.02,
    );
    engine.setVolume(NaN);
    expect(p.gains[0]!.gain.setTargetAtTime).toHaveBeenCalledTimes(2);
    const ended = vi.fn();
    await engine.play([note], 100, ended);
    const stale = p.oscillators.at(-1)!.onended;
    await engine.play([note]);
    expect(p.oscillators[1]!.stop).toHaveBeenLastCalledWith(10.015);
    expect(p.oscillators[2]!.start).toHaveBeenLastCalledWith(10.025);
    stale?.();
    expect(ended).not.toHaveBeenCalled();
    await engine.dispose();
  });

  it.each(['stop', 'dispose'] as const)(
    'cancels pending resume on %s',
    async (action) => {
      const p = musicAudioPlatform();
      const pending = deferred<void>();
      p.context.resume.mockReturnValueOnce(pending.promise);
      const engine = new MusicEngine();
      const playing = engine.play([note]);
      await engine[action]();
      pending.resolve();
      expect(await playing).toBe(false);
      expect(p.oscillators).toHaveLength(0);
      await engine.dispose();
    },
  );

  it('only starts the latest of concurrent play requests', async () => {
    const p = musicAudioPlatform();
    const pending = deferred<void>();
    p.context.resume.mockReturnValueOnce(pending.promise);
    const engine = new MusicEngine();
    const old = engine.play([note]);
    expect(await engine.play([{ ...note, note: 'D4' }])).toBe(true);
    pending.resolve();
    expect(await old).toBe(false);
    expect(p.oscillators).toHaveLength(1);
    expect(p.oscillators[0]!.frequency.setValueAtTime).toHaveBeenCalledWith(
      293.66,
      10.025,
    );
    await engine.dispose();
  });

  it('rejects malformed input before creating audio, and reports unsupported browsers', async () => {
    const p = musicAudioPlatform();
    const engine = new MusicEngine();
    for (const steps of [
      [],
      Array.from({ length: 65 }, () => note),
      [{ ...note, note: 'bad' }],
      [{ ...note, beats: Infinity }],
      [{ ...note, instrument: 'unknown' }],
    ]) {
      await expect(engine.play(steps as MusicStep[])).rejects.toThrow(
        'Invalid',
      );
    }
    for (const tempo of [NaN, 0, 59, 161])
      await expect(engine.play([note], tempo)).rejects.toThrow('Invalid');
    expect(isMusicStep(null)).toBe(false);
    expect(p.constructor).not.toHaveBeenCalled();
    vi.stubGlobal('AudioContext', undefined);
    await expect(engine.play([note])).rejects.toThrow('Web Audio unavailable');
    await engine.dispose();
  });

  it('cleans up a partial scheduling failure and can retry', async () => {
    const p = musicAudioPlatform();
    p.context.createOscillator.mockImplementationOnce(() => {
      throw new Error('Device interrupted');
    });
    const engine = new MusicEngine();
    await expect(engine.play([note])).rejects.toThrow('Device interrupted');
    expect(await engine.play([note])).toBe(true);
    await engine.dispose();
  });
});

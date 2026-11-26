import {
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_TEMPO,
  InstrumentLibrary,
  isMusicStep,
  MAX_MUSIC_STEPS,
  musicNotes,
  type MusicStep,
} from './InstrumentLibrary';

const MAX_GAIN = 0.12;
const RELEASE = 0.015;
type Voice = { oscillator: OscillatorNode; envelope: GainNode };

/** Lazy, monophonic Web Audio synthesizer. Scheduling uses the audio clock.
 * Replacement fades finish before the next phrase starts; repeated taps cannot stack.
 * The gain cap is a digital limit, not a guarantee about a device's speaker level.
 */
export class MusicEngine {
  private context: AudioContext | undefined;
  private master: GainNode | undefined;
  private voices = new Set<Voice>();
  private revision = 0;
  private volume = DEFAULT_MUSIC_VOLUME;
  private finish: (() => void) | undefined;
  private disposed = false;

  setVolume(value: number) {
    if (!Number.isFinite(value)) return;
    this.volume = Math.min(1, Math.max(0, value));
    if (this.context && this.master) {
      const now = this.context.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.volume * MAX_GAIN, now, 0.02);
    }
  }

  async play(
    steps: readonly MusicStep[],
    tempo = DEFAULT_TEMPO,
    onEnded?: () => void,
  ) {
    this.stop();
    if (this.disposed) throw new Error('Music engine disposed');
    if (
      !steps.length ||
      steps.length > MAX_MUSIC_STEPS ||
      !steps.every(isMusicStep) ||
      !Number.isFinite(tempo) ||
      tempo < 60 ||
      tempo > 160
    ) {
      throw new Error('Invalid music sequence');
    }
    if (typeof AudioContext === 'undefined')
      throw new Error('Web Audio unavailable');
    const revision = this.revision;
    // Snapshot caller-owned data before resuming the context.
    const sequence = steps.map((step) => ({ ...step }));
    this.context ??= new AudioContext();
    const context = this.context;
    await context.resume();
    if (revision !== this.revision || this.disposed) return false;
    this.master ??= context.createGain();
    this.master.gain.setValueAtTime(
      this.volume * MAX_GAIN,
      context.currentTime,
    );
    this.master.disconnect();
    this.master.connect(context.destination);
    this.finish = onEnded;
    const origin = context.currentTime + 0.025;
    let offset = 0;
    try {
      for (const [index, step] of sequence.entries()) {
        const instrument = InstrumentLibrary.find(
          (i) => i.id === step.instrument,
        )!;
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        const voice = { oscillator, envelope };
        this.voices.add(voice);
        const start = origin + offset;
        const slot = (step.beats * 60) / tempo;
        const end = start + slot;
        const soundEnd = start + slot * 0.85;
        const frequency =
          musicNotes.find((n) => n.id === step.note)?.frequency ?? 261.63;
        oscillator.type = instrument.wave;
        oscillator.frequency.setValueAtTime(
          instrument.id === 'drum' ? frequency / 3 : frequency,
          start,
        );
        if (instrument.id === 'drum')
          oscillator.frequency.exponentialRampToValueAtTime(55, soundEnd);
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(
          step.note === null ? 0 : 1,
          start + instrument.attack,
        );
        envelope.gain.linearRampToValueAtTime(
          step.note === null ? 0 : instrument.decay,
          soundEnd - 0.025,
        );
        envelope.gain.linearRampToValueAtTime(0, soundEnd);
        oscillator.connect(envelope).connect(this.master);
        oscillator.onended = () => {
          oscillator.disconnect();
          envelope.disconnect();
          this.voices.delete(voice);
          if (revision === this.revision && index === sequence.length - 1) {
            const finish = this.finish;
            this.finish = undefined;
            finish?.();
          }
        };
        oscillator.start(start);
        // Silent oscillators also time rests and the final gap without JS timers.
        oscillator.stop(end);
        offset += slot;
      }
      return true;
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  stop() {
    this.revision++;
    this.finish = undefined;
    const now = this.context?.currentTime ?? 0;
    for (const voice of this.voices) {
      voice.envelope.gain.cancelScheduledValues(now);
      voice.envelope.gain.setTargetAtTime(0, now, 0.003);
      try {
        voice.oscillator.stop(now + RELEASE);
      } catch {
        /* Already ended. */
      }
    }
  }

  async dispose() {
    this.stop();
    this.disposed = true;
    for (const { oscillator, envelope } of this.voices) {
      oscillator.onended = null;
      oscillator.disconnect();
      envelope.disconnect();
    }
    this.voices.clear();
    this.master?.disconnect();
    const context = this.context;
    this.context = undefined;
    this.master = undefined;
    if (context && context.state !== 'closed') await context.close();
  }
}

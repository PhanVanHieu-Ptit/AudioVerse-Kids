import type { GameSound, SoundNote } from '@/types/game';
import { rhythmBeat } from '@/content/gameSounds';

export function sequenceSound(sounds: readonly GameSound[]): GameSound {
  let offset = 0;
  const notes: SoundNote[] = [];
  for (const sound of sounds) {
    notes.push(
      ...sound.notes.map((note) => ({ ...note, start: note.start + offset })),
    );
    offset +=
      Math.max(...sound.notes.map((note) => note.start + note.duration)) + 0.25;
  }
  return {
    id: 'sequence',
    label: 'Chuỗi âm thanh',
    description: sounds.map((s) => s.label).join(' → '),
    notes,
  };
}

export function rhythmSound(intervals: readonly number[]): GameSound {
  let start = 0;
  const notes = [...rhythmBeat.notes];
  for (const interval of intervals) {
    start += interval * 0.5;
    notes.push(...rhythmBeat.notes.map((note) => ({ ...note, start })));
  }
  return { ...rhythmBeat, id: 'rhythm', notes };
}

/** Schedules whole cues on the Web Audio clock, so timing does not drift with timers. */
export class GameAudio {
  private context: AudioContext | undefined;
  private nodes: { oscillator: OscillatorNode; envelope: GainNode }[] = [];
  private revision = 0;

  constructor(private readonly ended: () => void) {}

  async play(sound: GameSound) {
    this.stop();
    if (
      !sound.notes.length ||
      sound.notes.some(
        (n) =>
          !Number.isFinite(n.frequency) ||
          n.frequency < 20 ||
          n.frequency > 20000 ||
          !Number.isFinite(n.start) ||
          n.start < 0 ||
          !Number.isFinite(n.duration) ||
          n.duration < 0.06 ||
          n.duration > 10 ||
          (n.endFrequency !== undefined &&
            (!Number.isFinite(n.endFrequency) ||
              n.endFrequency < 20 ||
              n.endFrequency > 20000)),
      )
    )
      throw new Error('Invalid sound');
    if (typeof AudioContext === 'undefined')
      throw new Error('Web Audio unavailable');
    const revision = this.revision;
    this.context ??= new AudioContext();
    const context = this.context;
    await context.resume();
    if (revision !== this.revision) return;
    const origin = context.currentTime + 0.03;
    let remaining = sound.notes.length;
    try {
      for (const note of sound.notes) {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        this.nodes.push({ oscillator, envelope });
        oscillator.type = note.wave ?? 'sine';
        const start = origin + note.start;
        const end = start + note.duration;
        oscillator.frequency.setValueAtTime(note.frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(
          note.endFrequency ?? note.frequency,
          end,
        );
        const gain = Math.min(0.06, Math.max(0, note.gain ?? 0.045));
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(gain, start + 0.02);
        envelope.gain.exponentialRampToValueAtTime(0.001, end - 0.02);
        envelope.gain.linearRampToValueAtTime(0, end);
        oscillator.connect(envelope).connect(context.destination);
        oscillator.onended = () => {
          oscillator.disconnect();
          envelope.disconnect();
          if (revision === this.revision && --remaining === 0) {
            this.nodes = [];
            this.ended();
          }
        };
        oscillator.start(start);
        oscillator.stop(end);
      }
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  stop() {
    this.revision++;
    for (const { oscillator, envelope } of this.nodes) {
      oscillator.onended = null;
      try {
        oscillator.stop();
      } catch {
        /* A context may already be closed. */
      }
      oscillator.disconnect();
      envelope.disconnect();
    }
    this.nodes = [];
  }

  async dispose() {
    this.stop();
    const context = this.context;
    this.context = undefined;
    if (context && context.state !== 'closed') await context.close();
  }
}

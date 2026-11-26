export const musicNotes = [
  { id: 'C4', label: 'Đô', frequency: 261.63, key: 'a' },
  { id: 'D4', label: 'Rê', frequency: 293.66, key: 's' },
  { id: 'E4', label: 'Mi', frequency: 329.63, key: 'd' },
  { id: 'F4', label: 'Fa', frequency: 349.23, key: 'f' },
  { id: 'G4', label: 'Sol', frequency: 392, key: 'g' },
  { id: 'A4', label: 'La', frequency: 440, key: 'h' },
  { id: 'B4', label: 'Si', frequency: 493.88, key: 'j' },
  { id: 'C5', label: 'Đô cao', frequency: 523.25, key: 'k' },
] as const;

export type NoteId = (typeof musicNotes)[number]['id'];
export type InstrumentId = 'piano' | 'flute' | 'bell' | 'drum';
export type Beats = 0.5 | 1 | 2;
export interface MusicStep {
  note: NoteId | null;
  instrument: InstrumentId;
  beats: Beats;
}
export interface Instrument {
  readonly id: InstrumentId;
  readonly name: string;
  readonly family: string;
  readonly description: string;
  readonly wave: OscillatorType;
  readonly attack: number;
  readonly decay: number;
}

/** Original synthesized timbres, inspired by instruments; no sampled recordings. */
export const InstrumentLibrary: readonly Instrument[] = [
  {
    id: 'piano',
    name: 'Đàn phím',
    family: 'Phím',
    description: 'Âm mềm, rõ lúc đầu rồi nhỏ dần, gợi tiếng đàn phím.',
    wave: 'triangle',
    attack: 0.025,
    decay: 0.18,
  },
  {
    id: 'flute',
    name: 'Sáo',
    family: 'Hơi',
    description: 'Âm tròn, êm và ngân đều, gợi tiếng sáo thổi.',
    wave: 'sine',
    attack: 0.045,
    decay: 0.7,
  },
  {
    id: 'bell',
    name: 'Chuông',
    family: 'Gõ',
    description: 'Âm cao, trong và nhỏ dần, gợi tiếng chuông nhẹ.',
    wave: 'sine',
    attack: 0.015,
    decay: 0.08,
  },
  {
    id: 'drum',
    name: 'Trống',
    family: 'Gõ',
    description:
      'Tiếng bụp trầm, ngắn. Các phím tạo tiếng trống cao thấp khác nhau.',
    wave: 'sine',
    attack: 0.012,
    decay: 0.025,
  },
];

export const MAX_MUSIC_STEPS = 64;
export const DEFAULT_TEMPO = 100;
export const DEFAULT_MUSIC_VOLUME = 0.3;

export function isMusicStep(value: unknown): value is MusicStep {
  if (!value || typeof value !== 'object') return false;
  const step = value as Partial<MusicStep>;
  return (
    (step.note === null || musicNotes.some((n) => n.id === step.note)) &&
    InstrumentLibrary.some((i) => i.id === step.instrument) &&
    (step.beats === 0.5 || step.beats === 1 || step.beats === 2)
  );
}

export function stepLabel(step: MusicStep) {
  const note = musicNotes.find((n) => n.id === step.note)?.label ?? 'Nghỉ';
  const instrument = InstrumentLibrary.find(
    (i) => i.id === step.instrument,
  )?.name;
  return `${note}, ${instrument}, ${step.beats} phách`;
}

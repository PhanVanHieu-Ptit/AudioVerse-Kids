import type { GameSound, SoundNote } from '../types/game';

const note = (
  frequency: number,
  start = 0,
  duration = 0.3,
  wave: OscillatorType = 'sine',
  endFrequency = frequency,
): SoundNote => ({ frequency, start, duration, wave, endFrequency });

/** Deliberately stylized Web Audio imitations, never presented as field recordings. */
export const animalSounds: readonly GameSound[] = [
  {
    id: 'cat',
    label: 'Mèo',
    description: 'Meo… meo… Hai tiếng luyến cao rồi hạ xuống.',
    notes: [
      note(700, 0, 0.6, 'triangle', 350),
      note(760, 0.8, 0.6, 'triangle', 380),
    ],
  },
  {
    id: 'dog',
    label: 'Chó',
    description: 'Gâu! Gâu! Hai tiếng ngắn, đục và mạnh.',
    notes: [
      note(240, 0, 0.17, 'sawtooth', 100),
      note(240, 0.4, 0.17, 'sawtooth', 100),
    ],
  },
  {
    id: 'cow',
    label: 'Bò',
    description: 'Ò… Một tiếng trầm ngân dài.',
    notes: [note(120, 0, 1.3, 'sawtooth', 90)],
  },
  {
    id: 'duck',
    label: 'Vịt',
    description: 'Cạp, cạp, cạp. Ba tiếng khàn ngắn.',
    notes: [
      note(420, 0, 0.18, 'square', 260),
      note(420, 0.3, 0.18, 'square', 260),
      note(420, 0.6, 0.18, 'square', 260),
    ],
  },
  {
    id: 'rooster',
    label: 'Gà trống',
    description: 'Ò ó o… Tiếng gáy đi từ thấp lên cao rồi kéo dài.',
    notes: [
      note(350, 0, 0.2, 'triangle'),
      note(500, 0.25, 0.2, 'triangle'),
      note(750, 0.5, 0.8, 'triangle', 600),
    ],
  },
  {
    id: 'bird',
    label: 'Chim',
    description: 'Chíp chíp! Bốn tiếng rất cao, thanh và nhanh.',
    notes: Array.from({ length: 4 }, (_, i) =>
      note(1800, i * 0.2, 0.12, 'sine', 2400),
    ),
  },
  {
    id: 'frog',
    label: 'Ếch',
    description: 'Ộp… ộp… Ba tiếng trầm bật lên.',
    notes: Array.from({ length: 3 }, (_, i) =>
      note(100, i * 0.45, 0.25, 'square', 220),
    ),
  },
  {
    id: 'bee',
    label: 'Ong',
    description: 'Vù… Tiếng vo ve đều và liên tục.',
    notes: [
      note(180, 0, 1.4, 'sawtooth', 200),
      { ...note(183, 0, 1.4, 'sawtooth', 203), gain: 0.02 },
    ],
  },
];

export const instrumentSounds: readonly GameSound[] = [
  {
    id: 'piano',
    label: 'Đàn piano',
    description: 'Tiếng phím đàn tròn, vang rồi nhỏ dần.',
    notes: [
      note(523, 0, 0.7),
      { ...note(1046, 0, 0.45), gain: 0.015 },
      note(659, 0.8, 0.7),
    ],
  },
  {
    id: 'guitar',
    label: 'Đàn ghi-ta',
    description: 'Tiếng gảy dây ấm, từng nốt tắt nhanh.',
    notes: [
      note(196, 0, 0.35, 'triangle'),
      note(247, 0.15, 0.35, 'triangle'),
      note(294, 0.3, 0.35, 'triangle'),
    ],
  },
  {
    id: 'flute',
    label: 'Sáo',
    description: 'Làn hơi trong và cao, nối hai nốt mềm mại.',
    notes: [note(880, 0, 0.7), note(988, 0.75, 0.7)],
  },
  {
    id: 'violin',
    label: 'Đàn vi-ô-lông',
    description: 'Tiếng kéo dây sáng, ngân dài và liền nhau.',
    notes: [note(440, 0, 1.2, 'sawtooth', 466)],
  },
  {
    id: 'drum',
    label: 'Trống',
    description: 'Tùng, tùng. Hai tiếng gõ trầm, tắt rất nhanh.',
    notes: [note(160, 0, 0.2, 'sine', 45), note(160, 0.55, 0.2, 'sine', 45)],
  },
  {
    id: 'bell',
    label: 'Chuông',
    description: 'Kính coong… Tiếng kim loại cao ngân vang.',
    notes: [
      note(1046, 0, 1.3),
      { ...note(1601, 0, 1.1), gain: 0.025 },
      { ...note(2170, 0, 0.8), gain: 0.015 },
    ],
  },
  {
    id: 'trumpet',
    label: 'Kèn trom-pét',
    description: 'Te te tè! Tiếng kèn đồng sáng và dứt khoát.',
    notes: [
      note(523, 0, 0.22, 'square'),
      note(659, 0.3, 0.22, 'square'),
      note(784, 0.6, 0.5, 'square'),
    ],
  },
  {
    id: 'xylophone',
    label: 'Đàn mộc cầm',
    description: 'Cốc cốc cốc. Ba thanh gỗ gõ với cao độ tăng dần.',
    notes: [
      note(660, 0, 0.14, 'triangle'),
      note(880, 0.3, 0.14, 'triangle'),
      note(1100, 0.6, 0.14, 'triangle'),
    ],
  },
];

export const memorySounds: readonly GameSound[] = [
  {
    id: 'do',
    label: 'Đô',
    description: 'Nốt Đô, thấp nhất trong bộ bốn nốt.',
    notes: [note(262)],
  },
  {
    id: 'mi',
    label: 'Mi',
    description: 'Nốt Mi, cao hơn Đô.',
    notes: [note(330)],
  },
  {
    id: 'sol',
    label: 'Sol',
    description: 'Nốt Sol, cao hơn Mi.',
    notes: [note(392)],
  },
  {
    id: 'do-high',
    label: 'Đô cao',
    description: 'Nốt Đô cao, cao nhất trong bộ bốn nốt.',
    notes: [note(524)],
  },
];

export const rhythmBeat: GameSound = {
  id: 'beat',
  label: 'Tiếng gõ',
  description: 'Một tiếng gõ trống ngắn.',
  notes: [note(180, 0, 0.12, 'sine', 60)],
};

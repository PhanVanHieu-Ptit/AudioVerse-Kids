import type { GameSound, SoundNote } from '../types/game';

const note = (
  frequency: number,
  start = 0,
  duration = 0.3,
  wave: OscillatorType = 'sine',
  endFrequency = frequency,
): SoundNote => ({ frequency, start, duration, wave, endFrequency });

const animalAudioBase = `${import.meta.env?.BASE_URL ?? '/'}audio/animals/`;

/** Real recordings; source credits and processing live alongside the bundled MP3s. */
export const animalSounds: readonly GameSound[] = [
  {
    id: 'cat',
    label: 'Mèo',
    description: 'Meo… meo… Tiếng kêu luyến cao rồi hạ xuống.',
  },
  {
    id: 'dog',
    label: 'Chó',
    description: 'Gâu! Gâu! Tiếng sủa ngắn, đục và mạnh.',
  },
  { id: 'cow', label: 'Bò', description: 'Ò… Tiếng kêu trầm ngân dài.' },
  {
    id: 'duck',
    label: 'Vịt',
    description: 'Cạp, cạp… Những tiếng kêu khàn nối tiếp nhau.',
  },
  {
    id: 'rooster',
    label: 'Gà trống',
    description: 'Ò ó o… Tiếng gáy vang, lên cao rồi kéo dài.',
  },
  {
    id: 'bird',
    label: 'Chim',
    description: 'Chíp chíp! Tiếng hót cao, trong và líu lo.',
  },
  {
    id: 'frog',
    label: 'Ếch',
    description: 'Ộp… ộp… Những tiếng kêu trầm, ngắt quãng.',
  },
  {
    id: 'bee',
    label: 'Ong',
    description: 'Vù… Tiếng cánh vo ve, rền liên tục.',
  },
].map((sound) => ({
  ...sound,
  audioSrc: `${animalAudioBase}${sound.id}.v1.mp3`,
  notes: [],
}));

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

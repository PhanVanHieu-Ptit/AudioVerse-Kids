export type Pitch = 'high' | 'low';

export interface ToneRound {
  frequency: number;
  answer: Pitch;
  description: string;
}

export interface ToneGameDefinition {
  id: string;
  title: string;
  description: string;
  instructions: string;
  durationSeconds: number;
  gain: number;
  rounds: readonly ToneRound[];
}

/** Real synthesized tones: no audio files or network requests are implied. */
export const games: readonly ToneGameDefinition[] = [
  {
    id: 'am-cao-am-tram',
    title: 'Âm cao hay âm trầm?',
    description:
      'Lắng nghe và nhận biết ba nốt nhạc bằng âm thanh hoặc mô tả bằng chữ.',
    instructions:
      'Bấm Nghe nốt nhạc, rồi chọn âm cao hoặc âm trầm. Em có thể nghe lại hoặc mở mô tả bằng chữ. Không giới hạn thời gian và không cần micrô. Hãy bắt đầu với âm lượng thiết bị nhỏ.',
    durationSeconds: 0.8,
    gain: 0.08,
    rounds: [
      {
        frequency: 660,
        answer: 'high',
        description: 'Một nốt nhạc cao, thanh và trong.',
      },
      {
        frequency: 220,
        answer: 'low',
        description: 'Một nốt nhạc trầm, thấp và ấm.',
      },
      {
        frequency: 880,
        answer: 'high',
        description: 'Một nốt nhạc cao, thanh hơn nốt trầm trước đó.',
      },
    ],
  },
];

export const pitchOptions: readonly { value: Pitch; label: string }[] = [
  { value: 'high', label: 'Âm cao' },
  { value: 'low', label: 'Âm trầm' },
];

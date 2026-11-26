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
  guidanceAudioSrc?: string;
  durationSeconds: number;
  gain: number;
  rounds: readonly ToneRound[];
}

/** Real synthesized tones: no audio files or network requests are implied. */
export const games: readonly ToneGameDefinition[] = [
  {
    id: 'am-cao-am-tram',
    guidanceAudioSrc: `${import.meta.env?.BASE_URL ?? '/'}audio/guidance/am-cao-am-tram.v2.mp3`,
    title: 'Âm cao hay âm trầm?',
    description:
      'Lắng nghe và nhận biết ba nốt nhạc bằng âm thanh hoặc mô tả bằng chữ.',
    instructions:
      'Mình cùng nghe xem nốt nhạc này cao hay trầm nhé! Trước tiên, em để âm lượng nhỏ, vừa nghe thôi. Rồi bấm Nghe nốt nhạc và chọn Âm cao hoặc Âm trầm. Nếu chưa chắc, em cứ nghe lại hoặc mở mô tả bằng chữ để tìm gợi ý. Cứ thong thả nhé, trò chơi không tính giờ và em không cần dùng micrô.',
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

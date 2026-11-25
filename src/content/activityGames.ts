import type {
  ActivityGameDefinition,
  ChoiceChallenge,
  GameChallenge,
  GameLevel,
  GameSound,
} from '../types/game';
import { animalSounds, instrumentSounds, memorySounds } from './gameSounds.ts';
import {
  adventureQuestions,
  knowledgeQuestions,
  mathQuestions,
  type QuestionRow,
} from './gameQuestions.ts';

const audioBase = `${import.meta.env?.BASE_URL ?? '/'}audio/guidance/`;
export const gameLevels = [
  { value: 1, label: 'Cấp độ 1 · Khởi động' },
  { value: 2, label: 'Cấp độ 2 · Khám phá' },
  { value: 3, label: 'Cấp độ 3 · Thử tài' },
] as const;
const levelAt = (i: number): GameLevel => (Math.floor(i / 8) + 1) as GameLevel;
const rotate = <T>(items: readonly T[], offset: number): T[] => [
  ...items.slice(offset),
  ...items.slice(0, offset),
];

function listeningChallenges(
  id: string,
  sounds: readonly GameSound[],
): ChoiceChallenge[] {
  return Array.from({ length: 24 }, (_, i) => {
    const level = levelAt(i);
    // Each tier uses all eight timbres; later tiers transpose and shorten the cue.
    const source = sounds[(i * 3 + Math.floor(i / 8)) % sounds.length]!;
    const sound = {
      ...source,
      notes: source.notes.map((n) => ({
        ...n,
        frequency: n.frequency * (1 + (level - 1) * 0.06),
        endFrequency:
          (n.endFrequency ?? n.frequency) * (1 + (level - 1) * 0.06),
        duration: n.duration * (1 - (level - 1) * 0.12),
      })),
    };
    const alternatives = sounds.filter((s) => s.id !== source.id);
    const options = rotate(
      [
        source,
        ...rotate(alternatives, i % alternatives.length).slice(0, level),
      ],
      i % (level + 1),
    ).map((s) => ({ id: s.id, label: s.label }));
    return {
      id: `${id}-${i + 1}`,
      level,
      mode: 'choice',
      prompt:
        id === 'doan-tieng-dong-vat'
          ? 'Âm thanh mô phỏng này gợi tiếng con vật nào?'
          : 'Âm sắc mô phỏng này gợi nhạc cụ nào?',
      description: sound.description,
      explanation: `Đó là ${source.label.toLocaleLowerCase('vi')}. ${sound.description}`,
      sound,
      options,
      answer: source.id,
    };
  });
}

function questions(
  id: string,
  rows: readonly QuestionRow[],
): ChoiceChallenge[] {
  return rows.map(([prompt, answer, wrong, other, explanation], i) => ({
    id: `${id}-${i + 1}`,
    level: levelAt(i),
    mode: 'choice',
    prompt,
    description: prompt,
    explanation,
    answer: 'answer',
    audioSrc: `${audioBase}${id}-${i + 1}.v1.mp3`,
    options: rotate(
      [
        { id: 'answer', label: answer },
        { id: 'wrong', label: wrong },
        { id: 'other', label: other },
      ],
      i % 3,
    ),
    ...(id === 'phieu-luu-giai-do'
      ? {
          chapter: ['Rừng Ngân Nga', 'Đảo Chuông', 'Đài Âm Thanh'][
            Math.floor(i / 8)
          ],
        }
      : {}),
  }));
}

const sequences = [
  [0, 1],
  [1, 2],
  [2, 0],
  [0, 2, 1],
  [1, 0, 2],
  [2, 1, 0],
  [0, 1, 0],
  [2, 0, 2],
  [0, 1, 2],
  [2, 3, 1],
  [1, 0, 3],
  [3, 2, 0, 1],
  [1, 3, 2, 0],
  [2, 1, 3, 2],
  [0, 2, 3, 1],
  [3, 0, 1, 3],
  [0, 3, 1, 2, 0],
  [1, 2, 3, 0, 2],
  [2, 0, 3, 1, 2],
  [3, 1, 0, 2, 3],
  [0, 2, 1, 3, 0, 1],
  [1, 3, 2, 0, 1, 2],
  [2, 1, 3, 0, 2, 3],
  [3, 0, 2, 1, 3, 2],
] as const;
const rhythms = [
  [1, 1],
  [2, 2],
  [1, 2],
  [2, 1],
  [1, 1, 2],
  [2, 1, 1],
  [1, 2, 1],
  [2, 2, 1],
  [1, 1, 1, 2],
  [2, 1, 2, 1],
  [1, 2, 2, 1],
  [1, 1, 2, 2],
  [2, 2, 1, 1],
  [1, 2, 1, 2],
  [2, 1, 1, 2],
  [1, 1, 2, 1],
  [1, 3, 1, 2, 1],
  [2, 1, 3, 1, 2],
  [3, 1, 2, 1, 1],
  [1, 2, 3, 2, 1],
  [1, 1, 3, 1, 2],
  [2, 3, 1, 1, 2],
  [3, 2, 1, 2, 1],
  [2, 1, 1, 3, 2],
] as const;

const definitions: readonly Omit<ActivityGameDefinition, 'guidanceAudioSrc'>[] =
  [
    {
      id: 'doan-tieng-dong-vat',
      title: 'Đoán tiếng động vật',
      description: 'Ghé khu rừng âm thanh và tìm người bạn đang cất tiếng.',
      instructions:
        'Bấm Nghe âm thanh, rồi chọn con vật phù hợp. Đây là âm tổng hợp mô phỏng, không phải bản thu động vật thật. Có thể mở mô tả bằng chữ và nghe lại tùy ý. Ba cấp độ có hai, ba rồi bốn lựa chọn.',
      challenges: listeningChallenges('doan-tieng-dong-vat', animalSounds),
    },
    {
      id: 'doan-nhac-cu',
      title: 'Đoán nhạc cụ',
      description: 'Khám phá tám âm sắc từ đàn piano đến tiếng trống.',
      instructions:
        'Nghe âm sắc mô phỏng rồi chọn nhạc cụ phù hợp. Âm thanh được tổng hợp trên thiết bị, không phải bản thu nhạc cụ thật. Có mô tả bằng chữ. Cấp độ cao hơn có nhiều lựa chọn và âm thanh ngắn hơn.',
      challenges: listeningChallenges('doan-nhac-cu', instrumentSounds),
    },
    {
      id: 'nho-chuoi-am-thanh',
      title: 'Nhớ chuỗi âm thanh',
      description: 'Lắng nghe, ghi nhớ rồi chơi lại từng nốt theo đúng thứ tự.',
      instructions:
        'Bấm Nghe chuỗi âm thanh. Sau đó chọn các nốt theo đúng thứ tự và bấm Kiểm tra chuỗi. Có thể xóa nốt cuối hoặc nhập lại. Các cấp độ tăng từ hai đến sáu nốt. Mở mô tả chữ nếu cần.',
      challenges: sequences.map((sequence, i): GameChallenge => ({
        id: `sequence-${i + 1}`,
        level: levelAt(i),
        mode: 'sequence',
        prompt: 'Em hãy chơi lại chuỗi nốt theo đúng thứ tự.',
        description: sequence.map((n) => memorySounds[n]!.label).join(' → '),
        explanation: 'Em đã nhớ đúng thứ tự các nốt!',
        palette: memorySounds.slice(0, i < 8 ? 3 : 4),
        sequence: sequence.map((n) => memorySounds[n]!.id),
      })),
    },
    {
      id: 'tim-cap-am-thanh',
      title: 'Tìm cặp âm thanh',
      description: 'Lật thẻ, nghe và tìm những âm thanh giống nhau.',
      instructions:
        'Chọn hai thẻ để nghe và tìm âm giống nhau. Nếu chưa khớp, bấm Úp hai thẻ để thử tiếp. Các cặp đã tìm được sẽ giữ mở. Ba cấp độ có hai, ba rồi bốn cặp. Có thể bật mô tả chữ cho thẻ đang mở. Không cần ghi nhớ vị trí bằng mắt.',
      challenges: Array.from({ length: 24 }, (_, i): GameChallenge => {
        const count = levelAt(i) + 1;
        const sounds = rotate(
          [...memorySounds, ...instrumentSounds],
          i % 12,
        ).slice(0, count);
        const cards = sounds.flatMap((sound, n) => [
          { id: `card-${n}-a`, sound },
          { id: `card-${n}-b`, sound },
        ]);
        // Seeded shuffle: reproducible boards across reloads, varied pair positions.
        let seed = i + 17;
        for (let j = cards.length - 1; j > 0; j--) {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          const k = seed % (j + 1);
          [cards[j], cards[k]] = [cards[k]!, cards[j]!];
        }
        return {
          id: `pairs-${i + 1}`,
          level: levelAt(i),
          mode: 'pairs',
          prompt: `Tìm đủ ${count} cặp âm thanh giống nhau.`,
          description: 'Chọn thẻ để nghe. Mỗi âm thanh xuất hiện ở hai thẻ.',
          explanation: 'Em đã tìm đủ các cặp trong bàn này!',
          cards,
        };
      }),
    },
    {
      id: 'do-vui-kien-thuc',
      title: 'Đố vui kiến thức',
      description: '24 câu hỏi về thiên nhiên, khoa học và cuộc sống quanh em.',
      instructions:
        'Bấm Nghe câu hỏi hoặc đọc câu hỏi, rồi chọn câu trả lời. Nếu chưa đúng, hãy thử lại. Mỗi đáp án đúng có lời giải thích. Ba cấp độ đi từ kiến thức quen thuộc đến khoa học và suy luận.',
      challenges: questions('do-vui-kien-thuc', knowledgeQuestions),
    },
    {
      id: 'toan-hoc-am-thanh',
      title: 'Toán học bằng âm thanh',
      description: 'Nghe bài toán, đếm nhịp và khám phá các phép tính.',
      instructions:
        'Bấm Nghe câu hỏi để nghe bài toán, rồi chọn kết quả. Em có thể nghe lại tùy ý hoặc đọc bằng chữ. Cấp một tập đếm, cộng và trừ; cấp hai có nhân và chia; cấp ba có bài toán nhiều bước. Không giới hạn thời gian.',
      challenges: questions('toan-hoc-am-thanh', mathQuestions),
    },
    {
      id: 'phieu-luu-giai-do',
      title: 'Phiêu lưu giải đố',
      description: 'Ba chuyến đi: Rừng Ngân Nga, Đảo Chuông và Đài Âm Thanh.',
      instructions:
        'Mỗi cấp độ là một chuyến phiêu lưu gồm tám chặng liên tiếp. Nghe hoặc đọc tình huống rồi chọn cách giải câu đố. Trả lời đúng để mở chặng tiếp và xem điều gì xảy ra. Nếu chưa đúng, em có thể thử lại.',
      challenges: questions('phieu-luu-giai-do', adventureQuestions),
    },
    {
      id: 'ghi-nho-nhip-dieu',
      title: 'Ghi nhớ nhịp điệu',
      description: 'Nghe tiếng trống và tái hiện những khoảng nghỉ ngắn, dài.',
      instructions:
        'Nghe mẫu nhịp rồi bấm nút Gõ nhịp, hoặc dùng Enter hay Space khi nút đó được chọn. Gõ đủ số tiếng rồi bấm Kiểm tra nhịp. Có thể gõ chậm hơn mẫu, chỉ cần giữ tỷ lệ khoảng cách. Chế độ Chọn khoảng nghỉ cho phép chọn Ngắn, Dài hoặc Rất dài thay cho gõ theo thời gian. Ba cấp độ tăng số nhịp và độ chính xác.',
      challenges: rhythms.map((intervals, i): GameChallenge => ({
        id: `rhythm-${i + 1}`,
        level: levelAt(i),
        mode: 'rhythm',
        prompt: `Nghe rồi gõ lại ${intervals.length + 1} tiếng theo mẫu.`,
        description: `Gõ một tiếng, sau đó ${intervals.map((n) => `nghỉ ${n === 1 ? 'ngắn' : n === 2 ? 'dài' : 'rất dài'} rồi gõ`).join(', ')}.`,
        explanation: 'Em đã ghi nhớ đúng các khoảng nghỉ!',
        intervals,
        tolerance: [0.35, 0.25, 0.18][levelAt(i) - 1]!,
      })),
    },
  ];

export const activityGames: readonly ActivityGameDefinition[] = definitions.map(
  (game) => ({
    ...game,
    instructions: `${game.instructions} Dùng Tab để di chuyển, Enter hoặc Space để chọn. Bắt đầu với âm lượng nhỏ. Tiến độ tự lưu trên thiết bị.`,
    guidanceAudioSrc: `${audioBase}${game.id}.v1.mp3`,
  }),
);

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
        'Cùng đoán xem bạn nào đang cất tiếng nhé! Em bấm Nghe âm thanh, rồi chọn con vật mà em nghĩ đến. Đây là tiếng mô phỏng các con vật. Nếu chưa chắc, em cứ nghe lại hoặc mở mô tả bằng chữ để tìm gợi ý.',
      challenges: listeningChallenges('doan-tieng-dong-vat', animalSounds),
    },
    {
      id: 'doan-nhac-cu',
      title: 'Đoán nhạc cụ',
      description: 'Khám phá tám âm sắc từ đàn piano đến tiếng trống.',
      instructions:
        'Em có nhận ra tiếng nhạc cụ nào không? Bấm Nghe âm thanh, nghe một chút rồi chọn câu trả lời nhé. Đây là tiếng mô phỏng nhạc cụ. Em có thể nghe lại hoặc mở mô tả bằng chữ nếu cần gợi ý.',
      challenges: listeningChallenges('doan-nhac-cu', instrumentSounds),
    },
    {
      id: 'nho-chuoi-am-thanh',
      title: 'Nhớ chuỗi âm thanh',
      description: 'Lắng nghe, ghi nhớ rồi chơi lại từng nốt theo đúng thứ tự.',
      instructions:
        'Mình cùng chơi trò nhớ nốt nhạc nhé! Em bấm Nghe chuỗi âm thanh, rồi chọn lại từng nốt theo thứ tự vừa nghe. Chọn xong thì bấm Kiểm tra chuỗi. Lỡ chọn nhầm cũng không sao, em có thể xóa nốt cuối hoặc nhập lại. Mô tả bằng chữ cũng có sẵn để em xem gợi ý.',
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
        'Có những âm thanh đang trốn sau các thẻ đấy! Em mở hai thẻ, nghe thử xem tiếng của chúng có giống nhau không. Nếu khác nhau, bấm Úp hai thẻ rồi tìm tiếp nhé. Cặp nào tìm đúng sẽ được giữ mở. Em cũng có thể bật mô tả bằng chữ cho thẻ đang mở để tìm cặp.',
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
        'Cùng khám phá những điều thú vị quanh mình nhé! Em bấm Nghe câu hỏi, hoặc đọc câu hỏi rồi chọn câu trả lời. Chưa đúng thì mình thử lại. Khi tìm ra đáp án, em sẽ biết thêm vì sao câu trả lời đó đúng.',
      challenges: questions('do-vui-kien-thuc', knowledgeQuestions),
    },
    {
      id: 'toan-hoc-am-thanh',
      title: 'Toán học bằng âm thanh',
      description: 'Nghe bài toán, đếm nhịp và khám phá các phép tính.',
      instructions:
        'Mình cùng giải một bài toán nhé! Em bấm Nghe câu hỏi, nghe kỹ rồi chọn kết quả. Cần nghĩ thêm thì cứ từ từ, em có thể nghe lại hoặc đọc bài toán bằng chữ. Mình bắt đầu với đếm, cộng và trừ ở cấp một, rồi thử nhân, chia và bài toán nhiều bước ở các cấp sau.',
      challenges: questions('toan-hoc-am-thanh', mathQuestions),
    },
    {
      id: 'phieu-luu-giai-do',
      title: 'Phiêu lưu giải đố',
      description: 'Ba chuyến đi: Rừng Ngân Nga, Đảo Chuông và Đài Âm Thanh.',
      instructions:
        'Sẵn sàng lên đường chưa? Mỗi chuyến phiêu lưu có tám chặng đang chờ em khám phá. Em nghe hoặc đọc câu chuyện, rồi chọn cách giải câu đố. Giải được một câu, mình sẽ đi tiếp và xem chuyện gì xảy ra. Nếu chưa đúng, em cứ thử cách khác nhé.',
      challenges: questions('phieu-luu-giai-do', adventureQuestions),
    },
    {
      id: 'ghi-nho-nhip-dieu',
      title: 'Ghi nhớ nhịp điệu',
      description: 'Nghe tiếng trống và tái hiện những khoảng nghỉ ngắn, dài.',
      instructions:
        'Em nghe mẫu nhịp trước nhé, rồi bấm Gõ nhịp để gõ lại. Gõ xong thì bấm Kiểm tra nhịp. Em có thể gõ chậm hơn mẫu, miễn là các khoảng nghỉ ngắn và dài vẫn cân đối như lúc nghe. Nếu thích, em chuyển sang Chọn khoảng nghỉ rồi chọn Ngắn, Dài hoặc Rất dài thay cho gõ trực tiếp.',
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
    instructions: `${game.instructions} Em cứ chơi thong thả, không cần vội. Nếu dùng bàn phím, em bấm Tab để di chuyển, rồi Enter hoặc phím cách để chọn. Nhớ để âm lượng nhỏ, vừa nghe nhé. Trò chơi sẽ lưu lại để lần sau em chơi tiếp.`,
    guidanceAudioSrc: `${audioBase}${game.id}.v2.mp3`,
  }),
);

import type { VoiceMessage } from '../engines/audio/voiceTypes';

const base = `${import.meta.env?.BASE_URL ?? '/'}audio/guidance/`;
export const gameVoiceMessages = {
  correct: {
    id: 'game-correct',
    text: 'Đúng rồi! Em đã làm rất tốt. Hãy đọc lời giải thích và tiếp tục khám phá nhé.',
    audioSrc: `${base}game-correct.v1.mp3`,
  },
  incorrect: {
    id: 'game-incorrect',
    text: 'Chưa đúng rồi. Em có thể nghe lại, đọc mô tả và thử tiếp nhé. Với trò ghép cặp, hãy úp hai thẻ trước khi chọn lại.',
    audioSrc: `${base}game-incorrect.v1.mp3`,
  },
  completed: {
    id: 'game-completed',
    text: 'Em đã hoàn thành cấp độ này! Hãy xem kết quả bên dưới. Em có thể chơi lại hoặc chọn cấp độ khác.',
    audioSrc: `${base}game-completed.v1.mp3`,
  },
} as const satisfies Record<string, VoiceMessage>;

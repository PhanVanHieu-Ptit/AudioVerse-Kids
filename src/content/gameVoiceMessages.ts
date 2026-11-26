import type { VoiceMessage } from '../engines/audio/voiceTypes';

const base = `${import.meta.env?.BASE_URL ?? '/'}audio/guidance/`;
export const gameVoiceMessages = {
  correct: {
    id: 'game-correct',
    text: 'Đúng rồi, em tìm ra rồi đấy! Mình cùng khám phá thử thách tiếp theo nhé.',
    audioSrc: `${base}game-correct.v2.mp3`,
  },
  incorrect: {
    id: 'game-incorrect',
    text: 'Chưa đúng rồi, mình thử lại nhé! Em cứ nghe thêm lần nữa, hoặc mở mô tả bằng chữ để tìm gợi ý.',
    audioSrc: `${base}game-incorrect.v2.mp3`,
  },
  pairIncorrect: {
    id: 'game-pair-incorrect',
    text: 'Hai tiếng này khác nhau rồi. Em bấm Úp hai thẻ, rồi mình tìm cặp khác nhé!',
    audioSrc: `${base}game-pair-incorrect.v2.mp3`,
  },
  pairCorrect: {
    id: 'game-pair-correct',
    text: 'Đúng rồi! Em tìm được một cặp rồi đấy. Mình tìm tiếp nhé!',
    audioSrc: `${base}game-pair-correct.v2.mp3`,
  },
  completed: {
    id: 'game-completed',
    text: 'Em đã hoàn thành cấp độ này rồi, giỏi lắm! Em có thể nghỉ một chút, chơi lại, hoặc khám phá cấp độ khác nhé.',
    audioSrc: `${base}game-completed.v2.mp3`,
  },
} as const satisfies Record<string, VoiceMessage>;

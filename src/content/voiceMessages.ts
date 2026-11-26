import type { VoiceMessage } from '@/engines/audio/voiceTypes';

const voiceAudioBase = `${import.meta.env?.BASE_URL ?? '/'}audio/guidance/`;

// Vietnamese speech rendered ahead of time; no runtime TTS is needed to play it.
export const voiceMessages = {
  welcome: {
    id: 'welcome',
    audioSrc: `${voiceAudioBase}welcome.v1.mp3`,
    text: 'Chào mừng em đến với AudioVerse Kids, Thế Giới Âm Thanh! Em có thể nghe truyện, chơi trò chơi, khám phá âm nhạc và học điều mới. Hãy chọn một hoạt động theo nhịp của riêng em.',
  },
  appHelp: {
    id: 'app-help',
    audioSrc: `${voiceAudioBase}app-help.v1.mp3`,
    text: 'Dùng Tab để đến điều khiển tiếp theo, Shift và Tab để quay lại. Dùng Enter để mở liên kết, Enter hoặc Space để bấm nút. Dùng Escape để đóng hộp thoại. Trên màn hình cảm ứng, em chạm vào nút; với trình đọc màn hình, dùng cử chỉ quen thuộc của thiết bị. Trò chơi không giới hạn thời gian. Mỗi âm thanh đều có mô tả bằng chữ.',
  },
  settings: {
    id: 'settings',
    audioSrc: `${voiceAudioBase}settings.v1.mp3`,
    text: 'Em có thể đổi giao diện, bật chữ lớn, tương phản cao hoặc giảm chuyển động. Dùng Tab để đến từng lựa chọn và Space để bật hoặc tắt. Hướng dẫn giọng nói chỉ đọc khi em bấm nút nghe. Em có thể đổi tốc độ, âm lượng hoặc tắt hướng dẫn bất cứ lúc nào.',
  },
  incorrect: {
    id: 'result-incorrect',
    audioSrc: `${voiceAudioBase}result-incorrect.v2.mp3`,
    text: 'Chưa đúng rồi, mình nghe lại nhé! Em cũng có thể mở mô tả bằng chữ để tìm gợi ý.',
  },
  correct: {
    id: 'result-correct',
    audioSrc: `${voiceAudioBase}result-correct.v2.mp3`,
    text: 'Đúng rồi! Em nghe ra rồi đấy. Mình cùng thử nốt tiếp theo nhé.',
  },
  completed: {
    id: 'result-completed',
    audioSrc: `${voiceAudioBase}result-completed.v2.mp3`,
    text: 'Em đã nhận ra đủ các nốt nhạc rồi, giỏi lắm! Nghỉ một chút hoặc chơi thêm lần nữa nhé.',
  },
  audioError: {
    id: 'audio-error',
    audioSrc: `${voiceAudioBase}audio-error.v1.mp3`,
    text: 'Chưa phát được âm thanh. Em có thể thử nghe lại hoặc dùng mô tả bằng chữ bên dưới.',
  },
} as const satisfies Record<string, VoiceMessage>;

export function activityVoiceMessage(activity: {
  id: string;
  title: string;
  instructions: string;
  guidanceAudioSrc?: string;
}): VoiceMessage {
  return {
    id: `activity:${activity.id}:instructions`,
    text: `${activity.title}. ${activity.instructions}`,
    ...(activity.guidanceAudioSrc
      ? { audioSrc: activity.guidanceAudioSrc }
      : {}),
  };
}

export const gameFeedback = {
  incorrect: voiceMessages.incorrect.text,
  correct: voiceMessages.correct.text,
  completed: voiceMessages.completed.text,
} as const;

export const voiceUi = {
  listen: 'Nghe hướng dẫn',
  stop: 'Dừng hướng dẫn',
  cancel: 'Hủy hướng dẫn đang tải',
  repeat: 'Đọc lại hướng dẫn vừa nghe',
  stopCurrent: 'Dừng lời đọc hiện tại',
  loading: 'Đang chuẩn bị hướng dẫn…',
  empty: 'Chưa có hướng dẫn để đọc lại.',
  unavailable:
    'Chưa mở được file hướng dẫn hoặc chưa có giọng tiếng Việt cục bộ phù hợp. Em có thể thử lại, dùng trình đọc màn hình hoặc đọc hướng dẫn bằng chữ.',
  error:
    'Chưa đọc được hướng dẫn. Em có thể thử lại hoặc dùng hướng dẫn bằng chữ.',
  requirements:
    'Ứng dụng đã có file giọng đọc tiếng Việt, không cần cài giọng trên thiết bị. Sau khi ứng dụng lưu xong để dùng ngoại tuyến, em có thể nghe cả khi mất mạng. Giọng đọc của thiết bị chỉ là nguồn bổ sung; hướng dẫn bằng chữ luôn có sẵn.',
} as const;

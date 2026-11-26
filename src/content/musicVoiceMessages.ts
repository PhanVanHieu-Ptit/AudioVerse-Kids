import type { VoiceMessage } from '../engines/audio/voiceTypes';

const base = `${import.meta.env?.BASE_URL ?? '/'}audio/guidance/`;

function message(id: string, text: string): VoiceMessage {
  return { id, text, audioSrc: `${base}${id}.v2.mp3` };
}

export const musicVoiceMessages = {
  playground: message(
    'music-playground-guide',
    'Chào em, cùng dạo một vòng khu vườn âm nhạc nhé! Em chọn một nhạc cụ rồi bấm nghe mẫu để nghe thử. Sau đó, chạm vào các nốt và chơi một giai điệu của riêng em. Nếu dùng bàn phím, em bấm Tab để đến nốt muốn chơi, rồi bấm Enter hoặc phím cách. Khi bật Thêm nốt đã chơi vào bản nhạc, các nốt em chơi sẽ được giữ lại. Em có thể sửa, phát lại, đặt tên rồi lưu bản nhạc. Cứ thử những gì em thích nhé! Muốn nghỉ, em bấm Dừng âm thanh bất cứ lúc nào. Nhớ để âm lượng nhỏ, vừa nghe thôi.',
  ),
  melody: message(
    'music-game-melody',
    'Mình cùng thử nhớ một giai điệu nhé! Em bấm Nghe đề bài để nghe ba nốt nhạc, rồi chọn lại ba nốt theo đúng thứ tự vừa nghe. Chưa nhớ hết cũng không sao, em cứ nghe lại. Lỡ chọn nhầm thì bấm Sửa nốt cuối để chọn lại nhé. Mình không cần trả lời nhanh đâu.',
  ),
  rhythm: message(
    'music-game-rhythm',
    'Có một nhịp điệu bí mật đang chờ em tìm ra đấy! Em bấm Nghe đề bài trước, rồi nghe thử từng nhịp bên dưới. Nhịp nào giống với nhịp bí mật thì em chọn nhịp đó nhé. Em cứ nghe lại bao nhiêu lần cũng được, không cần gõ theo hay trả lời nhanh đâu.',
  ),
  ready: message('music-game-ready', 'Chọn Nghe đề bài để bắt đầu nhé!'),
  listening: message(
    'music-game-listening',
    'Mình cùng lắng nghe nhé. Nghe xong rồi em hãy chọn câu trả lời.',
  ),
  melodyReady: message(
    'music-melody-ready',
    'Đã nghe xong rồi! Giờ em chọn lại ba nốt theo thứ tự vừa nghe nhé.',
  ),
  rhythmReady: message(
    'music-rhythm-ready',
    'Đã nghe xong rồi! Em nghe thử các nhịp bên dưới và tìm nhịp giống như thế nhé.',
  ),
  melodyCorrect: message(
    'music-melody-correct',
    'Đúng rồi! Em đã nhớ đủ ba nốt rồi đấy. Muốn chơi tiếp, em bấm Câu mới nhé!',
  ),
  melodyIncorrect: message(
    'music-melody-incorrect',
    'Chưa trùng giai điệu rồi, mình thử lại nhé! Em có thể bấm Sửa nốt cuối, hoặc nghe lại để nhớ rõ hơn.',
  ),
  rhythmCorrect: message(
    'music-rhythm-correct',
    'Đúng rồi! Em tìm ra nhịp bí mật rồi đấy. Bấm Câu mới để chơi tiếp nhé!',
  ),
  rhythmIncorrect: message(
    'music-rhythm-incorrect',
    'Chưa trùng nhịp rồi, mình nghe lại nhé! Em nghe thử các nhịp khác rồi chọn lại cũng được.',
  ),
  cleared: message(
    'music-note-cleared',
    'Đã xóa nốt cuối rồi. Em chọn lại nốt mình muốn nhé.',
  ),
  pickedOne: message(
    'music-note-one',
    'Em đã chọn một nốt, còn hai nốt nữa nhé.',
  ),
  pickedTwo: message(
    'music-note-two',
    'Em đã chọn hai nốt, còn một nốt nữa thôi.',
  ),
} as const;

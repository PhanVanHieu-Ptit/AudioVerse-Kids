import type { AudioErrorCode, AudioStatus } from '@/engines/audio/types';

export const playerStatus: Record<AudioStatus, string> = {
  idle: 'Chưa chọn âm thanh.',
  loading: 'Đang tải âm thanh…',
  ready: 'Sẵn sàng phát.',
  playing: 'Đang phát.',
  paused: 'Đã tạm dừng.',
  stopped: 'Đã dừng.',
  ended: 'Đã nghe xong.',
  blocked: 'Hãy nhấn Nghe tiếp để cho phép trình duyệt phát âm thanh.',
  error: 'Chưa phát được âm thanh.',
};
export const playerErrors: Record<AudioErrorCode, string> = {
  load: 'Không tải được âm thanh. Kiểm tra kết nối hoặc tải tài nguyên để nghe ngoại tuyến, rồi thử lại.',
  playback:
    'Trình duyệt không phát được tệp này. Em có thể thử lại hoặc đọc nội dung bằng chữ.',
  autoplay: 'Trình duyệt cần thao tác của em để phát âm thanh.',
  unsupported:
    'Thiết bị chưa hỗ trợ phát tệp này. Em có thể đọc nội dung bằng chữ.',
};
export const playerLabels = {
  title: 'Trình phát âm thanh',
  empty: 'Chưa có bản thu âm được chọn.',
  play: 'Phát',
  pause: 'Tạm dừng',
  resume: 'Nghe tiếp',
  stop: 'Dừng',
  replay: 'Nghe lại',
  retry: 'Thử lại',
  seek: 'Vị trí phát',
  volume: 'Âm lượng',
  rate: 'Tốc độ đọc',
  transcript: 'Nội dung bằng chữ',
  queue: 'Số âm thanh đang chờ',
};
export const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

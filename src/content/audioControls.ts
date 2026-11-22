import type { IconName } from '@/components/atoms/Icon';

export type AudioControlState =
  'ready' | 'playing' | 'paused' | 'loading' | 'error' | 'unavailable';
export const audioControls: Record<
  AudioControlState,
  { label: string; icon: IconName }
> = {
  ready: { label: 'Phát', icon: 'play' },
  playing: { label: 'Tạm dừng', icon: 'pause' },
  paused: { label: 'Nghe tiếp', icon: 'play' },
  loading: { label: 'Đang tải', icon: 'sound' },
  error: { label: 'Thử lại', icon: 'refresh' },
  unavailable: { label: 'Chưa có âm thanh', icon: 'sound' },
};

export const controlBarLabels = {
  title: 'Điều khiển âm thanh',
  previous: 'Nội dung trước',
  next: 'Nội dung tiếp theo',
  back: 'Quay lại',
  exit: 'Thoát hoạt động',
  help: 'Trợ giúp điều khiển',
  sequential:
    'Tab: đến nút tiếp. Shift + Tab: quay lại. Enter hoặc Space: chọn. Màn hình cảm ứng: chạm nút.',
  shortcuts: 'Bật phím tắt trong bộ điều khiển',
  scope:
    'Phím tắt mặc định tắt. Khi bật, phím tắt chỉ hoạt động lúc focus ở các nút trong bộ điều khiển; không áp dụng trong ô nhập, thanh trượt, danh sách chọn hoặc hộp thoại. Tab, Enter và Space luôn dùng được. Với trình đọc màn hình, em có thể để phím tắt tắt.',
  feedback: 'Bật âm báo thao tác',
  feedbackHint:
    'Âm báo ngắn, nhẹ chỉ xác nhận đã nhận thao tác, không xác nhận phát thành công. Mặc định tắt để em tự chọn khi dùng trình đọc màn hình.',
  feedbackUnavailable:
    'Thiết bị chưa phát được âm báo. Các nút và thông báo bằng chữ vẫn dùng được.',
  guidanceDisabled:
    'Bật hướng dẫn giọng nói trong Cài đặt để nghe. Hướng dẫn bằng chữ luôn có ở đây.',
  navigationHint:
    'Nút chuyển nội dung chỉ dùng được khi có nội dung liền kề. Quay lại và Thoát hoạt động chỉ dùng được khi hoạt động đã cung cấp điểm đến.',
  helpDescription:
    'Em có thể điều khiển tuần tự bằng bàn phím hoặc chạm từng nút, không cần micrô hay thao tác phức tạp.',
} as const;

// Single source for both the key handler and the visible shortcut guide.
export const audioShortcuts = [
  { key: 'p', action: 'toggle', label: 'Phát hoặc tạm dừng' },
  { key: 'r', action: 'replay', label: 'Nghe lại từ đầu' },
  { key: '[', action: 'previous', label: controlBarLabels.previous },
  { key: ']', action: 'next', label: controlBarLabels.next },
  { key: 'h', action: 'guidance', label: 'Nghe hoặc dừng hướng dẫn' },
  { key: '?', action: 'help', label: controlBarLabels.help },
] as const;

export const controlFeedbackTone = {
  frequency: 660,
  durationSeconds: 0.16,
  gain: 0.04,
} as const;

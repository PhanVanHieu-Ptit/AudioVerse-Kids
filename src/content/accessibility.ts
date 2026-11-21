export const keyboardHelp = [
  { keys: 'Tab', action: 'Đến liên kết, nút hoặc ô nhập tiếp theo.' },
  { keys: 'Shift + Tab', action: 'Quay lại điều khiển trước đó.' },
  { keys: 'Enter', action: 'Mở liên kết hoặc kích hoạt nút đang được chọn.' },
  { keys: 'Space', action: 'Bấm nút, bật hoặc tắt lựa chọn đang được chọn.' },
  {
    keys: 'Các phím mũi tên',
    action:
      'Đổi lựa chọn trong danh sách chọn hoặc nhóm nút radio theo cách của trình duyệt.',
  },
  { keys: 'Escape', action: 'Đóng hộp thoại và quay về nút đã mở hộp thoại.' },
] as const;

export { gameFeedback } from './voiceMessages';

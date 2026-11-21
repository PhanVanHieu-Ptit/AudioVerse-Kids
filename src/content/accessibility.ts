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

export const guidanceCopy = {
  settings:
    'Em có thể đổi giao diện, bật chữ lớn, tương phản cao hoặc giảm chuyển động. Dùng Tab để đến từng lựa chọn và Space để bật hoặc tắt. Hướng dẫn giọng nói chỉ đọc khi em bấm nút Nghe hướng dẫn.',
  help: 'Dùng Tab để đến điều khiển tiếp theo, Shift và Tab để quay lại. Dùng Enter để mở liên kết, Enter hoặc Space để bấm nút. Dùng Escape để đóng hộp thoại. Trò chơi không giới hạn thời gian. Mỗi âm thanh đều có mô tả bằng chữ.',
  unavailable:
    'Chưa có giọng tiếng Việt cục bộ hoặc trình duyệt chưa hỗ trợ đọc. Em có thể thử lại sau khi cài giọng Việt trên thiết bị, dùng trình đọc màn hình hoặc đọc hướng dẫn bằng chữ. Không cần mạng để xem hướng dẫn.',
  error:
    'Chưa đọc được hướng dẫn. Em có thể thử lại hoặc dùng hướng dẫn bằng chữ.',
  requirements:
    'Cần giọng tiếng Việt cục bộ được cài trên thiết bị. Nếu giọng chưa sẵn sàng, ứng dụng sẽ thông báo khi em thử nghe. Hướng dẫn bằng chữ luôn có sẵn.',
} as const;

export const gameFeedback = {
  incorrect: 'Chưa đúng rồi. Em hãy nghe lại hoặc đọc mô tả và thử tiếp nhé.',
  correct: 'Đúng rồi! Cùng khám phá nốt tiếp theo.',
  completed: 'Em đã nhận biết đủ các nốt nhạc!',
} as const;

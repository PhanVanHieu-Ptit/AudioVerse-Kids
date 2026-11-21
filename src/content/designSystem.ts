export const showcaseSections = [
  { id: 'giao-dien', label: 'Giao diện' },
  { id: 'nen-tang', label: 'Nền tảng' },
  { id: 'dieu-khien', label: 'Nút & tương tác' },
  { id: 'the-noi-dung', label: 'Thẻ & âm thanh' },
  { id: 'trang-thai', label: 'Trạng thái' },
] as const;

export const colorSamples = [
  { label: 'Chủ đạo', token: '--color-primary' },
  { label: 'Điểm nhấn', token: '--color-accent' },
  { label: 'Bề mặt', token: '--color-surface' },
  { label: 'Văn bản', token: '--color-text' },
  { label: 'Thành công', token: '--color-success' },
  { label: 'Cảnh báo lỗi', token: '--color-danger' },
] as const;

export const typeSamples = [
  {
    label: 'Khám phá thế giới',
    token: '--font-3xl',
    size: '2.5rem',
    weight: 750,
  },
  {
    label: 'Mỗi âm thanh, một điều mới',
    token: '--font-xl',
    size: '1.5rem',
    weight: 700,
  },
  {
    label: 'Lắng nghe theo cách của em.',
    token: '--font-sm',
    size: '1rem',
    weight: 400,
  },
  {
    label: 'Thông tin bổ sung vẫn dễ đọc.',
    token: '--font-xs',
    size: '0.875rem',
    weight: 400,
  },
] as const;

export const spacingSamples = [
  { token: '--space-0', size: '0.25rem' },
  { token: '--space-1', size: '0.5rem' },
  { token: '--space-2', size: '1rem' },
  { token: '--space-3', size: '1.5rem' },
  { token: '--space-4', size: '2rem' },
  { token: '--space-5', size: '3rem' },
  { token: '--space-6', size: '4rem' },
] as const;

export const themes = [
  { id: 'light', label: 'Sáng' },
  { id: 'dark', label: 'Tối' },
  { id: 'contrast', label: 'Tương phản cao' },
] as const;

export const tonePreview = {
  title: 'Một nốt nhạc nhỏ',
  description:
    'Âm La 440 Hz được tạo trực tiếp bằng Web Audio. Chỉ phát khi em chọn nghe.',
  transcript:
    'Một nốt La nhẹ, kéo dài khoảng hai giây. Đây là âm thử kỹ thuật, không phải bài học hay bản ghi âm.',
  durationSeconds: 2,
  frequency: 440,
  gain: 0.06,
} as const;

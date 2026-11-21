import type { PreferenceKey } from '@/types/preferences';

export const displayOptions = [
  {
    key: 'largeText',
    title: 'Chữ lớn hơn',
    description: 'Tăng kích thước chữ trên toàn bộ ứng dụng.',
  },
  {
    key: 'highContrast',
    title: 'Tương phản cao',
    description: 'Tăng độ rõ giữa chữ, nút và màu nền.',
  },
  {
    key: 'reducedMotion',
    title: 'Giảm chuyển động',
    description: 'Hạn chế hiệu ứng chuyển động khi tương tác.',
  },
] as const satisfies ReadonlyArray<{
  key: Exclude<PreferenceKey, 'theme'>;
  title: string;
  description: string;
}>;

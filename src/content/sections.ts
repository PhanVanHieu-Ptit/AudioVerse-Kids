import type { IconName } from '@/components/atoms/Icon';

export type SectionId = 'stories' | 'games' | 'music' | 'learning' | 'teacher';
export interface Section {
  id: SectionId;
  path: string;
  title: string;
  description: string;
  emptyMessage: string;
  icon: IconName;
  color: 'purple' | 'teal' | 'orange' | 'blue';
}

export const sections = {
  stories: {
    id: 'stories',
    path: '/stories',
    title: 'Thư viện truyện',
    description: 'Mở một câu chuyện, chạm đến một thế giới.',
    emptyMessage:
      'Chưa có truyện trong thư viện. Nội dung sẽ xuất hiện khi được bổ sung.',
    icon: 'stories',
    color: 'purple',
  },
  games: {
    id: 'games',
    path: '/games',
    title: 'Trò chơi',
    description: 'Lắng nghe, suy nghĩ và thử sức cùng nhau.',
    emptyMessage:
      'Chưa có trò chơi. Em có thể khám phá các khu vực khác trong lúc chờ nội dung mới.',
    icon: 'games',
    color: 'teal',
  },
  music: {
    id: 'music',
    path: '/music',
    title: 'Khu vườn âm nhạc',
    description: 'Cảm nhận giai điệu theo cách của riêng em.',
    emptyMessage:
      'Chưa có bản nhạc để nghe. Chỉ những tài nguyên âm thanh đã được chuẩn bị mới được hiển thị tại đây.',
    icon: 'music',
    color: 'orange',
  },
  learning: {
    id: 'learning',
    path: '/learning',
    title: 'Học điều hay',
    description: 'Mỗi âm thanh, một điều mới để học.',
    emptyMessage:
      'Chưa có bài học. Nội dung học tập sẽ được bổ sung sau khi được kiểm tra về chất lượng và khả năng tiếp cận.',
    icon: 'learning',
    color: 'blue',
  },
  teacher: {
    id: 'teacher',
    path: '/teacher',
    title: 'Chế độ giáo viên',
    description: 'Đồng hành cùng từng bước khám phá của em.',
    emptyMessage:
      'Chưa có tài liệu dành cho giáo viên. Khu vực này sẽ dành cho hướng dẫn và hoạt động học tập cùng trẻ.',
    icon: 'teacher',
    color: 'purple',
  },
} as const satisfies Record<SectionId, Section>;

export const discoverySections = [
  sections.stories,
  sections.games,
  sections.music,
  sections.learning,
];

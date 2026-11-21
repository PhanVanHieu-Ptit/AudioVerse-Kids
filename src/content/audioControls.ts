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

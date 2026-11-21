import { useEffect, useSyncExternalStore } from 'react';
import { useStore } from 'zustand';
import { announcementStore, clearAnnouncement } from './announcements';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';

export function LiveAnnouncer() {
  const message = useStore(announcementStore, (state) => state.message);
  const guidanceStatus = useSyncExternalStore(
    voiceGuidance.subscribe,
    voiceGuidance.getSnapshot,
  );
  const speaking =
    guidanceStatus === 'speaking' || guidanceStatus === 'loading';
  useEffect(() => clearAnnouncement, []);
  return (
    <div
      className="sr-only"
      role="status"
      aria-live={speaking ? 'off' : 'polite'}
      aria-label="Thông báo hoạt động"
      aria-atomic="true"
    >
      {speaking ? '' : message}
    </div>
  );
}

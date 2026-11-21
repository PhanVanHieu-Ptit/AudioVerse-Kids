import { useEffect } from 'react';
import { useStore } from 'zustand';
import { announcementStore, clearAnnouncement } from './announcements';

export function LiveAnnouncer() {
  const message = useStore(announcementStore, (state) => state.message);
  useEffect(() => clearAnnouncement, []);
  return (
    <div
      className="sr-only"
      role="status"
      aria-label="Thông báo hoạt động"
      aria-atomic="true"
    >
      {message}
    </div>
  );
}

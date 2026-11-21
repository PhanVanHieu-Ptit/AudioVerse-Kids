import { createStore } from 'zustand/vanilla';

/** Latest feedback wins; clear before setting so repeated answers are announced. */
export const announcementStore = createStore(() => ({ message: '' }));
let pending: ReturnType<typeof setTimeout> | undefined;

export function clearAnnouncement() {
  clearTimeout(pending);
  announcementStore.setState({ message: '' });
}

export function announce(message: string) {
  clearAnnouncement();
  pending = setTimeout(() => {
    announcementStore.setState({ message });
  }, 100);
}

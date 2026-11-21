import { useStore } from 'zustand';
import { preferencesStore } from '@/stores/preferencesStore';

export function usePreferences() {
  return useStore(preferencesStore);
}

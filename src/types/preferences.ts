export interface Preferences {
  theme: 'light' | 'dark';
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

export type PreferenceKey = keyof Preferences;

export interface Preferences {
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

export type PreferenceKey = keyof Preferences;

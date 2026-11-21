export interface Preferences {
  theme: 'light' | 'dark';
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  voiceGuidance: boolean;
  guidanceRate: 0.8 | 1 | 1.2;
}

export type PreferenceKey = keyof Preferences;

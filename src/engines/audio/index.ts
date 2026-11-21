export { AudioEngine } from './AudioEngine';
export type { AudioEngineOptions } from './AudioEngine';
export { AudioManager, audioManager, audioStore } from './AudioManager';
export { AudioChannel } from './AudioChannel';
export type {
  AudioResource,
  AudioChannelName,
  ChannelSnapshot,
  AudioStatus,
  AudioAssetSource,
  PlayOptions,
} from './types';
export { audioRepository } from '@/lib/storage/audioRepository';
export { VoiceGuidanceService } from './VoiceGuidanceService';
export { RecordedVoiceAdapter, browserVietnameseTts } from './voiceAdapters';
export { voiceGuidance } from './VoiceGuidance';
export { VoiceUnavailableError } from './voiceTypes';
export type {
  VoiceMessage,
  VoiceAdapter,
  VoicePlayback,
  VoiceOptions,
  GuidanceSnapshot,
  GuidanceStatus,
} from './voiceTypes';

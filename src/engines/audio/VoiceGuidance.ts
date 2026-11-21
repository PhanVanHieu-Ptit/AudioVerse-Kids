import { VoiceGuidanceService } from './VoiceGuidanceService';
import { browserVietnameseTts, RecordedVoiceAdapter } from './voiceAdapters';

// Shared coordinator used by AudioManager, dialogs and tone previews.
export const voiceGuidance = new VoiceGuidanceService(
  new RecordedVoiceAdapter(),
  browserVietnameseTts,
);

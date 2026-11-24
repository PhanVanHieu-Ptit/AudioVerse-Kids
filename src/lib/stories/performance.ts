import type { Story } from '../../types/story.ts';
import { planStoryAssets, type SpeechCue } from './production.ts';
import {
  recordingCueText,
  storyRecordingDefinitions,
  type StoryRecordingDefinition,
} from './recordings.ts';

export interface VoiceDirection {
  voice: string;
  tempo: number;
  pauseMs: number;
}

export interface StoryCast {
  narrator: VoiceDirection;
  characters: VoiceDirection[];
  scenePauseMs: number;
  overrides: Record<string, Record<string, VoiceDirection>>;
}

export interface PerformanceTurn extends VoiceDirection {
  cueId: string;
  speakerId: string;
  role: SpeechCue['role'];
  text: string;
}

export interface StoryPerformance extends StoryRecordingDefinition {
  turns: PerformanceTurn[];
}

function validateDirection(direction: VoiceDirection): void {
  if (
    !direction.voice.trim() ||
    !Number.isFinite(direction.tempo) ||
    direction.tempo < 0.9 ||
    direction.tempo > 1.1 ||
    !Number.isInteger(direction.pauseMs) ||
    direction.pauseMs < 0 ||
    direction.pauseMs > 1500
  )
    throw new Error('Giọng, tốc độ hoặc khoảng nghỉ không hợp lệ.');
}

/** A production plan only: no URLs, invented recordings or branch decisions. */
export function planStoryPerformance(
  story: Story,
  cast: StoryCast,
): StoryPerformance[] {
  validateDirection(cast.narrator);
  if (
    !cast.characters.length ||
    !Number.isInteger(cast.scenePauseMs) ||
    cast.scenePauseMs < 0 ||
    cast.scenePauseMs > 1500
  )
    throw new Error(
      'Thiếu giọng nhân vật hoặc khoảng chuyển cảnh không hợp lệ.',
    );
  cast.characters.forEach(validateDirection);
  const overrides = cast.overrides[story.id] ?? {};
  for (const [id, direction] of Object.entries(overrides)) {
    if (!story.characters.some((character) => character.id === id))
      throw new Error(`Vai không tồn tại: ${story.id}/${id}`);
    validateDirection(direction);
  }
  const voices = new Map(
    story.characters.map((character, index) => [
      character.id,
      overrides[character.id] ??
        cast.characters[index % cast.characters.length]!,
    ]),
  );
  const cues = new Map(
    planStoryAssets(story)
      .filter((cue): cue is SpeechCue => cue.kind === 'speech')
      .map((cue) => [cue.id, cue]),
  );
  return storyRecordingDefinitions(story).map((definition) => {
    const turns = definition.cueIds.map((id): PerformanceTurn => {
      const cue = cues.get(id);
      if (!cue) throw new Error(`Thiếu lời cần thu: ${id}`);
      const direction =
        cue.speakerId === 'narrator'
          ? cast.narrator
          : voices.get(cue.speakerId);
      if (!direction) throw new Error(`Chưa chọn giọng cho ${cue.speakerId}`);
      return {
        cueId: cue.id,
        speakerId: cue.speakerId,
        role: cue.role,
        text: recordingCueText(story, cue),
        ...direction,
        pauseMs:
          cue.role === 'scene-title' || cue.role === 'title'
            ? cast.scenePauseMs
            : direction.pauseMs,
      };
    });
    if (turns.map((turn) => turn.text).join('\n\n') !== definition.transcript)
      throw new Error(`Lời đọc không khớp transcript: ${definition.id}`);
    return { ...definition, turns };
  });
}

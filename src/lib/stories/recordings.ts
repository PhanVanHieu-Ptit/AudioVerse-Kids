import type { Story } from '../../types/story.ts';
import { planStoryAssets, speakerName, type SpeechCue } from './production.ts';

export interface StoryRecordingDefinition {
  id: string;
  storyId: string;
  sceneId: string;
  kind: 'scene' | 'question' | 'feedback';
  questionId: string | null;
  optionId: string | null;
  title: string;
  transcript: string;
  cueIds: string[];
}

/** Spoken names keep dialogue understandable without recognizing voice timbre. */
export function recordingCueText(story: Story, cue: SpeechCue): string {
  return cue.role === 'dialogue'
    ? `${speakerName(story, cue.speakerId)}: ${cue.text}`
    : cue.text;
}

/** One complete scene at a time; no recording chooses or auto-enters a branch. */
export function storyRecordingDefinitions(
  story: Story,
): StoryRecordingDefinition[] {
  const cues = planStoryAssets(story).filter(
    (cue): cue is SpeechCue => cue.kind === 'speech',
  );
  const recordings: StoryRecordingDefinition[] = [];
  for (const scene of story.scenes) {
    const local = cues.filter((cue) => cue.sceneId === scene.id);
    const sceneCues = [
      ...cues.filter(
        (cue) =>
          scene.id === story.entrySceneId &&
          cue.sceneId === null &&
          cue.role !== 'message',
      ),
      ...local.filter((cue) =>
        ['scene-title', 'narration', 'dialogue', 'ending'].includes(cue.role),
      ),
      ...cues.filter((cue) => scene.ending !== null && cue.role === 'message'),
      ...local.filter(
        (cue) => cue.role === 'question' || cue.role === 'interaction',
      ),
    ];
    recordings.push({
      id: `${story.id}.scene.${scene.id}.reading`,
      storyId: story.id,
      sceneId: scene.id,
      kind: 'scene',
      questionId: null,
      optionId: null,
      title: `${story.title} — ${scene.title}`,
      transcript: sceneCues
        .map((cue) => recordingCueText(story, cue))
        .join('\n\n'),
      cueIds: sceneCues.map((cue) => cue.id),
    });
    for (const question of scene.questions) {
      const questionId = `${story.id}.scene.${scene.id}.question.${question.id}`;
      const questionCue = local.find((cue) => cue.id === questionId);
      if (!questionCue) throw new Error(`Thiếu lời câu hỏi ${questionId}`);
      recordings.push({
        id: `${questionId}.reading`,
        storyId: story.id,
        sceneId: scene.id,
        kind: 'question',
        questionId: question.id,
        optionId: null,
        title: question.prompt,
        transcript: questionCue.text,
        cueIds: [questionCue.id],
      });
      for (const option of question.options) {
        const id = `${questionId}.feedback.${option.id}`;
        const cue = local.find((item) => item.id === id);
        if (!cue) throw new Error(`Thiếu lời phản hồi ${id}`);
        recordings.push({
          id,
          storyId: story.id,
          sceneId: scene.id,
          kind: 'feedback',
          questionId: question.id,
          optionId: option.id,
          title: option.label,
          transcript: cue.text,
          cueIds: [cue.id],
        });
      }
    }
  }
  return recordings;
}

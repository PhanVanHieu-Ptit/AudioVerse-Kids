import manifest from '../../public/audio/stories/manifest.json';
import { stories } from './stories';
import {
  storyRecordingDefinitions,
  type StoryRecordingDefinition,
} from '../lib/stories/recordings';
import type { AudioResource } from '../engines/audio/types';

export interface StoryAudioResource extends AudioResource {
  bytes: number;
  sha256: string;
  durationSeconds: number;
}

export interface StoryRecording {
  definition: StoryRecordingDefinition;
  resource: StoryAudioResource;
}

const recordings: StoryRecording[] = stories
  .flatMap(storyRecordingDefinitions)
  .flatMap((definition) => {
    const asset = manifest.assets.find((item) => item.id === definition.id);
    if (
      !asset ||
      asset.status !== 'ready' ||
      asset.storyId !== definition.storyId ||
      !/^[a-z0-9-]+\/[a-z0-9.-]+\.mp3$/.test(asset.file)
    )
      return [];
    return [
      {
        definition,
        resource: {
          id: definition.id,
          src: `${import.meta.env?.BASE_URL ?? '/'}audio/stories/${asset.file}`,
          title: definition.title,
          transcript: definition.transcript,
          bytes: asset.bytes,
          sha256: asset.audioSha256,
          durationSeconds: asset.durationSeconds,
        },
      },
    ];
  });

export function storyRecordings(storyId: string): StoryRecording[] {
  return recordings.filter((item) => item.definition.storyId === storyId);
}

export function sceneRecording(
  storyId: string,
  sceneId: string,
): StoryRecording | undefined {
  return recordings.find(
    (item) =>
      item.definition.storyId === storyId &&
      item.definition.sceneId === sceneId &&
      item.definition.kind === 'scene',
  );
}

export function questionRecording(
  storyId: string,
  sceneId: string,
  questionId: string,
  optionId: string | null = null,
): StoryRecording | undefined {
  return recordings.find(
    (item) =>
      item.definition.storyId === storyId &&
      item.definition.sceneId === sceneId &&
      item.definition.questionId === questionId &&
      item.definition.optionId === optionId &&
      item.definition.kind === (optionId === null ? 'question' : 'feedback'),
  );
}

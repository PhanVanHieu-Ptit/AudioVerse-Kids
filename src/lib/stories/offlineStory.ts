import { audioRepository } from '../storage/audioRepository';
import type { StoryAudioResource } from '../../content/storyAudio';

export async function cachedStoryFileCount(
  resources: readonly StoryAudioResource[],
): Promise<number> {
  let count = 0;
  for (const resource of resources) {
    const blob = await audioRepository.read(resource);
    if (blob?.size === resource.bytes) count++;
  }
  return count;
}

/** Saves completed files only; cancelling retains completed files for a later retry. */
export async function downloadStory(
  resources: readonly StoryAudioResource[],
  signal: AbortSignal,
  onProgress: (completed: number) => void,
): Promise<void> {
  if (!resources.length) throw new Error('Không có bản đọc để tải.');
  let completed = 0;
  for (const resource of resources) {
    signal.throwIfAborted();
    const blob = await audioRepository.read(resource);
    if (blob?.size !== resource.bytes)
      await audioRepository.download(resource, signal, {
        bytes: resource.bytes,
        sha256: resource.sha256,
      });
    signal.throwIfAborted();
    onProgress(++completed);
  }
}

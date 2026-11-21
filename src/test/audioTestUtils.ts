import { vi } from 'vitest';
import type { AudioResource } from '@/engines/audio/types';

/** Media boundary only: jsdom does not decode or play audio. */
export function fakeAudio(
  options: { metadata?: boolean; play?: () => Promise<void> } = {},
) {
  const element = document.createElement('audio');
  Object.defineProperty(element, 'duration', { value: 90, configurable: true });
  const play = vi
    .spyOn(element, 'play')
    .mockImplementation(options.play ?? (() => Promise.resolve()));
  const pause = vi.spyOn(element, 'pause').mockImplementation(() => undefined);
  const load = vi.spyOn(element, 'load').mockImplementation(() => {
    if (element.getAttribute('src') && options.metadata !== false)
      queueMicrotask(() => element.dispatchEvent(new Event('loadedmetadata')));
  });
  return { element, play, pause, load };
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((success, failure) => {
    resolve = success;
    reject = failure;
  });
  return { promise, resolve, reject };
}

export function audioResource(id: string): AudioResource {
  return {
    id,
    src: `/test-only/${id}.wav`,
    title: `Âm thanh ${id}`,
    transcript: `Nội dung ${id}`,
  };
}

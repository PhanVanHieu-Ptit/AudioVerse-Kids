import { beforeEach, describe, expect, it, vi } from 'vitest';
import { audioRepository } from '../storage/audioRepository';
import { cachedStoryFileCount, downloadStory } from './offlineStory';
import { storyRecordings } from '../../content/storyAudio';

const resources = storyRecordings('ba-chu-heo-con')
  .slice(0, 2)
  .map((item) => item.resource);
beforeEach(() => vi.restoreAllMocks());

describe('per-story verified offline downloads', () => {
  it('reuses complete cached files and downloads missing files with integrity checks', async () => {
    vi.spyOn(audioRepository, 'read')
      .mockResolvedValueOnce({ size: resources[0]!.bytes } as Blob)
      .mockResolvedValueOnce(undefined);
    const download = vi.spyOn(audioRepository, 'download').mockResolvedValue();
    const progress = vi.fn();
    const signal = new AbortController().signal;
    await downloadStory(resources, signal, progress);
    expect(download).toHaveBeenCalledTimes(1);
    expect(download).toHaveBeenCalledWith(resources[1], signal, {
      bytes: resources[1]!.bytes,
      sha256: resources[1]!.sha256,
    });
    expect(progress.mock.calls).toEqual([[1], [2]]);
  });

  it('rejects interrupted, empty and failed saves without reporting completion', async () => {
    vi.spyOn(audioRepository, 'read').mockResolvedValue(undefined);
    const download = vi
      .spyOn(audioRepository, 'download')
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new DOMException('Quota', 'QuotaExceededError'));
    const progress = vi.fn();
    await expect(
      downloadStory(resources, new AbortController().signal, progress),
    ).rejects.toMatchObject({ name: 'QuotaExceededError' });
    expect(progress.mock.calls).toEqual([[1]]);
    download.mockClear();
    const controller = new AbortController();
    controller.abort();
    await expect(
      downloadStory(resources, controller.signal, progress),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(download).not.toHaveBeenCalled();
    await expect(
      downloadStory([], new AbortController().signal, progress),
    ).rejects.toThrow('Không có');
  });

  it('counts only present files matching their expected sizes', async () => {
    vi.spyOn(audioRepository, 'read')
      .mockResolvedValueOnce({ size: resources[0]!.bytes } as Blob)
      .mockResolvedValueOnce({ size: 1 } as Blob);
    expect(await cachedStoryFileCount(resources)).toBe(1);
  });
});

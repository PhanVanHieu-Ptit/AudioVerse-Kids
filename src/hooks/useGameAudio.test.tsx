import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { GameAudio } from '@/engines/audio/GameAudio';
import { stopAudio } from '@/engines/audio/audioFocus';
import { memorySounds } from '@/content/gameSounds';
import { deferred } from '@/test/audioTestUtils';
import { useGameAudio } from './useGameAudio';

it('does not revive pending playback after narration takes audio focus', async () => {
  const pending = deferred<void>();
  vi.spyOn(GameAudio.prototype, 'play').mockReturnValue(pending.promise);
  const { result } = renderHook(() => useGameAudio());
  let playing: Promise<void> | undefined;
  act(() => {
    playing = result.current.play(memorySounds[0]!);
  });
  expect(result.current.status).toBe('loading');
  act(() => stopAudio());
  await act(async () => {
    pending.resolve();
    await playing;
  });
  expect(result.current.status).toBe('idle');
});

it('stops and disposes all game audio on unmount', async () => {
  vi.spyOn(GameAudio.prototype, 'play').mockResolvedValue();
  const dispose = vi.spyOn(GameAudio.prototype, 'dispose').mockResolvedValue();
  const { result, unmount } = renderHook(() => useGameAudio());
  await act(() => result.current.play(memorySounds[0]!));
  expect(result.current.status).toBe('playing');
  unmount();
  expect(dispose).toHaveBeenCalledOnce();
});

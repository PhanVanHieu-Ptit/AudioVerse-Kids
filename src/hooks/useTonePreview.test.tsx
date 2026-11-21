import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { TonePreview } from '@/engines/audio/TonePreview';
import { stopAudio } from '@/engines/audio/audioFocus';
import { useTonePreview } from './useTonePreview';

it('does not revive pending playback after guidance stops audio', async () => {
  let finish: (() => void) | undefined;
  vi.spyOn(TonePreview.prototype, 'play').mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const { result } = renderHook(() => useTonePreview());
  let playback: Promise<void> | undefined;
  act(() => {
    playback = result.current.activate();
  });
  expect(result.current.state).toBe('loading');
  act(() => stopAudio());
  await act(async () => {
    finish?.();
    await playback;
  });
  expect(result.current.state).toBe('ready');
});

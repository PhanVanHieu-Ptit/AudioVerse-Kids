import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AudioEngine } from '@/engines/audio/AudioEngine';
import { audioResource, deferred, fakeAudio } from '@/test/audioTestUtils';
import { useAudioControls } from './useAudioControls';
import {
  preferencesStore,
  defaultPreferences,
} from '@/stores/preferencesStore';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';
import { voiceMessages } from '@/content/voiceMessages';
import { TonePreview } from '@/engines/audio/TonePreview';

const engines: AudioEngine[] = [];
afterEach(async () => {
  await Promise.all(engines.splice(0).map((engine) => engine.dispose()));
  voiceGuidance.reset();
  preferencesStore.setState({
    preferences: { ...defaultPreferences },
    status: 'ready',
  });
  vi.restoreAllMocks();
});
function setup(play?: () => Promise<void>) {
  const audio = fakeAudio(play ? { play } : {});
  const engine = new AudioEngine({
    source: { resolve: async (item) => item.src },
    createElement: () => audio.element,
  });
  engines.push(engine);
  return { engine, audio };
}

it('does not create media or play on mount, and preserves shared playback on unmount', async () => {
  const { engine, audio } = setup();
  const { result, unmount } = renderHook(() =>
    useAudioControls({ engine, resource: audioResource('one') }),
  );
  expect(audio.play).not.toHaveBeenCalled();
  expect(result.current.active).toBe(false);
  act(() => result.current.toggle());
  await waitFor(() => expect(result.current.playing).toBe(true));
  unmount();
  expect(engine.store.getState().channels.narration.status).toBe('playing');
});

it('supports pause, resume, replay, volume and rate through the real engine', async () => {
  const { engine, audio } = setup();
  const { result } = renderHook(() =>
    useAudioControls({ engine, resource: audioResource('one') }),
  );
  act(() => result.current.toggle());
  await waitFor(() => expect(result.current.playing).toBe(true));
  audio.element.currentTime = 24;
  act(() => result.current.toggle());
  expect(result.current.status).toBe('paused');
  expect(result.current.player.currentTime).toBe(24);
  act(() => result.current.toggle());
  await waitFor(() => expect(result.current.playing).toBe(true));
  expect(audio.element.currentTime).toBe(24);
  act(() => {
    result.current.setVolume(0.4);
    result.current.setPlaybackRate(1.5);
  });
  expect(audio.element.volume).toBe(0.4);
  expect(audio.element.playbackRate).toBe(1.5);
  act(() => result.current.replay());
  await waitFor(() => expect(result.current.playing).toBe(true));
  expect(result.current.player.currentTime).toBe(0);
});

it('does not restart a pending load; stop cancels it without late playback', async () => {
  const pending = deferred<string>();
  const audio = fakeAudio();
  const engine = new AudioEngine({
    source: { resolve: () => pending.promise },
    createElement: () => audio.element,
  });
  engines.push(engine);
  const { result } = renderHook(() =>
    useAudioControls({ engine, resource: audioResource('one') }),
  );
  act(() => result.current.toggle());
  expect(result.current.loading).toBe(true);
  act(() => {
    result.current.toggle();
    result.current.replay();
  });
  expect(result.current.loading).toBe(true);
  act(() => result.current.stop());
  await act(async () => {
    pending.resolve('/test-only/one.wav');
  });
  expect(result.current.status).toBe('stopped');
  expect(audio.play).not.toHaveBeenCalled();
});

it.each([
  new DOMException('Denied', 'NotAllowedError'),
  new Error('Decode failed'),
])(
  'retries blocked or failed playback and retains the narration queue: %s',
  async (error) => {
    const play = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue(undefined);
    const { engine } = setup(play);
    const { result } = renderHook(() =>
      useAudioControls({ engine, resource: audioResource('one') }),
    );
    act(() => result.current.toggle());
    await waitFor(() =>
      expect(['blocked', 'error']).toContain(result.current.status),
    );
    act(() => engine.enqueue([audioResource('two')]));
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.playing).toBe(true));
    expect(result.current.player.queue).toHaveLength(1);
  },
);

it('switches both ways within playlist boundaries without wrapping', async () => {
  const { engine } = setup();
  const playlist = [audioResource('one'), audioResource('two')];
  const { result } = renderHook(() => useAudioControls({ engine, playlist }));
  expect(result.current.selected?.id).toBe('one');
  expect(result.current.canPrevious).toBe(false);
  act(() => result.current.previous());
  expect(result.current.active).toBe(false);
  act(() => result.current.next());
  await waitFor(() => expect(result.current.playing).toBe(true));
  expect(result.current.selected?.id).toBe('two');
  expect(result.current.canNext).toBe(false);
  act(() => result.current.next());
  expect(result.current.selected?.id).toBe('two');
  act(() => result.current.previous());
  await waitFor(() => expect(result.current.playing).toBe(true));
  expect(result.current.selected?.id).toBe('one');
});

it('treats a replacement source as a new resource even when its id is reused', async () => {
  const { engine } = setup();
  const original = audioResource('one');
  const { result, rerender } = renderHook(
    ({ resource }) => useAudioControls({ engine, resource }),
    { initialProps: { resource: original } },
  );
  act(() => result.current.toggle());
  await waitFor(() => expect(result.current.playing).toBe(true));
  rerender({ resource: { ...original, src: '/test-only/replacement.wav' } });
  expect(result.current.active).toBe(false);
  act(() => result.current.toggle());
  await waitFor(() => expect(result.current.playing).toBe(true));
  expect(engine.store.getState().channels.narration.resource?.src).toBe(
    '/test-only/replacement.wav',
  );
});

it.each(['back', 'exit'] as const)(
  'stops every channel, queue and guidance before %s callback',
  async (action) => {
    const { engine } = setup();
    const callback = vi.fn(() => {
      expect(engine.store.getState().queue).toEqual([]);
      expect(
        Object.values(engine.store.getState().channels).every(
          (channel) => channel.status === 'stopped',
        ),
      ).toBe(true);
      expect(voiceGuidance.getState().status).toBe('idle');
    });
    const { result } = renderHook(() =>
      useAudioControls({ engine, onBack: callback, onExit: callback }),
    );
    await act(async () => {
      await engine.play(audioResource('one'));
      await engine.play(audioResource('music'), 'music');
      await engine.play(audioResource('effect'), 'effects');
      engine.enqueue([audioResource('two')]);
    });
    act(() => result.current[action]());
    expect(callback).toHaveBeenCalledOnce();
  },
);

it('has no effects for unavailable playback and navigation commands', () => {
  const { engine, audio } = setup();
  const stop = vi.spyOn(engine, 'stopAll');
  const { result } = renderHook(() => useAudioControls({ engine }));
  act(() => {
    result.current.toggle();
    result.current.replay();
    result.current.next();
    result.current.previous();
    result.current.back();
    result.current.exit();
  });
  expect(audio.play).not.toHaveBeenCalled();
  expect(stop).not.toHaveBeenCalled();
});

it('keeps feedback opt-in, respects mute and disposes its Web Audio resources', async () => {
  const play = vi
    .spyOn(TonePreview.prototype, 'play')
    .mockResolvedValue(undefined);
  const dispose = vi.spyOn(TonePreview.prototype, 'dispose');
  const { engine } = setup();
  const { result, unmount } = renderHook(() =>
    useAudioControls({ engine, resource: audioResource('one') }),
  );
  act(() => result.current.toggle());
  await waitFor(() => expect(result.current.playing).toBe(true));
  expect(play).not.toHaveBeenCalled();
  act(() => result.current.setFeedbackEnabled(true));
  expect(play).toHaveBeenCalledWith(expect.objectContaining({ gain: 0.04 }));
  play.mockClear();
  act(() => result.current.setVolume(0));
  act(() => result.current.toggle());
  expect(play).not.toHaveBeenCalled();
  unmount();
  expect(dispose).toHaveBeenCalledOnce();
});

it('exposes a text fallback if Web Audio feedback fails', async () => {
  vi.spyOn(TonePreview.prototype, 'play').mockRejectedValue(
    new Error('Web Audio unavailable'),
  );
  const { engine } = setup();
  const { result } = renderHook(() => useAudioControls({ engine }));
  act(() => result.current.setFeedbackEnabled(true));
  await waitFor(() => expect(result.current.feedbackUnavailable).toBe(true));
});

it('uses the existing explicit guidance setting and pauses an injected player first', async () => {
  const speak = vi.spyOn(voiceGuidance, 'speak').mockResolvedValue(undefined);
  const { engine } = setup();
  preferencesStore.setState({
    status: 'ready',
    preferences: { ...defaultPreferences, voiceGuidance: false },
  });
  const { result } = renderHook(() => useAudioControls({ engine }));
  act(() => result.current.listenToGuidance());
  expect(speak).not.toHaveBeenCalled();
  act(() =>
    preferencesStore.setState({
      preferences: { ...defaultPreferences, voiceGuidance: true },
    }),
  );
  await act(() => engine.play(audioResource('one')));
  act(() => result.current.listenToGuidance());
  expect(engine.store.getState().channels.narration.status).toBe('paused');
  expect(speak).toHaveBeenCalledWith(voiceMessages.appHelp);
});

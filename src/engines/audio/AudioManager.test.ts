import { afterEach, expect, it, vi } from 'vitest';
import { AudioManager } from './AudioManager';
import { registerAudioStop, stopAudio } from './audioFocus';
import { voiceGuidance } from './VoiceGuidance';
import { audioResource, fakeAudio } from '@/test/audioTestUtils';

afterEach(() => {
  vi.restoreAllMocks();
});

it('coordinates with existing guidance/tones and handles StrictMode attach/cleanup', async () => {
  const manager = new AudioManager({
    source: { resolve: async (item) => item.src },
    createElement: () => fakeAudio().element,
  });
  const stopSpeech = vi.spyOn(voiceGuidance, 'stop');
  const stopTone = vi.fn();
  const unregister = registerAudioStop(stopTone);
  const firstDetach = manager.attach();
  firstDetach();
  firstDetach();
  const detach = manager.attach();
  const secondConsumer = manager.attach();
  await manager.play(audioResource('story'));
  expect(stopSpeech).toHaveBeenCalled();
  expect(stopTone).toHaveBeenCalledOnce();
  detach();
  expect(manager.store.getState().channels.narration.status).toBe('playing');
  stopAudio();
  expect(manager.store.getState().channels.narration.status).toBe('stopped');
  secondConsumer();
  unregister();
  await manager.dispose();
});

it('pauses all channels when hidden and never automatically resumes on return', async () => {
  const manager = new AudioManager({
    source: { resolve: async (item) => item.src },
    createElement: () => fakeAudio().element,
  });
  const detach = manager.attach();
  await manager.play(audioResource('story'));
  await manager.play(audioResource('music'), 'music');
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  document.dispatchEvent(new Event('visibilitychange'));
  expect(manager.store.getState().channels.narration.status).toBe('paused');
  expect(manager.store.getState().channels.music.status).toBe('paused');
  hidden.mockReturnValue(false);
  document.dispatchEvent(new Event('visibilitychange'));
  expect(manager.store.getState().channels.narration.status).toBe('paused');
  detach();
  await manager.dispose();
});

it('closes the context on final detach and can create a fresh one after remount', async () => {
  const contexts: { close: ReturnType<typeof vi.fn> }[] = [];
  vi.stubGlobal(
    'AudioContext',
    class {
      state = 'running';
      close = vi.fn(async () => {
        this.state = 'closed';
      });
      constructor() {
        contexts.push(this);
      }
    },
  );
  const manager = new AudioManager({
    source: { resolve: async (item) => item.src },
    createElement: () => fakeAudio().element,
  });
  try {
    const detach = manager.attach();
    await manager.play(audioResource('a'));
    detach();
    expect(contexts[0]?.close).toHaveBeenCalledOnce();
    const remount = manager.attach();
    await manager.play(audioResource('b'));
    expect(contexts).toHaveLength(2);
    expect(manager.store.getState().channels.narration.status).toBe('playing');
    remount();
    expect(contexts[1]?.close).toHaveBeenCalledOnce();
  } finally {
    await manager.dispose();
    vi.unstubAllGlobals();
  }
});

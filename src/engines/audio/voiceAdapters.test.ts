import { afterEach, describe, expect, it, vi } from 'vitest';
import { deferred, fakeAudio } from '@/test/audioTestUtils';
import { browserVietnameseTts, RecordedVoiceAdapter } from './voiceAdapters';
import { VoiceUnavailableError, type VoicePlayback } from './voiceTypes';

const message = {
  id: 'test-recording',
  text: 'Nội dung kiểm thử',
  audioSrc: '/test-only/voice.wav',
};
function playback() {
  const controller = new AbortController();
  const options: VoicePlayback = {
    rate: 0.8,
    volume: 0.35,
    signal: controller.signal,
    onStarted: vi.fn(),
  };
  return { controller, options };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('RecordedVoiceAdapter', () => {
  it('plays actual resolved media with rate/volume and cleans up on end', async () => {
    const audio = fakeAudio();
    const resolve = vi.fn().mockResolvedValue(message.audioSrc);
    const adapter = new RecordedVoiceAdapter(() => audio.element, { resolve });
    const { options } = playback();
    const pending = adapter.play(message, options);
    await vi.waitFor(() => expect(audio.play).toHaveBeenCalledOnce());
    expect(audio.element.volume).toBe(0.35);
    expect(audio.element.playbackRate).toBe(0.8);
    expect(options.onStarted).not.toHaveBeenCalled();
    audio.element.dispatchEvent(new Event('playing'));
    expect(options.onStarted).toHaveBeenCalledOnce();
    audio.element.dispatchEvent(new Event('ended'));
    await pending;
    expect(audio.pause).toHaveBeenCalledOnce();
    expect(audio.element).not.toHaveAttribute('src');
    expect(audio.element.onplaying).toBeNull();
  });

  it('cancels a pending cache lookup and never starts late media', async () => {
    const asset = deferred<string>();
    const createAudio = vi.fn(() => fakeAudio().element);
    const adapter = new RecordedVoiceAdapter(createAudio, {
      resolve: () => asset.promise,
    });
    const { controller, options } = playback();
    const pending = adapter.play(message, options);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    asset.resolve(message.audioSrc);
    await Promise.resolve();
    expect(createAudio).not.toHaveBeenCalled();
  });

  it('releases cached Blob URLs when cancelled during playback', async () => {
    const createUrl = vi.fn(() => 'blob:test-voice');
    const revokeUrl = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: createUrl,
      revokeObjectURL: revokeUrl,
    });
    const audio = fakeAudio();
    const adapter = new RecordedVoiceAdapter(() => audio.element, {
      resolve: async () => new Blob(['test-only']),
    });
    const { controller, options } = playback();
    const pending = adapter.play(message, options);
    await vi.waitFor(() => expect(audio.play).toHaveBeenCalledOnce());
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(revokeUrl).toHaveBeenCalledWith('blob:test-voice');
    expect(audio.pause).toHaveBeenCalledOnce();
  });

  it('rejects blocked playback and clears the source for retry', async () => {
    const audio = fakeAudio({
      play: () =>
        Promise.reject(new DOMException('Blocked', 'NotAllowedError')),
    });
    const adapter = new RecordedVoiceAdapter(() => audio.element, {
      resolve: async () => message.audioSrc,
    });
    await expect(
      adapter.play(message, playback().options),
    ).rejects.toMatchObject({ name: 'NotAllowedError' });
    expect(audio.element).not.toHaveAttribute('src');
    expect(audio.element.onerror).toBeNull();
  });

  it('reports media errors and a load timeout instead of hanging', async () => {
    const audio = fakeAudio();
    const adapter = new RecordedVoiceAdapter(() => audio.element, {
      resolve: async () => message.audioSrc,
    });
    const errorPending = adapter.play(message, playback().options);
    const errorAssertion = expect(errorPending).rejects.toThrow(
      'Recording playback failed',
    );
    await vi.waitFor(() => expect(audio.play).toHaveBeenCalled());
    audio.element.dispatchEvent(new Event('error'));
    await errorAssertion;
    vi.useFakeTimers();
    const hung = deferred<string>();
    const hanging = new RecordedVoiceAdapter(() => audio.element, {
      resolve: () => hung.promise,
    });
    const pending = hanging.play(message, playback().options);
    const assertion = expect(pending).rejects.toThrow('Recording load timeout');
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
    hung.resolve(message.audioSrc);
    await Promise.resolve();
    expect(audio.play).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects missing recordings and already aborted requests', async () => {
    const adapter = new RecordedVoiceAdapter();
    await expect(
      adapter.play({ id: 'missing', text: 'Nội dung' }, playback().options),
    ).rejects.toBeInstanceOf(VoiceUnavailableError);
    const { controller, options } = playback();
    controller.abort();
    await expect(adapter.play(message, options)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('cleans up when an asset provider throws synchronously', async () => {
    vi.useFakeTimers();
    const createAudio = vi.fn(() => fakeAudio().element);
    const adapter = new RecordedVoiceAdapter(createAudio, {
      resolve: () => {
        throw new Error('Storage source failed');
      },
    });
    await expect(adapter.play(message, playback().options)).rejects.toThrow(
      'Storage source failed',
    );
    expect(createAudio).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

class TestUtterance {
  voice: unknown = null;
  lang = '';
  rate = 1;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(readonly text: string) {}
}
function speech() {
  const local = { lang: 'vi-VN', localService: true };
  const speak = vi.fn<(utterance: TestUtterance) => void>();
  const cancel = vi.fn();
  const getVoices = vi.fn(() => [
    { lang: 'vi-VN', localService: false },
    local,
  ]);
  vi.stubGlobal('SpeechSynthesisUtterance', TestUtterance);
  vi.stubGlobal('speechSynthesis', { getVoices, speak, cancel });
  return { local, speak, cancel, getVoices };
}

describe('optional local Vietnamese TTS', () => {
  it('uses only a local Vietnamese voice and passes rate, volume and transcript', async () => {
    const { local, speak, cancel } = speech();
    const { options } = playback();
    const pending = browserVietnameseTts.play(message, options);
    const utterance = speak.mock.calls[0]?.[0];
    expect(utterance).toMatchObject({
      text: message.text,
      rate: 0.8,
      volume: 0.35,
      lang: 'vi-VN',
      voice: local,
    });
    expect(options.onStarted).toHaveBeenCalledOnce();
    utterance?.onend?.();
    await pending;
    expect(cancel).not.toHaveBeenCalled();
    expect(utterance?.onerror).toBeNull();
  });

  it('cancels its own utterance and ignores later callbacks', async () => {
    const { speak, cancel } = speech();
    const { controller, options } = playback();
    const pending = browserVietnameseTts.play(message, options);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(cancel).toHaveBeenCalledOnce();
    expect(speak.mock.calls[0]?.[0].onend).toBeNull();
  });

  it('rejects missing API, remote voices and local voices in other languages', async () => {
    vi.stubGlobal('speechSynthesis', undefined);
    await expect(
      browserVietnameseTts.play(message, playback().options),
    ).rejects.toBeInstanceOf(VoiceUnavailableError);
    const { getVoices, speak } = speech();
    getVoices.mockReturnValue([
      { lang: 'vi-VN', localService: false },
      { lang: 'en-US', localService: true },
    ]);
    await expect(
      browserVietnameseTts.play(message, playback().options),
    ).rejects.toBeInstanceOf(VoiceUnavailableError);
    expect(speak).not.toHaveBeenCalled();
  });

  it('reports synthesis failures and handles already cancelled requests', async () => {
    const { speak } = speech();
    const { options } = playback();
    const pending = browserVietnameseTts.play(message, options);
    speak.mock.calls[0]?.[0].onerror?.();
    await expect(pending).rejects.toThrow('Local speech failed');
    const aborted = playback();
    aborted.controller.abort();
    await expect(
      browserVietnameseTts.play(message, aborted.options),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(speak).toHaveBeenCalledOnce();
  });
});

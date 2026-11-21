import { offlineAudioSource } from '@/lib/storage/audioRepository';
import type { AudioAssetSource } from './types';
import { VoiceUnavailableError, type VoiceAdapter } from './voiceTypes';

/** Uses the existing IndexedDB audio cache, then the configured recording URL. */
export class RecordedVoiceAdapter implements VoiceAdapter {
  constructor(
    private readonly createAudio: () => HTMLAudioElement = () => new Audio(),
    private readonly assets: AudioAssetSource = offlineAudioSource,
  ) {}

  play: VoiceAdapter['play'] = (message, playback) => {
    if (!message.audioSrc) return Promise.reject(new VoiceUnavailableError());
    const src = message.audioSrc;
    return new Promise<void>((resolve, reject) => {
      let audio: HTMLAudioElement | undefined;
      let objectUrl: string | undefined;
      let settled = false;
      const finish = (error?: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        playback.signal.removeEventListener('abort', aborted);
        if (audio) {
          audio.onplaying = null;
          audio.onloadedmetadata = null;
          audio.onended = null;
          audio.onerror = null;
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        }
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        if (error) reject(error);
        else resolve();
      };
      const aborted = () => finish(new DOMException('Aborted', 'AbortError'));
      const timeout = setTimeout(
        () => finish(new Error('Recording load timeout')),
        15_000,
      );
      if (playback.signal.aborted) {
        aborted();
        return;
      }
      playback.signal.addEventListener('abort', aborted, { once: true });
      void Promise.resolve()
        .then(() => {
          playback.signal.throwIfAborted();
          return this.assets.resolve(
            {
              id: `voice:${message.id}`,
              src,
              title: message.id,
              transcript: message.text,
            },
            playback.signal,
          );
        })
        .then((asset) => {
          if (settled) return;
          audio = this.createAudio();
          audio.volume = playback.volume;
          // Source selection can reset playbackRate to defaultPlaybackRate.
          audio.defaultPlaybackRate = playback.rate;
          audio.playbackRate = playback.rate;
          audio.preservesPitch = true;
          audio.onloadedmetadata = () => {
            if (audio) audio.playbackRate = playback.rate;
          };
          audio.onplaying = () => {
            clearTimeout(timeout);
            playback.onStarted();
          };
          audio.onended = () => finish();
          audio.onerror = () => finish(new Error('Recording playback failed'));
          if (typeof asset === 'string') audio.src = asset;
          else {
            objectUrl = URL.createObjectURL(asset);
            audio.src = objectUrl;
          }
          return audio.play();
        })
        .catch((error: unknown) =>
          finish(error || new Error('Recording playback failed')),
        );
    });
  };
}

/** Optional adapter. Never selects a remote or non-Vietnamese voice. */
export const browserVietnameseTts: VoiceAdapter = {
  play(message, { rate, volume, signal, onStarted }) {
    return new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      if (
        typeof window === 'undefined' ||
        !window.speechSynthesis ||
        typeof SpeechSynthesisUtterance === 'undefined'
      ) {
        reject(new VoiceUnavailableError());
        return;
      }
      const synthesis = window.speechSynthesis;
      const voice = synthesis
        .getVoices()
        .find(
          (candidate) =>
            candidate.localService && /^vi(?:-|$)/i.test(candidate.lang),
        );
      if (!voice) {
        reject(new VoiceUnavailableError());
        return;
      }
      const utterance = new SpeechSynthesisUtterance(message.text);
      let settled = false;
      const finish = (error?: unknown) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', aborted);
        utterance.onend = null;
        utterance.onerror = null;
        if (error) reject(error);
        else resolve();
      };
      const aborted = () => {
        finish(new DOMException('Aborted', 'AbortError'));
        synthesis.cancel();
      };
      utterance.voice = voice;
      utterance.lang = 'vi-VN';
      utterance.rate = rate;
      utterance.volume = volume;
      utterance.onend = () => finish();
      utterance.onerror = () => finish(new Error('Local speech failed'));
      signal.addEventListener('abort', aborted, { once: true });
      try {
        synthesis.speak(utterance);
        onStarted();
      } catch (error: unknown) {
        finish(error || new Error('Local speech failed'));
      }
    });
  },
};

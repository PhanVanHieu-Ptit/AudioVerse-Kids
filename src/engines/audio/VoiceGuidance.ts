import { stopAudio } from './audioFocus';

export type GuidanceStatus = 'idle' | 'speaking' | 'unavailable' | 'error';
export interface SpeechPort {
  speak: (
    text: string,
    rate: number,
    ended: () => void,
    failed: () => void,
  ) => boolean;
  cancel: () => void;
}

/** Owns one utterance. A newer request cancels the previous one, never queues. */
export class VoiceGuidance {
  private status: GuidanceStatus = 'idle';
  private revision = 0;
  private port: SpeechPort | null = null;
  private listeners = new Set<() => void>();

  constructor(private readonly getPort: () => SpeechPort | null) {}
  getSnapshot = () => this.status;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private setStatus(status: GuidanceStatus) {
    this.status = status;
    this.listeners.forEach((listener) => listener());
  }
  stop = () => {
    this.revision++;
    this.port?.cancel();
    this.setStatus('idle');
  };
  speak(text: string, rate: number) {
    this.stop();
    stopAudio();
    const revision = this.revision;
    this.port = this.getPort();
    if (!this.port) {
      this.setStatus('unavailable');
      return;
    }
    this.setStatus('speaking');
    try {
      const available = this.port.speak(
        text,
        rate,
        () => {
          if (revision === this.revision) this.setStatus('idle');
        },
        () => {
          if (revision === this.revision) this.setStatus('error');
        },
      );
      if (!available) this.setStatus('unavailable');
    } catch {
      this.setStatus('error');
    }
  }
}

function browserSpeech(): SpeechPort | null {
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window) ||
    !window.speechSynthesis ||
    typeof SpeechSynthesisUtterance === 'undefined'
  )
    return null;
  const synthesis = window.speechSynthesis;
  return {
    cancel: () => synthesis.cancel(),
    speak(text, rate, ended, failed) {
      // Do not send child-facing content to an online speech service.
      const voice = synthesis
        .getVoices()
        .find(
          (candidate) =>
            candidate.localService && /^vi(?:-|$)/i.test(candidate.lang),
        );
      if (!voice) return false;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = 'vi-VN';
      utterance.rate = rate;
      utterance.onend = ended;
      utterance.onerror = failed;
      synthesis.speak(utterance);
      return true;
    },
  };
}

export const voiceGuidance = new VoiceGuidance(browserSpeech);

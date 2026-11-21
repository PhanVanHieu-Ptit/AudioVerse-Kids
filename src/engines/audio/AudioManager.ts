import { AudioEngine } from './AudioEngine';
import { registerAudioStop, stopAudio } from './audioFocus';
import { voiceGuidance } from './VoiceGuidance';
import type { AudioChannelName, AudioResource, PlayOptions } from './types';

/** Application coordinator; engines should import the shared instance below. */
export class AudioManager extends AudioEngine {
  private consumers = 0;
  private detach: (() => void) | undefined;
  private managerDisposed = false;

  private claimFocus() {
    if (this.managerDisposed) return;
    voiceGuidance.stop();
    stopAudio(this.stopAll);
  }

  override play(
    resource: AudioResource,
    channel: AudioChannelName = 'narration',
    options: PlayOptions = {},
  ) {
    this.claimFocus();
    return super.play(resource, channel, options);
  }
  override resume(channel: AudioChannelName = 'narration') {
    this.claimFocus();
    return super.resume(channel);
  }
  override replay(channel: AudioChannelName = 'narration') {
    this.claimFocus();
    return super.replay(channel);
  }
  override playQueue() {
    this.claimFocus();
    return super.playQueue();
  }
  override interrupt(resource: AudioResource) {
    this.claimFocus();
    return super.interrupt(resource);
  }

  /** Reference counted so React StrictMode and multiple consumers are safe. */
  attach() {
    if (this.managerDisposed) return () => undefined;
    if (this.consumers++ === 0) {
      const unregister = registerAudioStop(this.stopAll);
      const pauseAll = () => {
        for (const name of ['narration', 'music', 'effects'] as const)
          this.pause(name);
      };
      const hidden = () => {
        if (document.hidden) pauseAll();
      };
      document.addEventListener('visibilitychange', hidden);
      window.addEventListener('pagehide', pauseAll);
      this.detach = () => {
        unregister();
        document.removeEventListener('visibilitychange', hidden);
        window.removeEventListener('pagehide', pauseAll);
      };
    }
    let attached = true;
    return () => {
      if (!attached) return;
      attached = false;
      if (--this.consumers === 0) {
        this.detach?.();
        this.detach = undefined;
        void this.releaseResources().catch(() => {
          /* Browser/device may already have closed the context. */
        });
      }
    };
  }

  override async dispose() {
    this.managerDisposed = true;
    this.detach?.();
    this.detach = undefined;
    await super.dispose();
  }
}

export const audioManager = new AudioManager();
export const audioStore = audioManager.store;

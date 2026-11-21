import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { audioManager } from '@/engines/audio/AudioManager';
import type { AudioEngine } from '@/engines/audio/AudioEngine';
import type { AudioChannelName, AudioResource } from '@/engines/audio/types';
import { TonePreview } from '@/engines/audio/TonePreview';
import { stopAudio } from '@/engines/audio/audioFocus';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';
import { voiceMessages } from '@/content/voiceMessages';
import type { VoiceMessage } from '@/engines/audio/voiceTypes';
import { audioShortcuts, controlFeedbackTone } from '@/content/audioControls';
import { playerLabels } from '@/content/audioPlayer';
import { useAudioPlayer } from './useAudioPlayer';
import { useVoiceGuidance } from './useVoiceGuidance';

export interface AudioControlsOptions {
  resource?: AudioResource | undefined;
  /** Ordered, approved resources; selecting a neighbour starts it on user request. */
  playlist?: readonly AudioResource[] | undefined;
  channel?: AudioChannelName | undefined;
  engine?: AudioEngine | undefined;
  instructions?: VoiceMessage | undefined;
  onBack?: (() => void) | undefined;
  onExit?: (() => void) | undefined;
}

function sameResource(a: AudioResource | null | undefined, b: AudioResource) {
  return a?.id === b.id && a.src === b.src;
}

/** Shared engine owns playback; mounting/unmounting controls never starts/stops it. */
export function useAudioControls({
  resource,
  playlist = [],
  channel = 'narration',
  engine = audioManager,
  instructions = voiceMessages.appHelp,
  onBack,
  onExit,
}: AudioControlsOptions = {}) {
  const player = useAudioPlayer(channel, engine);
  const guidance = useVoiceGuidance();
  const [helpOpen, setHelpOpen] = useState(false);
  const [shortcutsEnabled, setShortcutsEnabled] = useState(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(false);
  const [feedbackUnavailable, setFeedbackUnavailable] = useState(false);
  const feedback = useRef<TonePreview | undefined>(undefined);
  useEffect(
    () => () => {
      void feedback.current?.dispose().catch(() => undefined);
      feedback.current = undefined;
    },
    [],
  );

  const selected = playlist.length
    ? (playlist.find((item) => sameResource(player.resource, item)) ??
      playlist.find((item) => sameResource(resource, item)) ??
      playlist[0])
    : (resource ?? player.resource);
  const active = !!selected && sameResource(player.resource, selected);
  const status = active ? player.status : 'idle';
  const loading = status === 'loading';
  const playing = status === 'playing';
  const index = playlist.findIndex(
    (item) => !!selected && sameResource(selected, item),
  );
  const previous = index > 0 ? playlist[index - 1] : undefined;
  const next = index >= 0 ? playlist[index + 1] : undefined;
  const guidanceActive =
    guidance.busy && guidance.message?.id === instructions.id;

  function signal(volume = player.volume, enabled = feedbackEnabled) {
    if (!enabled || !Number.isFinite(volume) || volume <= 0) return;
    feedback.current ??= new TonePreview(() => undefined);
    void feedback.current
      .play({
        ...controlFeedbackTone,
        gain: controlFeedbackTone.gain * Math.min(1, volume),
      })
      .catch(() => setFeedbackUnavailable(true));
  }

  function toggle() {
    if (!selected || loading) return;
    signal();
    if (playing) player.pause();
    else if (active) void player.resume();
    else void player.play(selected);
  }
  function replay() {
    if (!selected || loading) return;
    signal();
    if (active) void player.replay();
    else void player.play(selected);
  }
  function changeContent(item: AudioResource | undefined) {
    if (!item) return;
    signal();
    void player.play(item);
  }
  function leave(callback: (() => void) | undefined) {
    if (!callback) return;
    feedback.current?.stop();
    voiceGuidance.stop();
    engine.stopAll();
    stopAudio();
    callback();
  }
  function listenToGuidance() {
    if (!guidance.enabled) return;
    feedback.current?.stop();
    if (guidanceActive) guidance.stop();
    else {
      // Also quiet injected engines that are outside the app's audio-focus registry.
      for (const name of ['narration', 'music', 'effects'] as const)
        engine.pause(name);
      guidance.speak(instructions);
    }
  }
  function openHelp() {
    feedback.current?.stop();
    for (const name of ['narration', 'music', 'effects'] as const)
      engine.pause(name);
    setHelpOpen(true);
  }
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (
      !shortcutsEnabled ||
      helpOpen ||
      event.defaultPrevented ||
      event.repeat ||
      event.nativeEvent.isComposing ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    )
      return;
    const target = event.target;
    if (
      !(target instanceof Element) ||
      !event.currentTarget.contains(target) ||
      target.closest(
        'input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="slider"], [role="combobox"], dialog',
      )
    )
      return;
    const shortcut = audioShortcuts.find(
      (item) => item.key === event.key.toLowerCase(),
    );
    if (!shortcut) return;
    event.preventDefault();
    switch (shortcut.action) {
      case 'toggle':
        toggle();
        break;
      case 'replay':
        replay();
        break;
      case 'previous':
        changeContent(previous);
        break;
      case 'next':
        changeContent(next);
        break;
      case 'guidance':
        listenToGuidance();
        break;
      case 'help':
        openHelp();
        break;
    }
  }

  return {
    player,
    selected,
    active,
    status,
    loading,
    playing,
    error: active ? player.error : null,
    actionLabel: playing
      ? playerLabels.pause
      : status === 'error'
        ? playerLabels.retry
        : status === 'paused' || status === 'blocked'
          ? playerLabels.resume
          : playerLabels.play,
    canPrevious: !!previous,
    canNext: !!next,
    canBack: !!onBack,
    canExit: !!onExit,
    toggle,
    replay,
    previous: () => changeContent(previous),
    next: () => changeContent(next),
    stop: () => {
      signal();
      player.stop();
    },
    setVolume: (value: number) => {
      player.setVolume(value);
      signal(value);
    },
    setPlaybackRate: (value: number) => {
      player.setPlaybackRate(value);
      signal();
    },
    back: () => leave(onBack),
    exit: () => leave(onExit),
    instructions,
    guidanceEnabled: guidance.enabled,
    guidanceActive,
    guidanceLoading: guidanceActive && guidance.status === 'loading',
    guidanceError:
      guidance.message?.id === instructions.id &&
      (guidance.status === 'error' || guidance.status === 'unavailable')
        ? guidance.status
        : null,
    listenToGuidance,
    helpOpen,
    openHelp,
    closeHelp: () => setHelpOpen(false),
    shortcutsEnabled,
    setShortcutsEnabled,
    onKeyDown,
    feedbackEnabled,
    feedbackUnavailable,
    setFeedbackEnabled: (enabled: boolean) => {
      setFeedbackEnabled(enabled);
      if (!enabled) feedback.current?.stop();
      else signal(player.volume, true);
    },
  };
}

export type AudioControls = ReturnType<typeof useAudioControls>;

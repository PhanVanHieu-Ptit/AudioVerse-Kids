import { useEffect, useRef, useState } from 'react';
import { TonePreview } from '@/engines/audio/TonePreview';
import { tonePreview } from '@/content/designSystem';
import type { AudioControlState } from '@/content/audioControls';
import { registerAudioStop, stopAudio } from '@/engines/audio/audioFocus';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';

export function useTonePreview(
  configuration: Parameters<TonePreview['play']>[0] = tonePreview,
) {
  const engine = useRef<TonePreview | null>(null);
  const request = useRef(0);
  const [state, setState] = useState<AudioControlState>('ready');
  const stopPlayback = useRef<() => void>(() => undefined);
  useEffect(() => {
    const preview = new TonePreview(() => setState('ready'));
    engine.current = preview;
    const stop = () => {
      request.current++;
      preview.stop();
      setState('ready');
    };
    stopPlayback.current = stop;
    const unregister = registerAudioStop(stop);
    const onVisibilityChange = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      request.current++;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      unregister();
      engine.current = null;
      void preview.dispose().catch(() => {
        /* Browser may already have closed the audio context. */
      });
    };
  }, []);

  async function activate() {
    const preview = engine.current;
    if (!preview) return;
    if (state === 'playing') {
      request.current++;
      preview.stop();
      setState('paused');
      return;
    }
    setState('loading');
    voiceGuidance.stop();
    stopAudio(stopPlayback.current);
    const currentRequest = ++request.current;
    try {
      await preview.play(configuration);
      if (engine.current === preview && request.current === currentRequest)
        setState('playing');
    } catch {
      if (engine.current === preview && request.current === currentRequest)
        setState('error');
    }
  }
  function stop() {
    request.current++;
    engine.current?.stop();
    setState('ready');
  }
  return { state, activate, stop };
}

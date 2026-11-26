import { useCallback, useEffect, useRef, useState } from 'react';
import { MusicEngine } from '@/engines/music/MusicEngine';
import {
  DEFAULT_TEMPO,
  type MusicStep,
} from '@/engines/music/InstrumentLibrary';
import { registerAudioStop, stopAudio } from '@/engines/audio/audioFocus';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';

export function useMusicEngine() {
  const engine = useRef<MusicEngine | null>(null);
  const revision = useRef(0);
  const stopRef = useRef(() => {});
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'playing' | 'error'
  >('idle');
  useEffect(() => {
    const player = new MusicEngine();
    engine.current = player;
    const stop = () => {
      revision.current++;
      player.stop();
      setStatus('idle');
    };
    stopRef.current = stop;
    const unregister = registerAudioStop(stop);
    const hidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      revision.current++;
      engine.current = null;
      unregister();
      document.removeEventListener('visibilitychange', hidden);
      void player.dispose().catch(() => undefined);
    };
  }, []);

  async function play(
    steps: readonly MusicStep[],
    tempo = DEFAULT_TEMPO,
    onEnded?: () => void,
  ) {
    const player = engine.current;
    if (!player) return false;
    voiceGuidance.stop();
    stopAudio(stopRef.current);
    const request = ++revision.current;
    setStatus('loading');
    try {
      const started = await player.play(steps, tempo, () => {
        if (revision.current !== request || engine.current !== player) return;
        setStatus('idle');
        onEnded?.();
      });
      if (revision.current !== request || engine.current !== player)
        return false;
      if (started) setStatus('playing');
      return started;
    } catch {
      if (revision.current === request && engine.current === player)
        setStatus('error');
      return false;
    }
  }

  const stop = useCallback(() => stopRef.current(), []);
  return {
    status,
    play,
    stop,
    setVolume: (value: number) => engine.current?.setVolume(value),
  };
}

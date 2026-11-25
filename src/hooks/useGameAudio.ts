import { useEffect, useRef, useState } from 'react';
import { GameAudio } from '@/engines/audio/GameAudio';
import { registerAudioStop, stopAudio } from '@/engines/audio/audioFocus';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';
import type { GameSound } from '@/types/game';

export function useGameAudio() {
  const engine = useRef<GameAudio | null>(null);
  const revision = useRef(0);
  const stopRef = useRef<() => void>(() => undefined);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'playing' | 'error'
  >('idle');
  useEffect(() => {
    const player = new GameAudio(() => setStatus('idle'));
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
      unregister();
      document.removeEventListener('visibilitychange', hidden);
      engine.current = null;
      void player.dispose().catch(() => undefined);
    };
  }, []);

  async function play(sound: GameSound) {
    const player = engine.current;
    if (!player) return;
    voiceGuidance.stop();
    stopAudio(stopRef.current);
    const request = ++revision.current;
    setStatus('loading');
    try {
      await player.play(sound);
      if (revision.current === request && engine.current === player)
        setStatus('playing');
    } catch {
      if (revision.current === request && engine.current === player)
        setStatus('error');
    }
  }

  return { status, play, stop: () => stopRef.current() };
}

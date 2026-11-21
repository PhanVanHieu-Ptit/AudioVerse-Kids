import { useEffect, useRef, useState } from 'react';
import { TonePreview } from '@/engines/audio/TonePreview';
import { tonePreview } from '@/content/designSystem';
import type { AudioControlState } from '@/content/audioControls';

export function useTonePreview(
  configuration: Parameters<TonePreview['play']>[0] = tonePreview,
) {
  const engine = useRef<TonePreview | null>(null);
  const [state, setState] = useState<AudioControlState>('ready');
  useEffect(() => {
    const preview = new TonePreview(() => setState('ready'));
    engine.current = preview;
    return () => {
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
      preview.stop();
      setState('paused');
      return;
    }
    setState('loading');
    try {
      await preview.play(configuration);
      if (engine.current === preview) setState('playing');
    } catch {
      if (engine.current === preview) setState('error');
    }
  }
  function stop() {
    engine.current?.stop();
    setState('ready');
  }
  return { state, activate, stop };
}

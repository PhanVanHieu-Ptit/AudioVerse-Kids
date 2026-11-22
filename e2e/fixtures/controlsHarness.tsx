import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AudioControlBar } from '../../src/components/organisms/AudioControlBar';
import { audioManager } from '../../src/engines/audio/AudioManager';
import type { AudioResource } from '../../src/engines/audio/types';
import {
  preferencesStore,
  defaultPreferences,
} from '../../src/stores/preferencesStore';
import '../../src/styles/tokens.css';
import '../../src/styles/global.css';
import '../../src/styles/components.css';

const playlist: AudioResource[] = ['Một', 'Hai'].map((name) => ({
  id: `control-test-${name}`,
  src: '/e2e/test-tone.wav',
  title: `Nội dung ${name}`,
  transcript: 'Nốt nhạc tổng hợp thật, chỉ dùng cho kiểm thử.',
}));
preferencesStore.setState({
  status: 'ready',
  preferences: {
    ...defaultPreferences,
    voiceGuidance: true,
    guidanceTts: false,
  },
});
audioManager.attach();
declare global {
  interface Window {
    controlsHarness: { engine: typeof audioManager };
  }
}
window.controlsHarness = { engine: audioManager };

export function Harness() {
  const [navigation, setNavigation] = useState('');
  return (
    <main style={{ padding: '1rem', maxWidth: '60rem', margin: 'auto' }}>
      <h1>Kiểm thử bộ điều khiển âm thanh</h1>
      <button type="button">Ngoài bộ điều khiển</button>
      <AudioControlBar
        playlist={playlist}
        onBack={() => setNavigation('Đã quay lại')}
        onExit={() => setNavigation('Đã thoát hoạt động')}
      />
      <p role="status" aria-label="Điều hướng kiểm thử">
        {navigation}
      </p>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<Harness />);

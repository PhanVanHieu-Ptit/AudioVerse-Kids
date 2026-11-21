import { useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { VoiceGuidanceService } from '../../src/engines/audio/VoiceGuidanceService';
import { RecordedVoiceAdapter } from '../../src/engines/audio/voiceAdapters';
import { audioRepository } from '../../src/lib/storage/audioRepository';
import '../../src/styles/tokens.css';
import '../../src/styles/global.css';
import '../../src/styles/components.css';

// Real media is supplied by the browser test, never shipped as Vietnamese speech.
const message = {
  id: 'recording-test',
  text: 'Âm tổng hợp kiểm thử đường phát bản thu, không phải giọng nói.',
  audioSrc: '/e2e/test-voice.wav',
};
const media: HTMLAudioElement[] = [];
const service = new VoiceGuidanceService(
  new RecordedVoiceAdapter(() => {
    const audio = new Audio();
    media.push(audio);
    return audio;
  }),
);
service.configure({ enabled: true, rate: 0.8, volume: 0.35 });
declare global {
  interface Window {
    voiceHarness: { service: VoiceGuidanceService; media: HTMLAudioElement[] };
  }
}
window.voiceHarness = { service, media };

export function Harness() {
  const state = useSyncExternalStore(service.subscribe, service.getState);
  const [downloaded, setDownloaded] = useState(false);
  return (
    <main>
      <h1>Kiểm thử bản thu hướng dẫn</h1>
      <p>{message.text}</p>
      <button type="button" onClick={() => void service.speak(message)}>
        Nghe bản thu kiểm thử
      </button>
      <button type="button" onClick={service.stop}>
        Dừng bản thu
      </button>
      <button type="button" onClick={() => void service.repeat()}>
        Đọc lại bản thu
      </button>
      <button
        type="button"
        onClick={() => {
          void audioRepository
            .download({
              id: `voice:${message.id}`,
              src: message.audioSrc,
              title: message.id,
              transcript: message.text,
            })
            .then(() => setDownloaded(true));
        }}
      >
        {downloaded ? 'Đã lưu bản thu kiểm thử' : 'Lưu bản thu kiểm thử'}
      </button>
      <p role="status">{state.status}</p>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<Harness />);

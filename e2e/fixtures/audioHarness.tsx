import { createRoot } from 'react-dom/client';
import { AudioEngine } from '../../src/engines/audio/AudioEngine';
import { AudioPlayer } from '../../src/components/organisms/AudioPlayer';
import { audioRepository } from '../../src/lib/storage/audioRepository';
import '../../src/styles/tokens.css';
import '../../src/styles/global.css';
import '../../src/styles/components.css';

const resource = {
  id: 'browser-test-tone',
  src: '/e2e/test-tone.wav',
  title: 'Âm kiểm thử',
  transcript: 'Nốt nhạc tổng hợp chỉ dành cho kiểm thử.',
};
const media: HTMLAudioElement[] = [];
const engine = new AudioEngine({
  createElement: () => {
    const element = new Audio();
    media.push(element);
    return element;
  },
});
declare global {
  interface Window {
    audioHarness: {
      engine: AudioEngine;
      resource: typeof resource;
      media: HTMLAudioElement[];
    };
  }
}
window.audioHarness = { engine, resource, media };

createRoot(document.getElementById('root')!).render(
  <>
    <h1>Kiểm thử trình phát</h1>
    <AudioPlayer engine={engine} resource={resource} />
    <button
      type="button"
      onClick={(event) => {
        const button = event.currentTarget;
        void audioRepository.download(resource).then(() => {
          button.textContent = 'Đã tải ngoại tuyến';
        });
      }}
    >
      Tải ngoại tuyến
    </button>
  </>,
);

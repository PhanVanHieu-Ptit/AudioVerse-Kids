import { afterEach, expect, it, vi } from 'vitest';
import { AudioMixer } from './AudioMixer';
import { AudioEngine } from './AudioEngine';
import { audioResource, fakeAudio } from '@/test/audioTestUtils';

function contextDouble() {
  const source = { connect: vi.fn(), disconnect: vi.fn() };
  const gain = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
  source.connect.mockReturnValue(gain);
  const context = {
    state: 'suspended',
    destination: {},
    resume: vi.fn(async () => {
      context.state = 'running';
    }),
    close: vi.fn(async () => {
      context.state = 'closed';
    }),
    createMediaElementSource: vi.fn(() => source),
    createGain: vi.fn(() => gain),
  };
  const constructed = vi.fn(function () {
    return context;
  });
  vi.stubGlobal('AudioContext', constructed);
  return { context, source, gain, constructed };
}
afterEach(() => vi.unstubAllGlobals());

it('creates one lazy context, reuses gain nodes and disconnects/closes on dispose', async () => {
  const { context, source, gain, constructed } = contextDouble();
  const mixer = new AudioMixer();
  expect(constructed).not.toHaveBeenCalled();
  await mixer.unlock();
  await mixer.unlock();
  const element = fakeAudio().element;
  mixer.volume(element, 0.25);
  mixer.volume(element, 0.5);
  expect(constructed).toHaveBeenCalledOnce();
  expect(context.createMediaElementSource).toHaveBeenCalledOnce();
  expect(gain.gain.value).toBe(0.5);
  expect(element.volume).toBe(1);
  await mixer.dispose();
  await mixer.dispose();
  expect(source.disconnect).toHaveBeenCalledOnce();
  expect(gain.disconnect).toHaveBeenCalledOnce();
  expect(context.close).toHaveBeenCalledOnce();
});

it('falls back to HTML audio volume when context resume is rejected', async () => {
  const { context } = contextDouble();
  context.resume.mockRejectedValue(
    new DOMException('Blocked', 'NotAllowedError'),
  );
  const mixer = new AudioMixer();
  await mixer.unlock();
  const element = fakeAudio().element;
  mixer.volume(element, 0.3);
  expect(element.volume).toBe(0.3);
  expect(context.createMediaElementSource).not.toHaveBeenCalled();
  await mixer.dispose();
});

it('recreates previously routed media for HTML fallback after a context fails to resume', async () => {
  const { context } = contextDouble();
  const elements: ReturnType<typeof fakeAudio>[] = [];
  const engine = new AudioEngine({
    source: { resolve: async (resource) => resource.src },
    createElement: () => {
      const media = fakeAudio();
      elements.push(media);
      return media.element;
    },
  });
  await engine.play(audioResource('a'));
  expect(context.createMediaElementSource).toHaveBeenCalledOnce();
  engine.pause();
  context.state = 'suspended';
  context.resume.mockRejectedValue(new Error('Device disconnected'));
  expect(await engine.resume()).toBe(true);
  expect(elements).toHaveLength(2);
  expect(elements[0]?.element.hasAttribute('src')).toBe(false);
  engine.setVolume(0.3);
  expect(elements[1]?.element.volume).toBe(0.3);
  await engine.dispose();
});

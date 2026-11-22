import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { AudioPlayer } from './AudioPlayer';
import { AudioEngine } from '@/engines/audio/AudioEngine';
import { audioResource, deferred, fakeAudio } from '@/test/audioTestUtils';

let engine: AudioEngine | undefined;
afterEach(async () => {
  await engine?.dispose();
});
function setup(play?: () => Promise<void>) {
  const element = fakeAudio(play ? { play } : {});
  engine = new AudioEngine({
    source: { resolve: async (item) => item.src },
    createElement: () => element.element,
  });
  return engine;
}

it('exposes an honest empty state and labelled native controls', () => {
  render(<AudioPlayer engine={setup()} />);
  expect(
    screen.getByRole('status', { name: 'Trạng thái âm thanh' }),
  ).toHaveTextContent('Chưa có bản thu âm được chọn.');
  expect(screen.getByRole('button', { name: 'Phát' })).toBeDisabled();
  expect(screen.getByRole('slider', { name: /Vị trí phát/ })).toBeDisabled();
  expect(screen.getByRole('slider', { name: /Âm lượng/ })).toBeEnabled();
  expect(screen.getByRole('combobox', { name: 'Tốc độ đọc' })).toBeEnabled();
});

it('plays and pauses from keyboard, shows transcript and stops from the UI', async () => {
  const user = userEvent.setup();
  render(<AudioPlayer engine={setup()} resource={audioResource('story')} />);
  screen.getByRole('button', { name: 'Phát' }).focus();
  await user.keyboard('{Enter}');
  expect(await screen.findByRole('button', { name: 'Tạm dừng' })).toBeEnabled();
  await user.keyboard(' ');
  expect(screen.getByRole('button', { name: 'Nghe tiếp' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(await screen.findByRole('button', { name: 'Tạm dừng' })).toBeEnabled();
  await user.click(screen.getByText('Nội dung bằng chữ'));
  expect(screen.getByText('Nội dung story')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Dừng' }));
  expect(
    screen.getByRole('status', { name: 'Trạng thái âm thanh' }),
  ).toHaveTextContent('Đã dừng.');
});

it('offers an explicit resume when browser autoplay is blocked', async () => {
  const play = vi
    .fn()
    .mockRejectedValueOnce(new DOMException('Blocked', 'NotAllowedError'))
    .mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(
    <AudioPlayer engine={setup(play)} resource={audioResource('story')} />,
  );
  await user.click(screen.getByRole('button', { name: 'Phát' }));
  const resume = await screen.findByRole('button', { name: 'Nghe tiếp' });
  expect(
    screen.getByRole('status', { name: 'Trạng thái âm thanh' }),
  ).toHaveTextContent('trình duyệt');
  await user.click(resume);
  expect(await screen.findByRole('button', { name: 'Tạm dừng' })).toBeEnabled();
});

it('preserves keyboard focus during loading and lets Stop cancel a pending source', async () => {
  const source = deferred<string>();
  engine = new AudioEngine({ source: { resolve: () => source.promise } });
  const user = userEvent.setup();
  render(<AudioPlayer engine={engine} resource={audioResource('story')} />);
  screen.getByRole('button', { name: 'Phát' }).focus();
  await user.keyboard('{Enter}');
  const loading = screen.getByRole('button', { name: 'Đang tải âm thanh…' });
  expect(loading).toHaveFocus();
  expect(loading).toHaveAttribute('aria-busy', 'true');
  await user.click(screen.getByRole('button', { name: 'Dừng' }));
  expect(
    screen.getByRole('status', { name: 'Trạng thái âm thanh' }),
  ).toHaveTextContent('Đã dừng.');
  source.resolve('/cancelled.wav');
});

it('retries a failed narration without discarding its queue', async () => {
  const current = setup(
    vi
      .fn()
      .mockRejectedValueOnce(new Error('Decode'))
      .mockResolvedValue(undefined),
  );
  const user = userEvent.setup();
  render(<AudioPlayer engine={current} resource={audioResource('story')} />);
  await user.click(screen.getByRole('button', { name: 'Phát' }));
  await screen.findByRole('button', { name: 'Thử lại' });
  current.enqueue([audioResource('next')]);
  await user.click(screen.getByRole('button', { name: 'Thử lại' }));
  await screen.findByRole('button', { name: 'Tạm dừng' });
  expect(current.store.getState().queue[0]?.id).toBe('next');
});

it('subscribes to another engine selecting narration and keeps the channel alive on unmount', async () => {
  const current = setup();
  const view = render(<AudioPlayer engine={current} />);
  await act(() => current.play(audioResource('learning')));
  expect(
    screen.getByRole('heading', { name: 'Âm thanh learning' }),
  ).toBeVisible();
  view.unmount();
  expect(current.store.getState().channels.narration.status).toBe('playing');
});

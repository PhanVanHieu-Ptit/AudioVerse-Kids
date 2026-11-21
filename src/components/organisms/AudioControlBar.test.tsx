import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AudioControlBar } from './AudioControlBar';
import { AudioEngine } from '@/engines/audio/AudioEngine';
import { audioResource, deferred, fakeAudio } from '@/test/audioTestUtils';
import {
  preferencesStore,
  defaultPreferences,
} from '@/stores/preferencesStore';

let engine: AudioEngine;
beforeEach(() => {
  preferencesStore.setState({
    status: 'ready',
    preferences: { ...defaultPreferences },
  });
  engine = new AudioEngine({
    source: { resolve: async (item) => item.src },
    createElement: () => fakeAudio().element,
  });
  // jsdom media/dialog boundary. Browser modality is exercised by Playwright.
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute('open', '');
        this.querySelector('button')?.focus();
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute('open');
      },
    },
  });
});
afterEach(async () => {
  await engine.dispose();
  vi.restoreAllMocks();
});
const playbackStatus = () =>
  screen.getByRole('status', { name: 'Trạng thái âm thanh' });

it('offers labelled controls with honest empty, guidance and navigation fallbacks', () => {
  render(<AudioControlBar engine={engine} />);
  expect(playbackStatus()).toHaveTextContent('Chưa có bản thu âm được chọn.');
  for (const name of [
    'Phát',
    'Nghe lại',
    'Nội dung trước',
    'Nội dung tiếp theo',
    'Quay lại',
    'Thoát hoạt động',
    'Nghe hướng dẫn',
  ]) {
    expect(screen.getByRole('button', { name })).toBeDisabled();
  }
  expect(screen.getByRole('slider', { name: /Âm lượng/ })).toBeEnabled();
  expect(
    screen.getByText(/Bật hướng dẫn giọng nói trong Cài đặt/),
  ).toBeVisible();
  expect(
    screen.getByRole('checkbox', { name: 'Bật phím tắt trong bộ điều khiển' }),
  ).not.toBeChecked();
});

it('supports sequential Tab, Enter and Space without enabling shortcuts', async () => {
  const user = userEvent.setup();
  render(<AudioControlBar engine={engine} resource={audioResource('one')} />);
  await user.tab();
  expect(screen.getByRole('button', { name: 'Phát' })).toHaveFocus();
  await user.keyboard('{Enter}');
  await screen.findByRole('button', { name: 'Tạm dừng' });
  await user.keyboard(' ');
  expect(screen.getByRole('button', { name: 'Nghe tiếp' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Nghe lại' })).toHaveFocus();
  await user.keyboard('{Enter}');
  await screen.findByRole('button', { name: 'Tạm dừng' });
});

it('keeps focus and exposes busy state while loading; stop cancels the source', async () => {
  const user = userEvent.setup();
  const pending = deferred<string>();
  await engine.dispose();
  engine = new AudioEngine({ source: { resolve: () => pending.promise } });
  render(<AudioControlBar engine={engine} resource={audioResource('one')} />);
  await user.tab();
  await user.keyboard('{Enter}');
  expect(
    screen.getByRole('button', { name: 'Đang tải âm thanh…' }),
  ).toHaveFocus();
  expect(
    screen.getByRole('button', { name: 'Đang tải âm thanh…' }),
  ).toHaveAttribute('aria-busy', 'true');
  await user.click(screen.getByRole('button', { name: 'Dừng' }));
  expect(playbackStatus()).toHaveTextContent('Đã dừng.');
  await act(async () => {
    pending.resolve('/test-only/one.wav');
  });
});

it('only handles opted-in shortcuts inside its own controls, ignoring editable/native fields and modifiers', async () => {
  const user = userEvent.setup();
  render(
    <>
      <button>Ở ngoài</button>
      <AudioControlBar engine={engine} resource={audioResource('one')} />
    </>,
  );
  const play = screen.getByRole('button', { name: 'Phát' });
  play.focus();
  await user.keyboard('p');
  expect(playbackStatus()).toHaveTextContent('Sẵn sàng phát.');
  await user.click(
    screen.getByRole('checkbox', { name: 'Bật phím tắt trong bộ điều khiển' }),
  );
  play.focus();
  for (const event of [
    { ctrlKey: true },
    { altKey: true },
    { metaKey: true },
    { repeat: true },
    { isComposing: true },
  ])
    fireEvent.keyDown(play, { key: 'p', ...event });
  const slider = screen.getByRole('slider', { name: /Âm lượng/ });
  slider.focus();
  await user.keyboard('pr[[]]h?');
  screen.getByRole('combobox').focus();
  await user.keyboard('pr[[]]h?');
  screen.getByRole('button', { name: 'Ở ngoài' }).focus();
  await user.keyboard('p');
  expect(playbackStatus()).toHaveTextContent('Sẵn sàng phát.');
  play.focus();
  await user.keyboard('p');
  await screen.findByRole('button', { name: 'Tạm dừng' });
  await user.keyboard('p');
  expect(playbackStatus()).toHaveTextContent('Đã tạm dừng.');
});

it('does not interfere with a second mounted controller', async () => {
  const user = userEvent.setup();
  const other = new AudioEngine();
  const view = render(
    <>
      <AudioControlBar engine={engine} resource={audioResource('one')} />
      <AudioControlBar engine={other} />
    </>,
  );
  const sections = screen.getAllByRole('region', {
    name: 'Điều khiển âm thanh',
  });
  await user.click(
    within(sections[0]!).getByRole('checkbox', {
      name: 'Bật phím tắt trong bộ điều khiển',
    }),
  );
  within(sections[1]!)
    .getByRole('button', { name: 'Trợ giúp điều khiển' })
    .focus();
  await user.keyboard('p');
  expect(engine.store.getState().channels.narration.resource).toBeNull();
  view.unmount();
  await other.dispose();
});

it('opens help from a button or shortcut, ignores portal key events, and returns focus on close', async () => {
  const user = userEvent.setup();
  render(<AudioControlBar engine={engine} resource={audioResource('one')} />);
  await user.click(
    screen.getByRole('checkbox', { name: 'Bật phím tắt trong bộ điều khiển' }),
  );
  const trigger = screen.getByRole('button', { name: 'Trợ giúp điều khiển' });
  await user.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Trợ giúp điều khiển' });
  expect(dialog).toBeVisible();
  expect(within(dialog).getByText('Tab')).toBeVisible();
  const close = within(dialog).getByRole('button', { name: 'Đóng' });
  await user.keyboard('p');
  expect(engine.store.getState().channels.narration.resource).toBeNull();
  await user.click(close);
  expect(trigger).toHaveFocus();
  await user.keyboard('?');
  expect(dialog).toBeVisible();
  fireEvent(dialog, new Event('cancel', { cancelable: true }));
  expect(trigger).toHaveFocus();
});

it('switches content by buttons and enables back and exit only with feature callbacks', async () => {
  const user = userEvent.setup();
  const back = vi.fn();
  const exit = vi.fn();
  render(
    <AudioControlBar
      engine={engine}
      playlist={[audioResource('one'), audioResource('two')]}
      onBack={back}
      onExit={exit}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Nội dung tiếp theo' }));
  await waitFor(() =>
    expect(engine.store.getState().channels.narration.status).toBe('playing'),
  );
  expect(screen.getByText('Âm thanh two')).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Nội dung tiếp theo' }),
  ).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Quay lại' }));
  expect(back).toHaveBeenCalledOnce();
  await user.click(screen.getByRole('button', { name: 'Thoát hoạt động' }));
  expect(exit).toHaveBeenCalledOnce();
});

it('changes volume and rate through labelled native controls', async () => {
  const user = userEvent.setup();
  render(<AudioControlBar engine={engine} />);
  fireEvent.change(screen.getByRole('slider', { name: /Âm lượng/ }), {
    target: { value: '0.3' },
  });
  expect(engine.store.getState().channels.narration.volume).toBe(0.3);
  expect(screen.getByRole('slider', { name: /Âm lượng/ })).toHaveAttribute(
    'aria-valuetext',
    '30 phần trăm',
  );
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Tốc độ đọc' }),
    '1.5',
  );
  expect(engine.store.getState().channels.narration.playbackRate).toBe(1.5);
});

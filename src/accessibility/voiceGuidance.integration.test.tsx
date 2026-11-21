import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { voiceGuidance } from '@/engines/audio/VoiceGuidance';
import {
  preferencesStore,
  defaultPreferences,
} from '@/stores/preferencesStore';
import { VoiceSettings } from '@/features/settings/VoiceSettings';
import { GuidanceStatus } from './GuidanceStatus';

// These cases exercise optional TTS integration. The production E2E suite
// exercises the bundled Vietnamese files through real HTML media instead.
vi.mock('@/engines/audio/voiceAdapters', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@/engines/audio/voiceAdapters')>();
  const { VoiceUnavailableError } = await import('@/engines/audio/voiceTypes');
  return {
    ...original,
    RecordedVoiceAdapter: class {
      play() {
        return Promise.reject(new VoiceUnavailableError());
      }
    },
  };
});

class TestUtterance {
  voice: unknown = null;
  lang = '';
  rate = 1;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(readonly text: string) {}
}

beforeEach(async () => {
  await preferencesStore.getState().initialize();
  preferencesStore.setState({
    preferences: { ...defaultPreferences, voiceGuidance: true },
    status: 'ready',
  });
});
afterEach(() => {
  voiceGuidance.reset();
  vi.unstubAllGlobals();
});

function renderSettings() {
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <>
          <VoiceSettings />
          <GuidanceStatus />
        </>
      ),
    },
    { path: '/other', element: <GuidanceStatus /> },
  ]);
  render(<RouterProvider router={router} />);
  return router;
}

it('uses only local Vietnamese speech, retains button focus, and stops on navigation', async () => {
  const user = userEvent.setup();
  const remote = { lang: 'vi-VN', localService: false };
  const local = { lang: 'vi-VN', localService: true };
  const speak = vi.fn<(utterance: TestUtterance) => void>();
  const cancel = vi.fn();
  vi.stubGlobal('SpeechSynthesisUtterance', TestUtterance);
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => [remote, local],
    speak,
    cancel,
  });
  const router = renderSettings();
  expect(speak).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Nghe hướng dẫn' }));
  expect(speak).toHaveBeenCalledOnce();
  expect(speak.mock.calls[0]?.[0].voice).toBe(local);
  expect(screen.getByRole('button', { name: 'Dừng hướng dẫn' })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Dừng hướng dẫn' }));
  expect(voiceGuidance.getSnapshot()).toBe('idle');
  await user.click(screen.getByRole('button', { name: 'Nghe hướng dẫn' }));
  await act(async () => {
    await router.navigate('/other');
  });
  expect(voiceGuidance.getSnapshot()).toBe('idle');
  expect(cancel).toHaveBeenCalled();
});

it('rejects remote-only voices and stops speech as soon as guidance is disabled', async () => {
  const user = userEvent.setup();
  const voices = [{ lang: 'vi-VN', localService: false }];
  const speak = vi.fn();
  const cancel = vi.fn();
  vi.stubGlobal('SpeechSynthesisUtterance', TestUtterance);
  vi.stubGlobal('speechSynthesis', { getVoices: () => voices, speak, cancel });
  renderSettings();
  await user.click(screen.getByRole('button', { name: 'Nghe hướng dẫn' }));
  expect(speak).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Chưa mở được file hướng dẫn',
  );
  voices.push({ lang: 'vi-VN', localService: true });
  await user.click(screen.getByRole('button', { name: 'Nghe hướng dẫn' }));
  expect(voiceGuidance.getSnapshot()).toBe('speaking');
  await user.click(
    screen.getByRole('switch', { name: 'Bật hướng dẫn giọng nói' }),
  );
  expect(voiceGuidance.getSnapshot()).toBe('idle');
  expect(
    screen.queryByRole('button', { name: 'Dừng hướng dẫn' }),
  ).not.toBeInTheDocument();
});

it('repeats with updated rate and volume, and can disable optional TTS', async () => {
  const user = userEvent.setup();
  const speak = vi.fn<(utterance: TestUtterance) => void>();
  vi.stubGlobal('SpeechSynthesisUtterance', TestUtterance);
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => [{ lang: 'vi-VN', localService: true }],
    speak,
    cancel: vi.fn(),
  });
  renderSettings();
  await user.click(screen.getByRole('button', { name: 'Nghe hướng dẫn' }));
  act(() => speak.mock.calls[0]?.[0].onend?.());
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Tốc độ hướng dẫn' }),
    '0.8',
  );
  await act(async () => {
    await preferencesStore.getState().updatePreference('guidanceVolume', 0.4);
  });
  const repeat = screen.getByRole('button', {
    name: 'Đọc lại hướng dẫn vừa nghe',
  });
  await user.click(repeat);
  expect(speak.mock.calls[1]?.[0]).toMatchObject({ rate: 0.8, volume: 0.4 });
  expect(
    screen.getByRole('button', { name: 'Dừng lời đọc hiện tại' }),
  ).toHaveFocus();
  await user.click(screen.getByRole('radio', { name: 'Chỉ dùng bản thu' }));
  expect(voiceGuidance.getSnapshot()).toBe('idle');
  await user.click(screen.getByRole('button', { name: 'Nghe hướng dẫn' }));
  expect(speak).toHaveBeenCalledTimes(2);
  expect(screen.getByRole('status')).toHaveTextContent(
    'Chưa mở được file hướng dẫn',
  );
  expect(
    screen.getByRole('region', { name: 'Hướng dẫn vừa yêu cầu' }),
  ).toHaveTextContent('Em có thể đổi giao diện');
});

it('stops on pagehide and forgets the previous message on same-path navigation', async () => {
  const user = userEvent.setup();
  vi.stubGlobal('SpeechSynthesisUtterance', TestUtterance);
  const cancel = vi.fn();
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => [{ lang: 'vi', localService: true }],
    speak: vi.fn(),
    cancel,
  });
  const router = renderSettings();
  await user.click(screen.getByRole('button', { name: 'Nghe hướng dẫn' }));
  act(() => {
    window.dispatchEvent(new Event('pagehide'));
  });
  expect(voiceGuidance.getSnapshot()).toBe('idle');
  expect(cancel).toHaveBeenCalledOnce();
  await user.click(
    screen.getByRole('button', { name: 'Đọc lại hướng dẫn vừa nghe' }),
  );
  await act(async () => {
    await router.navigate('/?activity=next');
  });
  expect(voiceGuidance.getSnapshot()).toBe('idle');
  expect(voiceGuidance.getState().message).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Đọc lại hướng dẫn vừa nghe' }),
  ).not.toBeInTheDocument();
});

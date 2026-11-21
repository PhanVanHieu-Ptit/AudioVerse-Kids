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

class TestUtterance {
  voice: unknown = null;
  lang = '';
  rate = 1;
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
  voiceGuidance.stop();
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
    'Chưa có giọng tiếng Việt cục bộ',
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

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import type {} from './fixtures/voiceHarness';

function recordingWav() {
  const sampleRate = 8000;
  const frames = sampleRate * 6;
  const bytes = Buffer.alloc(44 + frames * 2);
  bytes.write('RIFF', 0);
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sampleRate, 24);
  bytes.writeUInt32LE(sampleRate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(frames * 2, 40);
  for (let i = 0; i < frames; i++)
    bytes.writeInt16LE(
      Math.round(Math.sin((i * 2 * Math.PI * 440) / sampleRate) * 500),
      44 + i * 2,
    );
  return bytes;
}
async function openHarness(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined });
    Object.defineProperty(window, 'AudioContext', { value: undefined });
  });
  await page.route('**/e2e/test-voice.wav', (route) =>
    route.fulfill({ contentType: 'audio/wav', body: recordingWav() }),
  );
  await page.goto('/e2e/fixtures/voice.html');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

test('recordings play, stop and repeat with real HTMLAudioElement without TTS or Web Audio', async ({
  page,
}) => {
  await openHarness(page);
  await expect(page.getByRole('status')).toHaveText('idle');
  expect(await page.evaluate(() => window.voiceHarness.media.length)).toBe(0);
  await page.getByRole('button', { name: 'Nghe bản thu kiểm thử' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('speaking');
  expect(
    await page.evaluate(() => {
      const audio = window.voiceHarness.media[0];
      return {
        volume: audio?.volume,
        rate: audio?.playbackRate,
        paused: audio?.paused,
      };
    }),
  ).toEqual({ volume: 0.35, rate: 0.8, paused: false });
  await page.getByRole('button', { name: 'Dừng bản thu' }).click();
  await expect(page.getByRole('status')).toHaveText('idle');
  expect(
    await page.evaluate(() =>
      window.voiceHarness.media.every(
        (audio) => audio.paused && !audio.getAttribute('src'),
      ),
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Đọc lại bản thu' }).click();
  await expect(page.getByRole('status')).toHaveText('speaking');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('recordings saved in IndexedDB play offline after reload', async ({
  page,
  context,
}) => {
  await openHarness(page);
  await page.getByRole('button', { name: 'Lưu bản thu kiểm thử' }).click();
  await expect(
    page.getByRole('button', { name: 'Đã lưu bản thu kiểm thử' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('status')).toHaveText('idle');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Nghe bản thu kiểm thử' }).click();
  await expect(page.getByRole('status')).toHaveText('speaking');
  expect(
    await page.evaluate(() =>
      window.voiceHarness.media[0]?.src.startsWith('blob:'),
    ),
  ).toBe(true);
});

test('missing recordings show an error and allow retry without inventing speech', async ({
  page,
}) => {
  await openHarness(page);
  await page.route('**/e2e/test-voice.wav', (route) =>
    route.fulfill({ status: 404, body: 'Missing' }),
  );
  await page.getByRole('button', { name: 'Nghe bản thu kiểm thử' }).click();
  await expect(page.getByRole('status')).toHaveText('error');
  await expect(
    page.getByText(
      'Âm tổng hợp kiểm thử đường phát bản thu, không phải giọng nói.',
    ),
  ).toBeVisible();
  await page.unroute('**/e2e/test-voice.wav');
  await page.route('**/e2e/test-voice.wav', (route) =>
    route.fulfill({ contentType: 'audio/wav', body: recordingWav() }),
  );
  await page.getByRole('button', { name: 'Đọc lại bản thu' }).click();
  await expect(page.getByRole('status')).toHaveText('speaking');
});

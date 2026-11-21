import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Route } from '@playwright/test';
import type {} from './fixtures/audioHarness';

/** Real, quiet PCM WAV generated only by tests; no fictitious production asset. */
function toneWav() {
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
      Math.round(Math.sin((i * 2 * Math.PI * 440) / sampleRate) * 900),
      44 + i * 2,
    );
  return bytes;
}

async function openPlayer(page: Page) {
  await page.route('**/e2e/test-tone.wav', serveTone);
  await page.goto('/e2e/fixtures/audio.html');
  await expect(
    page.getByRole('heading', { name: 'Âm kiểm thử' }),
  ).toBeVisible();
}

async function serveTone(route: Route) {
  const body = toneWav();
  const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers().range ?? '');
  if (range) {
    const start = Number(range[1]);
    const end = range[2]
      ? Math.min(Number(range[2]), body.length - 1)
      : body.length - 1;
    await route.fulfill({
      status: 206,
      contentType: 'audio/wav',
      headers: {
        'accept-ranges': 'bytes',
        'content-range': `bytes ${start}-${end}/${body.length}`,
      },
      body: body.subarray(start, end + 1),
    });
  } else
    await route.fulfill({
      status: 200,
      contentType: 'audio/wav',
      headers: { 'accept-ranges': 'bytes' },
      body,
    });
}

test('real HTML media supports keyboard transport, seek, rate and accessible controls', async ({
  page,
}) => {
  await openPlayer(page);
  const play = page.getByRole('button', { name: 'Phát', exact: true });
  await play.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Nghe tiếp' })).toBeVisible();
  const seek = page.getByRole('slider', { name: /Vị trí phát/ });
  await seek.focus();
  await page.keyboard.press('Home');
  await expect(seek).toHaveValue('0');
  await page.keyboard.press('ArrowRight');
  await expect(seek).toHaveValue('1');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.audioHarness.engine.store.getState().channels.narration
            .currentTime,
      ),
    )
    .toBeCloseTo(1);
  await page.getByRole('combobox', { name: 'Tốc độ đọc' }).selectOption('1.5');
  await page.getByRole('button', { name: 'Nghe tiếp' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.audioHarness.engine.store.getState().channels.narration
            .currentTime,
      ),
    )
    .toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Dừng', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Đã dừng.');
  await page.getByRole('button', { name: 'Nghe lại' }).click();
  await expect(page.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('downloads persist across reload and play from IndexedDB with the network offline', async ({
  page,
  context,
}) => {
  await openPlayer(page);
  await page.getByRole('button', { name: 'Tải ngoại tuyến' }).click();
  await expect(
    page.getByRole('button', { name: 'Đã tải ngoại tuyến' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Âm kiểm thử' }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        window.audioHarness.engine.store.getState().channels.narration.duration,
    ),
  ).toBe(6);
});

test('HTML media works without Web Audio and load errors allow retry with text fallback', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'AudioContext', { value: undefined }),
  );
  await openPlayer(page);
  await page.route('**/e2e/test-tone.wav', (route) =>
    route.fulfill({ status: 404, body: 'Missing' }),
  );
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  await page.getByText('Nội dung bằng chữ', { exact: true }).click();
  await expect(
    page.getByText('Nốt nhạc tổng hợp chỉ dành cho kiểm thử.'),
  ).toBeVisible();
  await page.unroute('**/e2e/test-tone.wav');
  await page.route('**/e2e/test-tone.wav', serveTone);
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();
});

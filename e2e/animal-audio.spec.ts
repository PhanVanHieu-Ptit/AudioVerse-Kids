import { expect, test } from '@playwright/test';
import { animalSounds } from '../src/content/gameSounds';

test('all bundled animal recordings decode to audible, unclipped audio in the browser', async ({
  page,
}) => {
  await page.goto('/games/doan-tieng-dong-vat');
  const levels = await page.evaluate(
    async (urls) => {
      const context = new AudioContext();
      try {
        return await Promise.all(
          urls.map(async (url) => {
            const response = await fetch(url!);
            if (!response.ok) throw new Error(`Missing recording: ${url}`);
            const buffer = await context.decodeAudioData(
              await response.arrayBuffer(),
            );
            const pcm = buffer.getChannelData(0);
            let squares = 0;
            let peak = 0;
            for (const sample of pcm) {
              squares += sample * sample;
              peak = Math.max(peak, Math.abs(sample));
            }
            return {
              url,
              duration: buffer.duration,
              rms: Math.sqrt(squares / pcm.length),
              peak,
            };
          }),
        );
      } finally {
        await context.close();
      }
    },
    animalSounds.map((sound) => sound.audioSrc),
  );
  for (const level of levels) {
    expect(level.duration, level.url).toBeGreaterThan(1);
    expect(level.duration, level.url).toBeLessThan(5);
    expect(level.rms, level.url).toBeGreaterThan(0.06);
    expect(level.peak, level.url).toBeLessThan(0.9);
  }
});

test('animal playback finishes, replays from cache, and stops when leaving the game', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/audio/animals/')) requests.push(request.url());
  });
  await page.goto('/games/doan-tieng-dong-vat');
  await page.getByRole('button', { name: 'Bắt đầu trò chơi' }).click();
  await page
    .getByRole('button', { name: 'Nghe âm thanh', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Dừng âm thanh', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Nghe âm thanh', exact: true }),
  ).toBeVisible({ timeout: 10000 });
  expect(requests).toHaveLength(1);
  expect(requests[0]).toContain('/audio/animals/cat.v1.mp3');
  await page
    .getByRole('button', { name: 'Nghe âm thanh', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Dừng âm thanh', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Nghe âm thanh', exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
  await page
    .getByRole('button', { name: 'Nghe âm thanh', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Tạm dừng trò chơi', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Tiếp tục trò chơi', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import type {} from './fixtures/audioHarness';
import { serveTone } from './fixtures/audioRoute';

async function openPlayer(page: Page) {
  await page.route('**/e2e/test-tone.wav', serveTone);
  await page.goto('/e2e/fixtures/audio.html');
  await expect(
    page.getByRole('heading', { name: 'Âm kiểm thử' }),
  ).toBeVisible();
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
  await expect(
    page.getByRole('status', { name: 'Trạng thái âm thanh' }),
  ).toHaveText('Đã dừng.');
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

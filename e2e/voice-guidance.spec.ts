import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    guidanceMediaForTest: HTMLMediaElement[];
  }
}

async function observeRealGuidance(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: undefined,
    });
    window.guidanceMediaForTest = [];
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (!window.guidanceMediaForTest.includes(this))
        window.guidanceMediaForTest.push(this);
      return originalPlay.call(this);
    };
  });
}

async function expectPlaying(page: Page, file: string) {
  await expect
    .poll(() =>
      page.evaluate((name) => {
        const media = window.guidanceMediaForTest.at(-1);
        return Boolean(
          media &&
          media.src.endsWith(name) &&
          !media.paused &&
          media.currentTime > 0 &&
          Number.isFinite(media.duration) &&
          media.duration > 0.5,
        );
      }, file),
    )
    .toBe(true);
}

test('bundled Vietnamese welcome, activity instructions and results play without browser TTS', async ({
  page,
}) => {
  await observeRealGuidance(page);
  await page.goto('/settings');
  await page.getByRole('switch', { name: 'Bật hướng dẫn giọng nói' }).check();
  expect(await page.evaluate(() => window.guidanceMediaForTest.length)).toBe(0);
  await page.getByRole('radio', { name: 'Chỉ dùng bản thu' }).check();
  await page.getByRole('link', { name: 'Khám phá', exact: true }).click();
  await page.getByRole('button', { name: 'Nghe lời chào mừng' }).click();
  await expectPlaying(page, 'welcome.v1.mp3');
  const activityStatus = page.getByRole('status', {
    name: 'Thông báo hoạt động',
  });
  await expect(activityStatus).toHaveAttribute('aria-live', 'off');
  await page
    .getByRole('button', { name: 'Dừng hướng dẫn', exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      window.guidanceMediaForTest.every(
        (media) => media.paused && !media.getAttribute('src'),
      ),
    ),
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Đọc lại hướng dẫn vừa nghe' })
    .click();
  await expectPlaying(page, 'welcome.v1.mp3');
  await page.getByRole('link', { name: 'Trò chơi', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Hướng dẫn vừa yêu cầu' }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      window.guidanceMediaForTest.every((media) => media.paused),
    ),
  ).toBe(true);
  await page
    .getByRole('link', { name: 'Mở trò chơi: Âm cao hay âm trầm?' })
    .click();
  await page
    .getByRole('button', { name: 'Nghe hướng dẫn', exact: true })
    .click();
  await expectPlaying(page, 'am-cao-am-tram.v1.mp3');
  await page.getByRole('button', { name: 'Bắt đầu trò chơi' }).click();
  await page.getByRole('button', { name: 'Âm trầm', exact: true }).click();
  await expect(activityStatus).toHaveAttribute('aria-live', 'polite');
  await expect(activityStatus).toContainText('Chưa đúng rồi');
  await page.getByRole('button', { name: 'Nghe kết quả' }).click();
  await expectPlaying(page, 'result-incorrect.v1.mp3');
  await expect(activityStatus).toBeEmpty();
  await expect(activityStatus).toHaveAttribute('aria-live', 'off');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('unvisited Vietnamese help audio is precached and plays offline after reload without TTS', async ({
  page,
  context,
}) => {
  await observeRealGuidance(page);
  await page.goto('/settings');
  await page.getByRole('switch', { name: 'Bật hướng dẫn giọng nói' }).check();
  await page.getByRole('radio', { name: 'Chỉ dùng bản thu' }).check();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => resolve(),
          { once: true },
        );
      });
  });
  await context.setOffline(true);
  await page.goto('/help');
  await page.reload();
  await page
    .getByRole('button', { name: 'Nghe hướng dẫn', exact: true })
    .click();
  await expectPlaying(page, 'app-help.v1.mp3');
});

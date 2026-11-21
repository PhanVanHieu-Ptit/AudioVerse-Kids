import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

async function tabTo(page: Page, target: Locator, backwards = false) {
  for (let count = 0; count < 45; count++) {
    if (await target.evaluate((node) => node === document.activeElement))
      return;
    await page.keyboard.press(backwards ? 'Shift+Tab' : 'Tab');
  }
  await expect(target).toBeFocused();
}

async function scan(page: Page) {
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
}

test('keyboard only: skip navigation, help, native settings and stable focus', async ({
  page,
}) => {
  await page.goto('/help');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  await expect(page.locator('.pwa-notice')).toHaveCSS('position', 'static');
  const skip = page.getByRole('link', {
    name: 'Bỏ qua điều hướng, đến nội dung chính',
  });
  await tabTo(page, skip, true);
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await tabTo(
    page,
    page.getByRole('link', { name: 'Mở cài đặt khả năng tiếp cận' }),
  );
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Cài đặt cho em' }),
  ).toBeFocused();
  await tabTo(
    page,
    page.getByRole('combobox', { name: 'Giao diện', exact: true }),
  );
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const largeText = page.getByRole('switch', { name: 'Chữ lớn hơn' });
  await tabTo(page, largeText);
  await page.keyboard.press('Space');
  await expect(largeText).toBeChecked();
  await expect(largeText).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-large-text', 'true');
  await scan(page);
});

test('keyboard only: game feedback, replayable descriptions and modal return focus', async ({
  page,
}) => {
  await page.goto('/games/am-cao-am-tram');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await tabTo(page, page.getByRole('button', { name: 'Bắt đầu trò chơi' }));
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Nốt nhạc 1 trên 3' }),
  ).toBeFocused();
  await tabTo(page, page.getByText('Mô tả nốt nhạc bằng chữ', { exact: true }));
  await page.keyboard.press('Enter');
  await expect(
    page.getByText('Một nốt nhạc cao, thanh và trong.'),
  ).toBeVisible();
  const low = page.getByRole('button', { name: 'Âm trầm', exact: true });
  await tabTo(page, low);
  await page.keyboard.press('Space');
  const feedback = page.getByRole('status', { name: 'Thông báo hoạt động' });
  await expect(feedback).toContainText('Chưa đúng rồi');
  await expect(low).toBeFocused();
  await page.keyboard.press('Space');
  await expect(feedback).toContainText('Chưa đúng rồi');
  await expect(low).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Nốt nhạc 2 trên 3' }),
  ).toBeFocused();
  await scan(page);
  const leave = page.getByRole('link', { name: 'Về danh sách trò chơi' });
  await tabTo(page, leave);
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', {
    name: 'Em muốn tạm rời hoạt động?',
  });
  const close = dialog.getByRole('button', { name: 'Đóng', exact: true });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    dialog.getByRole('button', { name: 'Lưu và tạm rời' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await scan(page);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(leave).toBeFocused();
});

test('voice settings persist and bundled speech plays without browser TTS or autoplay', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined });
  });
  await page.goto('/settings');
  const voice = page.getByRole('switch', { name: 'Bật hướng dẫn giọng nói' });
  await expect(voice).not.toBeChecked();
  await expect(
    page.getByRole('button', { name: 'Nghe hướng dẫn' }),
  ).toHaveCount(0);
  await voice.check();
  await page
    .getByRole('combobox', { name: 'Tốc độ hướng dẫn' })
    .selectOption('0.8');
  const volume = page.getByRole('slider', { name: 'Âm lượng hướng dẫn' });
  await volume.focus();
  await page.keyboard.press('Home');
  for (let index = 0; index < 8; index++)
    await page.keyboard.press('ArrowRight');
  await page.getByRole('radio', { name: 'Chỉ dùng bản thu' }).check();
  await expect(page.locator('.save-status')).toHaveText(
    'Đã lưu cài đặt trên thiết bị.',
  );
  await page.reload();
  await expect(voice).toBeChecked();
  await expect(
    page.getByRole('combobox', { name: 'Tốc độ hướng dẫn' }),
  ).toHaveValue('0.8');
  await expect(volume).toHaveValue('40');
  await expect(
    page.getByRole('radio', { name: 'Chỉ dùng bản thu' }),
  ).toBeChecked();
  const status = page.getByRole('status', {
    name: 'Trạng thái hướng dẫn giọng nói',
  });
  await expect(status).toBeEmpty();
  await page.getByRole('button', { name: 'Nghe hướng dẫn' }).click();
  await expect(
    page.getByRole('button', { name: 'Dừng hướng dẫn', exact: true }),
  ).toBeVisible();
  await expect(status).toBeEmpty();
  await scan(page);
});

for (const path of ['/help', '/settings', '/games/am-cao-am-tram']) {
  test(`200% text and reduced motion at 320px: ${path}`, async ({
    page,
  }, testInfo) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.setViewportSize({ width: 320, height: 740 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await scan(page);
    if (path === '/settings') {
      // Text must retain the available field width at large sizes, rather
      // than shrinking into a column of individual letters beside a switch.
      expect(
        await page.locator('.setting-option').evaluateAll(
          (fields) =>
            fields.length === 4 &&
            fields.every((field) => {
              const text = field.querySelector('span');
              return (
                text !== null &&
                text.getBoundingClientRect().width >= field.clientWidth * 0.8
              );
            }),
        ),
      ).toBe(true);
    }
    await page.screenshot({
      path: testInfo.outputPath('text-200-percent.png'),
      fullPage: true,
    });
  });
}

test('help remains available offline without speech support', async ({
  page,
  context,
}) => {
  await page.goto('/');
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
  await expect(
    page.getByRole('heading', { name: 'Trợ giúp bàn phím', level: 1 }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('Ứng dụng không có phím tắt toàn cục.', { exact: false }),
  ).toBeVisible();
});

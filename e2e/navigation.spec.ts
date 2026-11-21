import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const gamePath = '/games/am-cao-am-tram';

async function dismissOfflineNotice(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.getByRole('button', { name: 'Đã hiểu', exact: true }).click();
}

async function startGame(page: Page) {
  await page.goto(gamePath);
  await dismissOfflineNotice(page);
  await page.getByRole('button', { name: 'Bắt đầu trò chơi' }).click();
  await expect(
    page.getByRole('heading', { name: 'Nốt nhạc 1 trên 3' }),
  ).toBeFocused();
}

test('cancel leaving with Escape, trap focus, then leave and resume without losing progress', async ({
  page,
}, testInfo) => {
  await startGame(page);
  await page.getByRole('button', { name: 'Âm cao', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Nốt nhạc 2 trên 3' }),
  ).toBeFocused();
  const leave = page.getByRole('link', { name: 'Về danh sách trò chơi' });
  await leave.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', {
    name: 'Em muốn tạm rời hoạt động?',
  });
  const close = dialog.getByRole('button', { name: 'Đóng', exact: true });
  const confirm = dialog.getByRole('button', { name: 'Lưu và tạm rời' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(confirm).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath('leave-activity.png'),
    fullPage: true,
  });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(leave).toBeFocused();
  await expect(page).toHaveURL(gamePath);
  await leave.click();
  await confirm.click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Trò chơi' }),
  ).toBeFocused();
  await page
    .getByRole('link', { name: 'Mở trò chơi: Âm cao hay âm trầm?' })
    .click();
  await page.getByRole('button', { name: 'Tiếp tục trò chơi' }).click();
  await expect(
    page.getByRole('heading', { name: 'Nốt nhạc 2 trên 3' }),
  ).toBeFocused();
});

test('browser Back and Forward honor the leave decision', async ({ page }) => {
  await page.goto('/games');
  await dismissOfflineNotice(page);
  await page
    .getByRole('link', { name: 'Mở trò chơi: Âm cao hay âm trầm?' })
    .click();
  await page.getByRole('button', { name: 'Bắt đầu trò chơi' }).click();
  await page.goBack();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Ở lại hoạt động' }).click();
  await expect(page).toHaveURL(gamePath);
  await page.goBack();
  await dialog.getByRole('button', { name: 'Lưu và tạm rời' }).click();
  await expect(page).toHaveURL('/games');
  await page.goForward();
  await expect(
    page.getByRole('button', { name: 'Tiếp tục trò chơi' }),
  ).toBeVisible();
});

test('reload warns and restores the saved round; completed games leave without a prompt', async ({
  page,
}) => {
  await startGame(page);
  await page.getByRole('button', { name: 'Âm cao', exact: true }).click();
  await expect(
    page.getByText('Đã lưu tiến độ trên thiết bị.', { exact: true }),
  ).toBeVisible();
  await Promise.all([
    page.waitForEvent('dialog').then(async (dialog) => {
      expect(dialog.type()).toBe('beforeunload');
      await dialog.accept();
    }),
    page.reload(),
  ]);
  await page.getByRole('button', { name: 'Tiếp tục trò chơi' }).click();
  await expect(
    page.getByRole('heading', { name: 'Nốt nhạc 2 trên 3' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Âm trầm', exact: true }).click();
  await page.getByRole('button', { name: 'Âm cao', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Em đã hoàn thành!' }),
  ).toBeFocused();
  await page.getByRole('link', { name: 'Về danh sách trò chơi' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Trò chơi' }),
  ).toBeFocused();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page
    .getByRole('link', { name: 'Mở trò chơi: Âm cao hay âm trầm?' })
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Âm cao hay âm trầm?' }),
  ).toBeFocused();
});

test('blocked storage warns honestly and keeps progress across routes in the same session', async ({
  page,
}) => {
  await page.addInitScript(() => {
    indexedDB.open = () => {
      throw new DOMException('Storage disabled for this test', 'SecurityError');
    };
  });
  await startGame(page);
  await page.getByRole('button', { name: 'Âm cao', exact: true }).click();
  await expect(page.getByText(/Chưa lưu được trên thiết bị/)).toBeVisible();
  await page.getByRole('link', { name: 'Về danh sách trò chơi' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(/Chưa lưu được tiến độ/)).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Lưu và tạm rời' }),
  ).not.toBeVisible();
  await dialog.getByRole('button', { name: 'Rời đi, giữ trong phiên' }).click();
  await page
    .getByRole('link', { name: 'Mở trò chơi: Âm cao hay âm trầm?' })
    .click();
  await page.getByRole('button', { name: 'Tiếp tục trò chơi' }).click();
  await expect(
    page.getByRole('heading', { name: 'Nốt nhạc 2 trên 3' }),
  ).toBeFocused();
});

test('unsupported audio keeps the game usable through text and retry', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: undefined,
    });
  });
  await startGame(page);
  await page.getByRole('button', { name: 'Nghe nốt nhạc' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Chưa phát được âm thanh',
  );
  await page.getByText('Mô tả nốt nhạc bằng chữ', { exact: true }).click();
  await expect(
    page.getByText('Một nốt nhạc cao, thanh và trong.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Âm cao', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Nốt nhạc 2 trên 3' }),
  ).toBeFocused();
});

test('the real game has audio playback, a text alternative and an accessible active state', async ({
  page,
}) => {
  await startGame(page);
  await page.getByRole('button', { name: 'Nghe nốt nhạc' }).click();
  await expect(
    page.getByRole('button', { name: 'Dừng nốt nhạc' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Nghe nốt nhạc' }),
  ).toBeVisible();
  await page.getByText('Mô tả nốt nhạc bằng chữ', { exact: true }).click();
  await expect(
    page.getByText('Một nốt nhạc cao, thanh và trong.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Âm trầm', exact: true }).click();
  await expect(page.getByText(/Chưa đúng rồi/)).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('unvisited activity routes and progress work offline', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await dismissOfflineNotice(page);
  await page.evaluate(async () => {
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => resolve(),
          { once: true },
        ),
      );
  });
  await context.setOffline(true);
  await page.goto(gamePath);
  await page.getByRole('button', { name: 'Bắt đầu trò chơi' }).click();
  await page.getByRole('button', { name: 'Âm cao', exact: true }).click();
  await page.getByRole('link', { name: 'Về danh sách trò chơi' }).click();
  await page.getByRole('button', { name: 'Lưu và tạm rời' }).click();
  await page.reload();
  await page
    .getByRole('link', { name: 'Mở trò chơi: Âm cao hay âm trầm?' })
    .click();
  await page.getByRole('button', { name: 'Tiếp tục trò chơi' }).click();
  await expect(
    page.getByRole('heading', { name: 'Nốt nhạc 2 trên 3' }),
  ).toBeVisible();
});

test.describe('chunk loading', () => {
  test.use({ serviceWorkers: 'block' });

  test('shows a loading fallback during lazy import', async ({ page }) => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/assets/StoryPage-*.js', async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('/stories/chua-co', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('main').getByRole('status')).toContainText(
      'Đang mở trang',
    );
    await expect(page.locator('#main-content')).toBeFocused();
    release?.();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Nghe truyện' }),
    ).toBeFocused();
  });

  test('retains layout and recovers when a lazy chunk fails', async ({
    page,
  }) => {
    await page.route('**/assets/StoryPage-*.js', (route) => route.abort());
    await page.goto('/stories/chua-co');
    await expect(
      page.getByRole('heading', { name: 'Chưa thể mở trang' }),
    ).toBeFocused();
    await expect(
      page.getByRole('navigation', { name: 'Điều hướng chính' }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Về trang chủ', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Chào em, cùng khám phá nhé!' }),
    ).toBeFocused();
  });
});

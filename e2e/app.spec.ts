import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  ['/', 'Chào em, cùng khám phá nhé!'],
  ['/stories', 'Thư viện truyện'],
  ['/stories/chua-co', 'Nghe truyện'],
  ['/games', 'Trò chơi'],
  ['/games/chua-co', 'Chơi trò chơi'],
  ['/games/am-cao-am-tram', 'Âm cao hay âm trầm?'],
  ['/music', 'Khu vườn âm nhạc'],
  ['/learning', 'Học điều hay'],
  ['/teacher', 'Chế độ giáo viên'],
  ['/design-system', 'Design System'],
  ['/settings', 'Cài đặt cho em'],
  ['/khong-ton-tai', 'Không tìm thấy trang'],
] as const;

for (const [path, title] of pages) {
  test(`accessible route ${path}`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(path);
    await expect(
      page.getByRole('heading', { level: 1, name: title }),
    ).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(title.replace(/[?]/g, '\\?')));
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (path === '/') {
      const dismiss = page.getByRole('button', {
        name: 'Đã hiểu',
        exact: true,
      });
      if (await dismiss.isVisible()) await dismiss.click();
      await page.screenshot({
        path: testInfo.outputPath('home.png'),
        fullPage: true,
      });
    }
  });
}

test('skip link and navigation work with a keyboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Tùy chỉnh cho em' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Khám phá thư viện truyện' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Thư viện truyện' }),
  ).toBeFocused();
  // Verify skip-link activation separately from route focus management.
  await page
    .getByRole('link', { name: 'Bỏ qua điều hướng, đến nội dung chính' })
    .focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('display settings persist after reload and remain accessible', async ({
  page,
}) => {
  await page.goto('/settings');
  const largeText = page.getByRole('switch', {
    name: 'Chữ lớn hơn',
    exact: true,
  });
  await largeText.check();
  await page.getByRole('switch', { name: 'Tương phản cao' }).check();
  await page.getByRole('switch', { name: 'Giảm chuyển động' }).check();
  await expect(
    page
      .getByRole('region', { name: 'Hiển thị và chuyển động' })
      .getByRole('status'),
  ).toHaveText('Đã lưu cài đặt trên thiết bị.');
  await page.reload();
  await expect(largeText).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-large-text', 'true');
  await expect(page.locator('html')).toHaveAttribute(
    'data-high-contrast',
    'true',
  );
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('app shell and unvisited routes open offline after precaching', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => resolve(),
          { once: true },
        ),
      );
    }
  });
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Chào em, cùng khám phá nhé!',
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Khám phá thư viện truyện' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Thư viện truyện' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Thư viện truyện' }),
  ).toBeVisible();
});

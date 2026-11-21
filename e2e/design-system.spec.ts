import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function openShowcase(page: Page) {
  await page.goto('/design-system');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Design System' }),
  ).toBeVisible();
  await expect(
    page.getByRole('radio', { name: 'Sáng', exact: true }),
  ).toBeChecked();
  // Wait for the shell's real offline readiness notice, then dismiss it.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.getByRole('button', { name: 'Đã hiểu', exact: true }).click();
}

for (const theme of ['Sáng', 'Tối', 'Tương phản cao']) {
  test(`showcase and dialog meet automated AA checks in ${theme}`, async ({
    page,
  }, testInfo) => {
    await openShowcase(page);
    await page.getByRole('radio', { name: theme, exact: true }).check();
    if (theme === 'Tối')
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    if (theme === 'Tương phản cao')
      await expect(page.locator('html')).toHaveAttribute(
        'data-high-contrast',
        'true',
      );
    const scan = () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
    expect((await scan()).violations).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath(`showcase-${theme}.png`),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Mở hộp thoại mẫu' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect((await scan()).violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`dialog-${theme}.png`) });
  });
}

test('native dialog traps focus, handles Escape, and returns focus to the opener', async ({
  page,
}) => {
  await openShowcase(page);
  const opener = page.getByRole('button', { name: 'Mở hộp thoại mẫu' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  const close = dialog.getByRole('button', { name: 'Đóng', exact: true });
  const confirm = dialog.getByRole('button', { name: 'Em đã hiểu' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(confirm).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await confirm.click();
  await expect(opener).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('real audio preview plays, pauses, finishes and exposes a text alternative', async ({
  page,
}) => {
  await openShowcase(page);
  const card = page.getByRole('article', { name: 'Một nốt nhạc nhỏ' });
  await expect(
    card.getByRole('button', { name: 'Phát: Một nốt nhạc nhỏ' }),
  ).toBeVisible();
  await card.getByRole('button', { name: 'Phát: Một nốt nhạc nhỏ' }).click();
  await expect(
    card.getByRole('button', { name: 'Tạm dừng: Một nốt nhạc nhỏ' }),
  ).toBeVisible();
  await card
    .getByRole('button', { name: 'Tạm dừng: Một nốt nhạc nhỏ' })
    .click();
  await expect(
    card.getByRole('button', { name: 'Nghe tiếp: Một nốt nhạc nhỏ' }),
  ).toBeVisible();
  await card
    .getByRole('button', { name: 'Nghe tiếp: Một nốt nhạc nhỏ' })
    .click();
  await expect(
    card.getByRole('button', { name: 'Phát: Một nốt nhạc nhỏ' }),
  ).toBeVisible();
  await card.getByText('Nội dung bằng chữ', { exact: true }).click();
  await expect(card.getByText(/Một nốt La nhẹ/)).toBeVisible();
});

test('unsupported Web Audio exposes a retry and text fallback', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', { value: undefined });
  });
  await openShowcase(page);
  const card = page.getByRole('article', { name: 'Một nốt nhạc nhỏ' });
  await card.getByRole('button', { name: 'Phát: Một nốt nhạc nhỏ' }).click();
  await expect(
    card.getByRole('button', { name: 'Thử lại: Một nốt nhạc nhỏ' }),
  ).toBeEnabled();
  await expect(card.getByRole('status')).toContainText(
    'Trình duyệt chưa thể phát âm thử',
  );
});

test('theme persists and applies to existing feature pages', async ({
  page,
}) => {
  await openShowcase(page);
  await page.getByRole('radio', { name: 'Tối', exact: true }).check();
  await expect(
    page
      .getByRole('region', { name: 'Một hệ thống. Nhiều cách cảm nhận.' })
      .getByRole('status'),
  ).toHaveText('Đã lưu cài đặt trên thiết bị.');
  await page.reload();
  await expect(
    page.getByRole('radio', { name: 'Tối', exact: true }),
  ).toBeChecked();
  for (const path of ['/', '/settings']) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
  }
});

test('small viewport, 200% text, reduced motion, touch targets and forced colors', async ({
  page,
}, testInfo) => {
  await openShowcase(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    JSON.stringify(
      await page.evaluate(() =>
        [...document.querySelectorAll('body *')]
          .filter((node) => node.getBoundingClientRect().right > innerWidth + 1)
          .map((node) => ({
            tag: node.tagName,
            className: node.className,
            width: node.getBoundingClientRect().width,
          })),
      ),
    ),
  ).toBe(true);
  await expect(page.locator('.loading-indicator').first()).toHaveCSS(
    'animation-name',
    'none',
  );
  const button = page.getByRole('button', {
    name: 'Bắt đầu khám phá',
    exact: true,
  });
  const bounds = await button.boundingBox();
  expect(bounds?.height).toBeGreaterThanOrEqual(48);
  expect(bounds?.width).toBeGreaterThanOrEqual(48);
  await page.screenshot({
    path: testInfo.outputPath('showcase-200-percent.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Mở hộp thoại mẫu' }).click();
  expect(
    await page
      .getByRole('dialog')
      .evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(button).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('showcase opens offline as an unvisited precached route', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
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
  await page.goto('/design-system');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Design System' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Phát: Một nốt nhạc nhỏ' }),
  ).toBeEnabled();
});

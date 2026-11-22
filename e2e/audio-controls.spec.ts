import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { serveTone } from './fixtures/audioRoute';
import type {} from './fixtures/controlsHarness';

async function openControls(page: Page) {
  await page.route('**/e2e/test-tone.wav', serveTone);
  await page.goto('/e2e/fixtures/controls.html');
  await expect(
    page.getByRole('region', { name: 'Điều khiển âm thanh' }),
  ).toBeVisible();
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

test('sequential keyboard transport, native sliders and opted-in local shortcuts', async ({
  page,
}) => {
  await openControls(page);
  const outside = page.getByRole('button', { name: 'Ngoài bộ điều khiển' });
  await outside.focus();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Phát', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Nghe tiếp' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Nghe lại' })).toBeFocused();
  await page
    .getByRole('checkbox', { name: 'Bật phím tắt trong bộ điều khiển' })
    .check();
  await outside.focus();
  await page.keyboard.press('p');
  await expect(
    page.getByRole('status', { name: 'Trạng thái âm thanh', exact: true }),
  ).toContainText('Đã tạm dừng.');
  const volume = page.getByRole('slider', { name: /Âm lượng/ });
  await volume.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await expect(volume).toHaveValue('0.05');
  await page.keyboard.press('p');
  await expect(
    page.getByRole('status', { name: 'Trạng thái âm thanh', exact: true }),
  ).toContainText('Đã tạm dừng.');
  await page.getByRole('combobox', { name: 'Tốc độ đọc' }).selectOption('1.5');
  await page.getByRole('button', { name: 'Nghe tiếp' }).focus();
  await page.keyboard.press('p');
  await expect(page.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();
  await page.keyboard.press('p');
  await page.keyboard.press(']');
  await expect(page.getByText('Nội dung Hai', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Nội dung tiếp theo' }),
  ).toBeDisabled();
  await page.keyboard.press('[');
  await expect(page.getByText('Nội dung Một', { exact: true })).toBeVisible();
  await scan(page);
});

test('help traps focus, makes background inert, closes with Escape and restores the trigger', async ({
  page,
}) => {
  await openControls(page);
  const trigger = page.getByRole('button', { name: 'Trợ giúp điều khiển' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Trợ giúp điều khiển' });
  const close = dialog.getByRole('button', { name: 'Đóng' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  expect(await dialog.evaluate((node) => node.matches(':modal'))).toBe(true);
  // Playwright role selectors can still resolve native-modal background nodes.
  // Exercise the actual browser focus barrier instead of counting DOM nodes.
  await page
    .getByRole('button', { name: 'Ngoài bộ điều khiển' })
    .evaluate((node) => node.focus());
  await expect(close).toBeFocused();
  await scan(page);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('touch-sized controls, actual media switching, recorded guidance and safe exit', async ({
  page,
}, testInfo) => {
  await openControls(page);
  const bar = page.getByRole('region', { name: 'Điều khiển âm thanh' });
  expect(
    await bar.locator('button').evaluateAll((buttons) =>
      buttons.every((button) => {
        const rect = button.getBoundingClientRect();
        return rect.width >= 48 && rect.height >= 48;
      }),
    ),
  ).toBe(true);
  async function activate(name: string) {
    const button = page.getByRole('button', { name, exact: true });
    if (testInfo.project.use.hasTouch) await button.tap();
    else await button.click();
  }
  await activate('Phát');
  await expect(page.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();
  await activate('Nội dung tiếp theo');
  await expect(page.getByText('Nội dung Hai', { exact: true })).toBeVisible();
  await activate('Nghe hướng dẫn');
  await expect(
    page.getByRole('button', { name: 'Dừng hướng dẫn', exact: true }),
  ).toBeVisible();
  await activate('Dừng hướng dẫn');
  await activate('Quay lại');
  await expect(
    page.getByRole('status', { name: 'Điều hướng kiểm thử' }),
  ).toHaveText('Đã quay lại');
  await activate('Thoát hoạt động');
  await expect(
    page.getByRole('status', { name: 'Điều hướng kiểm thử' }),
  ).toHaveText('Đã thoát hoạt động');
  expect(
    await page.evaluate(() =>
      Object.values(
        window.controlsHarness.engine.store.getState().channels,
      ).every(
        (channel) =>
          channel.status !== 'playing' && channel.status !== 'loading',
      ),
    ),
  ).toBe(true);
});

test('320px with 200% text, high contrast and reduced motion remains usable', async ({
  page,
}, testInfo) => {
  await openControls(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
    document.documentElement.dataset.highContrast = 'true';
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const help = page.getByRole('button', { name: 'Trợ giúp điều khiển' });
  await help.focus();
  await expect(help).toHaveCSS('outline-style', 'solid');
  await expect(help).toHaveCSS('outline-width', '3px');
  // A layout can avoid horizontal overflow yet split Vietnamese words in half.
  const splitWords = await page
    .locator('.audio-control-actions button')
    .evaluateAll((buttons) => {
      const split: string[] = [];
      for (const button of buttons) {
        const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          for (const match of (node.textContent ?? '').matchAll(/\S+/gu)) {
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            if (range.getClientRects().length > 1) split.push(match[0]);
          }
        }
      }
      return split;
    });
  expect(splitWords).toEqual([]);
  await scan(page);
  await page.screenshot({
    path: testInfo.outputPath('controls-320px.png'),
    fullPage: true,
  });
});

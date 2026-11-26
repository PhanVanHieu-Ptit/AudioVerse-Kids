import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('music: keyboard and touch controls, editing, reload persistence and accessibility', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/music');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Khu vườn âm nhạc' }),
  ).toBeFocused();
  await expect(page.getByRole('slider', { name: /Âm lượng nhạc/ })).toHaveValue(
    '30',
  );
  const pad = page.getByRole('button', {
    name: 'Đô A, chơi nốt nhạc',
    exact: true,
  });
  if (testInfo.project.use.hasTouch) await pad.tap();
  else {
    await pad.focus();
    await page.keyboard.press('Enter');
  }
  await page.getByRole('checkbox', { name: /Bật phím tắt/ }).check();
  await pad.focus();
  await page.keyboard.press('s');
  await page.keyboard.press('d');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('heading', { name: 'Chuỗi của em: 3 trên 64 bước' }),
  ).toBeVisible();
  await page.getByRole('textbox', { name: 'Tên bản nhạc' }).fill('Vườn của em');
  await page.getByRole('combobox', { name: 'Nốt ở bước 2' }).selectOption('G4');
  await page.getByRole('combobox', { name: 'Độ dài bước 2' }).selectOption('2');
  await page.getByRole('button', { name: 'Lưu bản nhạc', exact: true }).click();
  await page.reload();
  await page
    .getByRole('button', { name: 'Chỉnh sửa bản nhạc Vườn của em' })
    .click();
  await expect(
    page.getByRole('combobox', { name: 'Nốt ở bước 2' }),
  ).toHaveValue('G4');
  await expect(
    page.getByRole('combobox', { name: 'Độ dài bước 2' }),
  ).toHaveValue('2');
  await page.getByRole('button', { name: 'Phát lại bản nhạc' }).click();
  await expect(
    page.getByRole('status', { name: 'Trạng thái phát nhạc' }),
  ).toHaveText('Đang phát âm thanh.');
  await expect(
    page.getByRole('status', { name: 'Thông báo sáng tác' }),
  ).toContainText('Đã phát xong');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath('music-playground.png'),
    fullPage: true,
  });
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
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(errors).toEqual([]);
});

test('music is available offline with local composition playback and both games', async ({
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
  await page.goto('/music');
  await page
    .getByRole('button', { name: 'Đô A, chơi nốt nhạc', exact: true })
    .click();
  await page.getByRole('button', { name: 'Lưu bản nhạc', exact: true }).click();
  await page.reload();
  await page
    .getByRole('button', { name: 'Nghe bản nhạc Giai điệu của em' })
    .click();
  await expect(
    page.getByRole('status', { name: 'Trạng thái phát nhạc' }),
  ).toHaveText('Đang phát âm thanh.');
  await page.getByRole('button', { name: 'Nghe đề bài' }).click();
  await expect(
    page.getByRole('status', { name: 'Kết quả trò chơi âm nhạc' }),
  ).toContainText('Đã nghe xong');
  await page
    .getByRole('button', { name: 'Nhận diện nhịp điệu', exact: true })
    .click();
  await page.getByRole('button', { name: 'Nghe đề bài' }).click();
  await expect(page.getByRole('button', { name: 'Nghe nhịp 1' })).toBeEnabled();
  await page.getByRole('button', { name: 'Nghe nhịp 1' }).click();
  await expect(page.getByRole('button', { name: 'Chọn nhịp 1' })).toBeEnabled();
});

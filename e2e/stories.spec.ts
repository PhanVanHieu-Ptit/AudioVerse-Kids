import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function scan(page: Page) {
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
}

test('the library lists real stories, filters Vietnamese titles and handles empty results', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/stories');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Thư viện truyện' }),
  ).toBeFocused();
  await expect(page.getByRole('link', { name: /^Nghe hoặc đọc:/ })).toHaveCount(
    21,
  );
  await expect(
    page.getByText('Chưa có truyện trong thư viện', { exact: true }),
  ).toHaveCount(0);
  await scan(page);
  await page.screenshot({
    path: testInfo.outputPath('library.png'),
    fullPage: false,
  });
  await page
    .getByRole('combobox', { name: 'Bộ truyện', exact: true })
    .selectOption('classics-v1');
  await expect(page.getByRole('link', { name: /^Nghe hoặc đọc:/ })).toHaveCount(
    6,
  );
  await page
    .getByRole('combobox', { name: 'Cấp độ', exact: true })
    .selectOption('3');
  await expect(page.getByRole('link', { name: /^Nghe hoặc đọc:/ })).toHaveCount(
    2,
  );
  const search = page.getByRole('searchbox', { name: 'Tìm truyện' });
  await search.fill('trang quynh');
  await expect(
    page.getByRole('link', { name: 'Nghe hoặc đọc: Trạng Quỳnh – Mầm đá' }),
  ).toBeVisible();
  await page.reload();
  await expect(search).toHaveValue('trang quynh');
  await expect(
    page.getByRole('status', { name: 'Kết quả tìm truyện' }),
  ).toHaveText('Hiển thị 1 trên 21 truyện.');
  await search.fill('khong co ten nay');
  await expect(
    page.getByRole('heading', { name: 'Chưa tìm thấy truyện phù hợp' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Xem tất cả truyện' }).click();
  await expect(search).toBeFocused();
  await expect(page.getByRole('link', { name: /^Nghe hoặc đọc:/ })).toHaveCount(
    21,
  );
  expect(errors).toEqual([]);
});

test('keyboard reading follows branches, preserves focus and survives Back, Forward and reload', async ({
  page,
}, testInfo) => {
  const audioRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/audio/stories/'))
      audioRequests.push(request.url());
  });
  await page.goto('/stories/ba-chu-heo-con');
  await expect(
    page.getByRole('heading', { name: 'Ba chú heo con', level: 1 }),
  ).toBeFocused();
  await expect(page.locator('.story-credit')).toContainText(
    'Kể lại từ truyện dân gian Anh Ba chú heo con',
  );
  const choice = page.getByRole('link', {
    name: 'Nghe ba heo nhờ Sói rời đi.',
  });
  await choice.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Lời nói qua cửa đóng', level: 2 }),
  ).toBeFocused();
  await page.getByRole('link', { name: 'Đến phần kết cùng sửa nhà.' }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Mỗi người giúp một việc', level: 2 }),
  ).toBeFocused();
  await scan(page);
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Lời nói qua cửa đóng', level: 2 }),
  ).toBeFocused();
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Ba ngôi nhà khác nhau', level: 2 }),
  ).toBeFocused();
  await page.goForward();
  await page.goForward();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Mỗi người giúp một việc', level: 2 }),
  ).toBeFocused();
  const question = page.getByRole('group', {
    name: 'Vì sao ba heo đỡ lo hơn khi ở cùng nhau?',
  });
  await question
    .getByRole('button', { name: 'Các bạn có chỗ trú chắc và giúp nhau.' })
    .click();
  await expect(
    question.getByRole('status', { name: 'Phản hồi câu hỏi' }),
  ).toHaveText('Đúng rồi, sự chuẩn bị và giúp đỡ đều có ích.');
  await page.screenshot({
    path: testInfo.outputPath('story-ending.png'),
    fullPage: false,
  });
  await page.getByRole('link', { name: 'Đọc lại từ đầu' }).click();
  await expect(
    page.getByRole('heading', { name: 'Ba ngôi nhà khác nhau', level: 2 }),
  ).toBeFocused();
  expect(audioRequests).toEqual([]);
});

test('unanswered questions do not block choices and malformed scene URLs recover', async ({
  page,
}) => {
  await page.goto('/stories/co-be-quang-khan-do?scene=truoc-cua');
  await expect(
    page.getByRole('group', { name: 'Vì sao hai mẹ con chưa mở cửa?' }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Nhờ hàng xóm quen liên hệ bà.' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Bà trở về cùng người quen', level: 2 }),
  ).toBeFocused();
  await page.goto('/stories/ba-chu-heo-con?scene=missing');
  await expect(
    page.getByRole('heading', { name: 'Chưa tìm thấy cảnh này' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Về cảnh mở đầu' }).click();
  await expect(
    page.getByRole('heading', { name: 'Ba ngôi nhà khác nhau', level: 2 }),
  ).toBeFocused();
  await page.goto('/stories/hoang-tu-be');
  await expect(
    page.getByRole('heading', { name: 'Chưa tìm thấy truyện này' }),
  ).toBeVisible();
});

test('unvisited story routes and their text open offline after app precaching', async ({
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
  await page.getByRole('link', { name: 'Khám phá thư viện truyện' }).click();
  await expect(page.getByRole('link', { name: /^Nghe hoặc đọc:/ })).toHaveCount(
    21,
  );
  await page
    .getByRole('link', { name: 'Nghe hoặc đọc: Ba chú heo con' })
    .click();
  await page
    .getByRole('link', { name: 'Nghe ba heo ở yên và chờ Sói bỏ đi.' })
    .click();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Một chỗ trú chung', level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Đến phần kết ngôi nhà chung.' }),
  ).toBeVisible();
  await scan(page);
});

test('story controls reflow at 320px and 200% text in dark and high contrast themes', async ({
  page,
}, testInfo) => {
  await page.goto('/settings');
  await page
    .getByRole('combobox', { name: 'Giao diện', exact: true })
    .selectOption('dark');
  await expect(page.locator('.save-status')).toHaveText(
    'Đã lưu cài đặt trên thiết bị.',
  );
  await page.goto('/stories');
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await expect(page.getByRole('link', { name: /^Nghe hoặc đọc:/ })).toHaveCount(
    21,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await scan(page);
  await page
    .getByRole('link', { name: 'Nghe hoặc đọc: Ba chú heo con' })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await scan(page);
  await page.screenshot({
    path: testInfo.outputPath('story-320px.png'),
    fullPage: false,
  });
  await page.goto('/settings');
  await page
    .getByRole('switch', { name: 'Tương phản cao', exact: true })
    .check();
  await expect(page.locator('.save-status')).toHaveText(
    'Đã lưu cài đặt trên thiết bị.',
  );
  await page.goto('/stories/ba-chu-heo-con');
  await expect(page.locator('html')).toHaveAttribute(
    'data-high-contrast',
    'true',
  );
  await scan(page);
});

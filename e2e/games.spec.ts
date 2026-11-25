import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { activityGames } from '../src/content/activityGames';

for (const game of activityGames) {
  test(`${game.title}: levels, audio, responsive controls and accessibility`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/games/${game.id}`);
    await expect(
      page.getByRole('heading', { name: game.title, level: 1 }),
    ).toBeFocused();
    await page.getByRole('button', { name: 'Bật hướng dẫn giọng nói' }).click();
    await page
      .getByRole('button', { name: 'Nghe hướng dẫn', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Dừng hướng dẫn', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Dừng hướng dẫn', exact: true })
      .click();
    await page.getByRole('button', { name: 'Cấp độ 3 · Thử tài' }).click();
    await page.getByRole('button', { name: 'Bắt đầu trò chơi' }).click();
    await expect(
      page.getByRole('heading', { name: 'Thử thách 1 trên 8 · Cấp độ 3' }),
    ).toBeFocused();
    const c = game.challenges[16]!;
    if (c.mode === 'choice' && !c.sound) {
      await page.getByRole('button', { name: 'Nghe câu hỏi' }).click();
      await expect(
        page.getByRole('button', { name: 'Dừng hướng dẫn', exact: true }),
      ).toBeVisible();
      await page
        .getByRole('button', { name: 'Dừng hướng dẫn', exact: true })
        .click();
    } else if (c.mode === 'pairs') {
      await page.getByRole('button', { name: /^Thẻ 1 / }).click();
    } else {
      await page
        .getByRole('button', {
          name:
            c.mode === 'sequence'
              ? 'Nghe chuỗi âm thanh'
              : c.mode === 'rhythm'
                ? 'Nghe mẫu nhịp'
                : 'Nghe âm thanh',
        })
        .click();
      await expect(
        page.getByRole('button', { name: 'Dừng âm thanh' }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Dừng âm thanh' }).click();
    }
    if (c.mode === 'rhythm')
      await page
        .getByRole('button', { name: 'Chọn khoảng nghỉ', exact: true })
        .click();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath(`${game.id}-playing.png`),
      fullPage: true,
    });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (c.mode === 'pairs') {
      expect(
        await page
          .locator('.game-sound-card')
          .evaluateAll((cards) =>
            cards.every((card) => card.clientWidth >= 140),
          ),
      ).toBe(true);
    }
    await page.screenshot({
      path: testInfo.outputPath(`${game.id}-320px.png`),
      fullPage: true,
    });
    expect(errors).toEqual([]);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

test('knowledge game: keyboard answers, reload persistence, final score and replay', async ({
  page,
}) => {
  const game = activityGames.find((game) => game.id === 'do-vui-kien-thuc')!;
  await page.goto(`/games/${game.id}`);
  await page.getByRole('button', { name: 'Bắt đầu trò chơi' }).focus();
  await page.keyboard.press('Enter');
  for (const [index, c] of game.challenges.slice(0, 8).entries()) {
    if (c.mode !== 'choice') throw new Error('Expected choice');
    await page
      .getByRole('button', {
        name: c.options.find((o) => o.id === c.answer)!.label,
        exact: true,
      })
      .focus();
    await page.keyboard.press('Space');
    await expect(page.getByText(`Đúng rồi! ${c.explanation}`)).toBeVisible();
    if (index === 0) {
      await page.getByRole('button', { name: 'Tạm dừng trò chơi' }).click();
      await expect(
        page.getByText('Đã lưu tiến độ trên thiết bị.'),
      ).toBeVisible();
      await page.reload();
      await page.getByRole('button', { name: 'Tiếp tục trò chơi' }).click();
      await expect(page.getByText(`Đúng rồi! ${c.explanation}`)).toBeVisible();
    }
    await page
      .getByRole('button', {
        name: index === 7 ? 'Xem kết quả' : 'Thử thách tiếp theo',
      })
      .click();
  }
  await expect(
    page.getByRole('heading', { name: 'Em đã hoàn thành cấp độ 1!' }),
  ).toBeFocused();
  await expect(page.getByText(/Đúng ngay lần đầu: 8\/8/)).toBeVisible();
  await page.getByRole('button', { name: 'Chơi lại cấp độ 1' }).click();
  await expect(
    page.getByRole('heading', { name: 'Thử thách 1 trên 8 · Cấp độ 1' }),
  ).toBeFocused();
});

test('sequence: save before leaving, resume partial input and finish the round', async ({
  page,
}) => {
  await page.goto('/games/nho-chuoi-am-thanh');
  await page.getByRole('button', { name: 'Bắt đầu trò chơi' }).click();
  await page.getByRole('button', { name: 'Đô', exact: true }).click();
  await page.getByRole('link', { name: 'Về danh sách trò chơi' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Lưu và tạm rời' })
    .click();
  await page
    .getByRole('link', { name: 'Mở trò chơi: Nhớ chuỗi âm thanh' })
    .click();
  await page.getByRole('button', { name: 'Tiếp tục trò chơi' }).click();
  await expect(page.getByText('Chuỗi của em: Đô (1/2)')).toBeVisible();
  await page.getByRole('button', { name: 'Mi', exact: true }).click();
  await page.getByRole('button', { name: 'Kiểm tra chuỗi' }).click();
  await expect(page.getByText(/Đúng rồi!/)).toBeVisible();
});

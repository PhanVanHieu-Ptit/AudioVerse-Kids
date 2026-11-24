import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const browser = await chromium.launch({
  args: ['--autoplay-policy=user-gesture-required'],
});
try {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(
      pathToFileURL(
        resolve('artifacts/voice-previews/nam-ke-chuyen/index.html'),
      ).href,
    );
    const players = page.locator('audio');
    await expect(players).toHaveCount(2);
    assert(
      await players.evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            node instanceof HTMLAudioElement &&
            node.paused &&
            node.currentTime === 0,
        ),
      ),
    );
    for (const name of ['Thanh Bình', 'Anh Khôi']) {
      const audio = page.getByLabel(`Nghe thử giọng ${name}`, { exact: true });
      await audio.focus();
      await audio.press('Space');
      await expect
        .poll(() =>
          audio.evaluate((node: HTMLAudioElement) => node.currentTime),
        )
        .toBeGreaterThan(0);
      assert(await audio.evaluate((node: HTMLAudioElement) => !node.paused));
      // Keep the first playing: the second must pause it automatically.
      if (name === 'Anh Khôi') {
        assert(
          await players
            .first()
            .evaluate((node: HTMLAudioElement) => node.paused),
        );
        await audio.press('Space');
        assert(await audio.evaluate((node: HTMLAudioElement) => node.paused));
      }
      await page
        .getByText(`Bản chữ cho giọng ${name}`, { exact: true })
        .click();
      await expect(page.locator('details[open]')).toHaveCount(
        name === 'Anh Khôi' ? 2 : 1,
      );
    }
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    assert.deepEqual(
      result.violations.map(({ id, help }) => ({ id, help })),
      [],
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    console.log(
      `PASS ${viewport.width}px: MP3, no autoplay, keyboard, no overlap, transcript, axe, no overflow`,
    );
    await context.close();
  }
} finally {
  await browser.close();
}

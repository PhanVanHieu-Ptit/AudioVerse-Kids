import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import manifest from '../public/audio/stories/manifest.json' with { type: 'json' };

declare global {
  interface Window {
    storyMedia: HTMLMediaElement[];
  }
}

async function observe(page: Page, withoutWebAudio = false) {
  await page.addInitScript((disableWebAudio) => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: undefined,
    });
    if (disableWebAudio) {
      Object.defineProperty(window, 'AudioContext', { value: undefined });
      Object.defineProperty(window, 'webkitAudioContext', { value: undefined });
    }
    window.storyMedia = [];
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (!window.storyMedia.includes(this)) window.storyMedia.push(this);
      return original.call(this);
    };
  }, withoutWebAudio);
}

async function playing(page: Page, match: string) {
  await expect
    .poll(() =>
      page.evaluate((expected) => {
        const media = window.storyMedia.at(-1);
        return Boolean(
          media &&
          media.src.includes(expected) &&
          !media.paused &&
          media.currentTime > 0.1 &&
          media.duration > 1,
        );
      }, match),
    )
    .toBe(true);
}

async function idle(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => window.storyMedia.every((media) => media.paused)),
    )
    .toBe(true);
}

test('real Vietnamese scene audio plays, pauses, resumes, seeks, replays and stops at the branch', async ({
  page,
}, testInfo) => {
  await observe(page, true);
  await page.goto('/stories/ba-chu-heo-con');
  expect(await page.evaluate(() => window.storyMedia.length)).toBe(0);
  await page.getByRole('button', { name: 'Phát', exact: true }).focus();
  await page.keyboard.press('Enter');
  await playing(page, 'ba-chu-heo-con.scene.ba-ngoi-nha.reading.');
  await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
  await idle(page);
  await page
    .getByRole('combobox', { name: 'Tốc độ đọc', exact: true })
    .selectOption('1.25');
  const volume = page.getByRole('slider', { name: /^Âm lượng/ });
  await volume.focus();
  await page.keyboard.press('Home');
  for (let step = 0; step < 10; step++) await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Nghe tiếp', exact: true }).click();
  await playing(page, 'ba-ngoi-nha');
  expect(
    await page.evaluate(() => window.storyMedia.at(-1)?.playbackRate),
  ).toBe(1.25);
  expect(await page.evaluate(() => window.storyMedia.at(-1)?.volume)).toBe(0.5);
  await page.getByRole('button', { name: 'Nghe lại', exact: true }).click();
  await playing(page, 'ba-ngoi-nha');
  expect(
    await page.evaluate(() => window.storyMedia.at(-1)!.currentTime),
  ).toBeLessThan(3);
  await page.getByRole('link', { name: 'Nghe ba heo nhờ Sói rời đi.' }).click();
  await idle(page);
  await expect(
    page.getByRole('heading', { name: 'Lời nói qua cửa đóng', level: 2 }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  await playing(page, 'noi-qua-cua.reading.');
  await page.evaluate(() => {
    const media = window.storyMedia.at(-1)!;
    media.currentTime = media.duration - 0.15;
  });
  await expect(
    page.getByRole('status', { name: 'Trạng thái âm thanh', exact: true }),
  ).toContainText('Đã nghe xong.');
  await idle(page);
  await expect(page).toHaveURL(/scene=noi-qua-cua$/);
  await page.screenshot({
    path: testInfo.outputPath('story-audio.png'),
    fullPage: false,
  });
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  await playing(page, 'noi-qua-cua');
  await page
    .getByRole('link', { name: 'Về thư viện truyện', exact: true })
    .click();
  await idle(page);
});

test('questions and selected feedback have real recordings without automatic speech on answers', async ({
  page,
}) => {
  await observe(page);
  await page.goto('/stories/ba-chu-heo-con?scene=ket-sua');
  await page.getByRole('button', { name: 'Nghe câu hỏi', exact: true }).click();
  await playing(page, 'question.question-1.reading.');
  await page
    .getByRole('button', {
      name: 'Các bạn có chỗ trú chắc và giúp nhau.',
      exact: true,
    })
    .click();
  await idle(page);
  await expect(
    page.getByRole('status', { name: 'Phản hồi câu hỏi' }),
  ).toContainText('Đúng rồi');
  await page
    .getByRole('button', { name: 'Nghe phản hồi', exact: true })
    .click();
  await playing(page, 'feedback.option-1.');
  await page.getByRole('link', { name: 'Đọc lại từ đầu', exact: true }).click();
  await idle(page);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('missing audio reports an error and retries the actual MP3', async ({
  page,
}) => {
  await observe(page);
  await page.route('**/audio/stories/**/*.mp3', (route) =>
    route.fulfill({ status: 404, body: 'Missing audio' }),
  );
  await page.goto('/stories/ba-chu-heo-con');
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  await expect(
    page.getByRole('status', { name: 'Trạng thái âm thanh', exact: true }),
  ).toContainText('Không tải được âm thanh');
  await expect(
    page
      .locator('.story-transcript')
      .getByText(
        'Ngày xưa, trong một miền quê tưởng tượng, ba anh em heo làm nhà ở gần nhau.',
        { exact: false },
      ),
  ).toBeVisible();
  await page.unroute('**/audio/stories/**/*.mp3');
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await playing(page, 'ba-ngoi-nha');
});

test('explicitly downloads all story branches to IndexedDB and plays an unvisited scene offline after reload', async ({
  page,
  context,
}) => {
  await observe(page);
  await page.goto('/stories/ba-chu-heo-con');
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
  await page
    .getByRole('button', {
      name: 'Tải truyện để nghe ngoại tuyến',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('status', { name: 'Trạng thái tải truyện' }),
  ).toContainText('Đã lưu đủ âm thanh', { timeout: 20000 });
  await context.setOffline(true);
  await page
    .getByRole('link', { name: 'Nghe ba heo ở yên và chờ Sói bỏ đi.' })
    .click();
  await page.reload();
  await expect(
    page.getByRole('status', { name: 'Trạng thái tải truyện' }),
  ).toContainText('Đã lưu đủ âm thanh');
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  await playing(page, 'blob:');
  await page
    .getByRole('link', { name: 'Đến phần kết ngôi nhà chung.' })
    .click();
  await idle(page);
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  await playing(page, 'blob:');
});

test('a cold offline story never claims an audio download and retains readable text', async ({
  page,
  context,
}) => {
  await observe(page);
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
  await page
    .getByRole('link', { name: 'Khám phá thư viện truyện', exact: true })
    .click();
  await page
    .getByRole('link', { name: 'Nghe hoặc đọc: Ba chú heo con', exact: true })
    .click();
  await expect(
    page.getByRole('status', { name: 'Trạng thái tải truyện' }),
  ).toContainText('Chưa lưu đủ');
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  await expect(
    page.getByRole('status', { name: 'Trạng thái âm thanh', exact: true }),
  ).toContainText('Không tải được âm thanh');
  await expect(
    page.getByRole('heading', { name: 'Ba ngôi nhà khác nhau', level: 2 }),
  ).toBeVisible();
});

test('a voice update replaces obsolete downloads before reporting offline readiness', async ({
  page,
  context,
}) => {
  await observe(page);
  const asset = manifest.assets.find(
    (item) => item.id === 'ba-chu-heo-con.scene.ba-ngoi-nha.reading',
  )!;
  const src = `/audio/stories/${asset.file}`;
  expect(asset.file).toMatch(/\.v2\.mp3$/);
  await page.goto('/stories/ba-chu-heo-con');
  await expect(
    page.getByRole('status', { name: 'Trạng thái tải truyện' }),
  ).toContainText('Chưa lưu đủ');
  await page.evaluate(
    async ({ id, src }) => {
      const blob = await (await fetch(src)).blob();
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('audioverse-kids', 3);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction('audioAssets', 'readwrite');
          transaction
            .objectStore('audioAssets')
            .put({ src: src.replace(/\.v2\.mp3$/, '.v1.mp3'), blob }, id);
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => {
            database.close();
            reject(transaction.error);
          };
        };
      });
      await navigator.serviceWorker.ready;
    },
    { id: asset.id, src },
  );
  await page.reload();
  await expect(
    page.getByRole('status', { name: 'Trạng thái tải truyện' }),
  ).toContainText('Chưa lưu đủ');
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  await playing(page, '.v2.mp3');
  await page.getByRole('button', { name: 'Dừng', exact: true }).click();
  await page
    .getByRole('button', {
      name: 'Tải truyện để nghe ngoại tuyến',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('status', { name: 'Trạng thái tải truyện' }),
  ).toContainText('Đã lưu đủ âm thanh', { timeout: 20000 });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  await playing(page, 'blob:');
});

test('storage denial keeps online playback available and never reports offline readiness', async ({
  page,
}) => {
  await observe(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      value: {
        open() {
          throw new DOMException('Denied', 'SecurityError');
        },
      },
    });
  });
  await page.goto('/stories/ba-chu-heo-con');
  await expect(
    page.getByRole('status', { name: 'Trạng thái tải truyện' }),
  ).toContainText('Chưa tải đủ truyện');
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  await playing(page, 'ba-ngoi-nha');
});

test('cancelling an in-flight download keeps the status honest and allows retry', async ({
  page,
}) => {
  let release: () => void = () => undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/audio/stories/**/*.mp3', async (route) => {
    await pending;
    await route.abort().catch(() => undefined);
  });
  await page.goto('/stories/ba-chu-heo-con');
  await page
    .getByRole('button', {
      name: 'Tải truyện để nghe ngoại tuyến',
      exact: true,
    })
    .click();
  const cancel = page.getByRole('button', {
    name: 'Hủy tải truyện',
    exact: true,
  });
  await expect(cancel).toBeVisible();
  await cancel.click();
  await expect(
    page.getByRole('status', { name: 'Trạng thái tải truyện' }),
  ).toContainText('Đã hủy lượt tải.');
  release();
  await expect(
    page.getByRole('button', {
      name: 'Tải truyện để nghe ngoại tuyến',
      exact: true,
    }),
  ).toBeFocused();
  await page.unroute('**/audio/stories/**/*.mp3');
  await page
    .getByRole('button', {
      name: 'Tải truyện để nghe ngoại tuyến',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('status', { name: 'Trạng thái tải truyện' }),
  ).toContainText('Đã lưu đủ âm thanh', { timeout: 20000 });
});

test('a delayed recording cannot start after moving to another scene', async ({
  page,
}) => {
  await observe(page);
  let release: () => void = () => undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/audio/stories/**/*.mp3', async (route) => {
    await pending;
    await route.continue().catch(() => undefined);
  });
  await page.goto('/stories/ba-chu-heo-con');
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Đang tải âm thanh…', exact: true }),
  ).toHaveAttribute('aria-busy', 'true');
  await page
    .getByRole('link', { name: 'Nghe ba heo nhờ Sói rời đi.', exact: true })
    .click();
  release();
  await idle(page);
  await expect(
    page.getByRole('heading', { name: 'Lời nói qua cửa đóng', level: 2 }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  await playing(page, 'noi-qua-cua.reading.');
});

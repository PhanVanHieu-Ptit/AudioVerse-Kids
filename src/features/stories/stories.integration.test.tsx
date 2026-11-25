import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { routes } from '@/app/routes';
import { stories } from '@/content/stories';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

function open(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('story library and reading routes', () => {
  it('renders all stories and filters them without treating missing recordings as missing stories', async () => {
    const user = userEvent.setup();
    const router = open('/stories');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Thư viện truyện' }),
    ).toHaveFocus();
    expect(
      screen.getAllByRole('link', { name: /^Nghe hoặc đọc:/ }),
    ).toHaveLength(21);
    expect(screen.getByText(/Có bản đọc tổng hợp tiếng Việt/)).toBeVisible();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Bộ truyện' }),
      'classics-v1',
    );
    expect(
      screen.getAllByRole('link', { name: /^Nghe hoặc đọc:/ }),
    ).toHaveLength(6);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Cấp độ' }),
      '3',
    );
    expect(
      screen.getAllByRole('link', { name: /^Nghe hoặc đọc:/ }),
    ).toHaveLength(2);
    const search = screen.getByRole('searchbox', { name: 'Tìm truyện' });
    await user.type(search, 'trang quynh');
    expect(search).toHaveFocus();
    expect(
      screen.getByRole('link', { name: 'Nghe hoặc đọc: Trạng Quỳnh – Mầm đá' }),
    ).toBeVisible();
    expect(
      screen.getAllByRole('link', { name: /^Nghe hoặc đọc:/ }),
    ).toHaveLength(1);
    expect(router.state.location.search).toContain('collection=classics-v1');
    await user.clear(search);
    await user.type(search, 'khong co ten nay');
    expect(
      screen.getByRole('heading', { name: 'Chưa tìm thấy truyện phù hợp' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Xem tất cả truyện' }));
    expect(
      screen.getAllByRole('link', { name: /^Nghe hoặc đọc:/ }),
    ).toHaveLength(21);
    expect(router.state.location.search).toBe('');
  });

  it('restores filters from the URL and never includes the deferred title', async () => {
    open('/stories?level=2&collection=classics-v1&q=khan+do');
    await screen.findByRole('heading', { level: 1, name: 'Thư viện truyện' });
    expect(screen.getByRole('searchbox')).toHaveValue('khan do');
    expect(screen.getByRole('combobox', { name: 'Cấp độ' })).toHaveValue('2');
    expect(
      screen.getAllByRole('link', { name: /^Nghe hoặc đọc:/ }),
    ).toHaveLength(1);
    expect(
      screen.queryByRole('link', { name: /Hoàng tử bé/ }),
    ).not.toBeInTheDocument();
  });

  it.each(stories)('opens actual text for $id', async (story) => {
    open(`/stories/${story.id}`);
    expect(
      await screen.findByRole('heading', { name: story.title, level: 1 }),
    ).toHaveFocus();
    const entry = story.scenes.find(
      (scene) => scene.id === story.entrySceneId,
    )!;
    expect(
      screen.getByRole('heading', { name: entry.title, level: 2 }),
    ).toBeVisible();
    expect(screen.getByText(entry.segments[0]!.text)).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Chưa tìm thấy truyện này' }),
    ).not.toBeInTheDocument();
    if (story.source)
      expect(screen.getByText(story.source.attribution)).toBeVisible();
  });

  it('follows a branch without requiring answers, restores history and restarts at the entry', async () => {
    const user = userEvent.setup();
    const router = open('/stories/ba-chu-heo-con');
    await screen.findByRole('heading', { name: 'Ba chú heo con', level: 1 });
    await user.click(
      screen.getByRole('link', { name: 'Nghe ba heo nhờ Sói rời đi.' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Lời nói qua cửa đóng', level: 2 }),
    ).toHaveFocus();
    await user.click(
      screen.getByRole('link', { name: 'Đến phần kết cùng sửa nhà.' }),
    );
    expect(
      screen.getByRole('heading', {
        name: 'Mỗi người giúp một việc',
        level: 2,
      }),
    ).toHaveFocus();
    const question = screen.getByRole('group', {
      name: 'Vì sao ba heo đỡ lo hơn khi ở cùng nhau?',
    });
    await user.click(
      within(question).getByRole('button', {
        name: 'Các bạn có chỗ trú chắc và giúp nhau.',
      }),
    );
    expect(
      within(question).getByRole('status', { name: 'Phản hồi câu hỏi' }),
    ).toHaveTextContent('Đúng rồi, sự chuẩn bị và giúp đỡ đều có ích.');
    await act(async () => {
      await router.navigate(-1);
    });
    expect(
      screen.getByRole('heading', { name: 'Lời nói qua cửa đóng', level: 2 }),
    ).toHaveFocus();
    await act(async () => {
      await router.navigate(1);
    });
    expect(
      screen.getByRole('heading', {
        name: 'Mỗi người giúp một việc',
        level: 2,
      }),
    ).toHaveFocus();
    expect(
      within(
        screen.getByRole('group', {
          name: 'Vì sao ba heo đỡ lo hơn khi ở cùng nhau?',
        }),
      ).getByRole('status', { name: 'Phản hồi câu hỏi' }),
    ).toBeEmptyDOMElement();
    await user.click(screen.getByRole('link', { name: 'Đọc lại từ đầu' }));
    expect(
      screen.getByRole('heading', { name: 'Ba ngôi nhà khác nhau', level: 2 }),
    ).toHaveFocus();
  });

  it('allows continuing past an unanswered question', async () => {
    const user = userEvent.setup();
    open('/stories/co-be-quang-khan-do?scene=truoc-cua');
    expect(
      await screen.findByRole('heading', {
        name: 'Giọng nói chưa đủ',
        level: 2,
      }),
    ).toHaveFocus();
    expect(
      screen.getByRole('group', { name: 'Vì sao hai mẹ con chưa mở cửa?' }),
    ).toBeVisible();
    await user.click(
      screen.getByRole('link', { name: 'Nhờ hàng xóm quen liên hệ bà.' }),
    );
    expect(
      screen.getByRole('heading', {
        name: 'Bà trở về cùng người quen',
        level: 2,
      }),
    ).toHaveFocus();
  });

  it('recovers from an unknown scene without treating the whole story as missing', async () => {
    const user = userEvent.setup();
    open('/stories/ba-chu-heo-con?scene=missing');
    expect(
      await screen.findByRole('heading', { name: 'Ba chú heo con', level: 1 }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Chưa tìm thấy cảnh này' }),
    ).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Về cảnh mở đầu' }));
    expect(
      screen.getByRole('heading', { name: 'Ba ngôi nhà khác nhau', level: 2 }),
    ).toBeVisible();
  });

  it.each(['missing', 'hoang-tu-be'])(
    'keeps a useful fallback for %s',
    async (id) => {
      open(`/stories/${id}`);
      expect(
        await screen.findByRole('heading', {
          name: 'Chưa tìm thấy truyện này',
        }),
      ).toBeVisible();
      expect(
        screen.getByRole('link', { name: 'Về thư viện truyện' }),
      ).toHaveAttribute('href', '/stories');
    },
  );
});

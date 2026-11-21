import { lazy } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '@/app/routes';
import { activityStore } from '@/stores/activityStore';
import { activityRepository } from '@/lib/storage/activityRepository';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

beforeEach(async () => {
  await activityStore.getState().initialize();
  activityStore.setState({
    records: {},
    activePath: null,
    status: 'ready',
    saveStatus: 'idle',
  });
  vi.spyOn(activityRepository, 'save').mockResolvedValue(undefined);
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute('open');
      },
    },
  });
});

function routerWith(child: RouteObject) {
  return createMemoryRouter(
    routes.map((route) =>
      route.index
        ? route
        : { ...route, children: [...(route.children ?? []), child] },
    ),
    { initialEntries: [`/${child.path}`] },
  );
}

describe('route transitions', () => {
  it.each([
    ['/stories', 'Thư viện truyện'],
    ['/stories/missing', 'Nghe truyện'],
    ['/games', 'Trò chơi'],
    ['/games/missing', 'Chơi trò chơi'],
    ['/music', 'Khu vườn âm nhạc'],
    ['/learning', 'Học điều hay'],
    ['/settings', 'Cài đặt cho em'],
    ['/teacher', 'Chế độ giáo viên'],
  ])(
    'opens %s with a Vietnamese title and heading focus',
    async (path, title) => {
      render(
        <RouterProvider
          router={createMemoryRouter(routes, { initialEntries: [path] })}
        />,
      );
      const heading = await screen.findByRole('heading', {
        level: 1,
        name: title,
      });
      expect(heading).toHaveFocus();
      expect(document.title).toContain(title);
    },
  );

  it('redirects an old URL without adding a history entry', async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/', '/truyen'],
      initialIndex: 1,
    });
    render(<RouterProvider router={router} />);
    await screen.findByRole('heading', { name: 'Thư viện truyện', level: 1 });
    expect(router.state.location.pathname).toBe('/stories');
    await act(async () => {
      await router.navigate(-1);
    });
    expect(
      await screen.findByRole('heading', {
        name: 'Chào em, cùng khám phá nhé!',
      }),
    ).toHaveFocus();
  });

  it('announces pending lazy content and restores the page heading on completion', async () => {
    let finish:
      ((module: { default: () => React.ReactNode }) => void) | undefined;
    const Pending = lazy(
      () =>
        new Promise<{ default: () => React.ReactNode }>((resolve) => {
          finish = resolve;
        }),
    );
    render(
      <RouterProvider
        router={routerWith({ path: 'pending', element: <Pending /> })}
      />,
    );
    expect(await screen.findByRole('status', { name: '' })).toHaveTextContent(
      'Đang mở trang',
    );
    expect(screen.getByRole('main')).toHaveFocus();
    await act(async () => {
      finish?.({ default: () => <p>Nội dung đã mở</p> });
    });
    expect(await screen.findByText('Nội dung đã mở')).toBeVisible();
  });

  it('keeps navigation available after a page crashes and recovers on another route', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Broken(): never {
      throw new Error('Expected page error');
    }
    const router = routerWith({ path: 'broken', element: <Broken /> });
    render(<RouterProvider router={router} />);
    expect(
      await screen.findByRole('heading', { name: 'Chưa thể mở trang' }),
    ).toHaveFocus();
    expect(
      screen.getByRole('navigation', { name: 'Điều hướng chính' }),
    ).toBeVisible();
    await userEvent.click(screen.getByRole('link', { name: 'Về trang chủ' }));
    expect(
      await screen.findByRole('heading', {
        name: 'Chào em, cùng khám phá nhé!',
      }),
    ).toHaveFocus();
  });

  it('cancels leaving, saves progress, and resumes the same round after navigating', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(routes, {
      initialEntries: ['/games/am-cao-am-tram'],
    });
    render(<RouterProvider router={router} />);
    await user.click(
      await screen.findByRole('button', { name: 'Bắt đầu trò chơi' }),
    );
    await user.click(screen.getByRole('button', { name: 'Âm cao' }));
    await screen.findByRole('heading', { name: 'Nốt nhạc 2 trên 3' });
    const leave = screen.getByRole('link', { name: 'Về danh sách trò chơi' });
    await user.click(leave);
    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Ở lại hoạt động' }),
    );
    expect(router.state.location.pathname).toBe('/games/am-cao-am-tram');
    expect(leave).toHaveFocus();
    await user.click(leave);
    await user.click(
      within(dialog).getByRole('button', { name: 'Lưu và tạm rời' }),
    );
    await screen.findByRole('heading', { name: 'Trò chơi', level: 1 });
    await user.click(
      screen.getByRole('link', { name: 'Mở trò chơi: Âm cao hay âm trầm?' }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'Tiếp tục trò chơi' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Nốt nhạc 2 trên 3' }),
    ).toHaveFocus();
  });

  it('warns on hard reload only while an activity is running', async () => {
    const user = userEvent.setup();
    render(
      <RouterProvider
        router={createMemoryRouter(routes, {
          initialEntries: ['/games/am-cao-am-tram'],
        })}
      />,
    );
    await user.click(
      await screen.findByRole('button', { name: 'Bắt đầu trò chơi' }),
    );
    const during = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(during);
    expect(during.defaultPrevented).toBe(true);
    for (const name of ['Âm cao', 'Âm trầm', 'Âm cao']) {
      await user.click(screen.getByRole('button', { name }));
    }
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Em đã hoàn thành!' }),
      ).toBeVisible(),
    );
    const after = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });

  it('waits for a pending save and requires a new decision if it fails', async () => {
    const user = userEvent.setup();
    let fail: ((reason: Error) => void) | undefined;
    vi.mocked(activityRepository.save).mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          fail = reject;
        }),
    );
    const router = createMemoryRouter(routes, {
      initialEntries: ['/games/am-cao-am-tram'],
    });
    render(<RouterProvider router={router} />);
    await user.click(
      await screen.findByRole('button', { name: 'Bắt đầu trò chơi' }),
    );
    await user.click(
      screen.getByRole('link', { name: 'Về danh sách trò chơi' }),
    );
    const dialog = screen.getByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Lưu và tạm rời' }),
    );
    expect(
      within(dialog).getByRole('button', { name: 'Đang giữ tiến độ…' }),
    ).toHaveAttribute('aria-busy', 'true');
    expect(router.state.location.pathname).toBe('/games/am-cao-am-tram');
    await act(async () => {
      fail?.(new Error('Quota exceeded'));
    });
    expect(within(dialog).getByText(/Chưa lưu được tiến độ/)).toBeVisible();
    expect(router.state.location.pathname).toBe('/games/am-cao-am-tram');
    await user.click(
      within(dialog).getByRole('button', { name: 'Rời đi, giữ trong phiên' }),
    );
    await screen.findByRole('heading', { name: 'Trò chơi', level: 1 });
    expect(
      activityStore.getState().records['game:am-cao-am-tram']?.position,
    ).toBe(0);
  });

  it('focuses the page heading when revisiting a completed game', async () => {
    activityStore.setState({
      records: {
        'game:am-cao-am-tram': {
          kind: 'game',
          id: 'am-cao-am-tram',
          position: 3,
          completed: true,
          updatedAt: 1,
        },
      },
    });
    render(
      <RouterProvider
        router={createMemoryRouter(routes, {
          initialEntries: ['/games/am-cao-am-tram'],
        })}
      />,
    );
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Âm cao hay âm trầm?',
      }),
    ).toHaveFocus();
  });
});

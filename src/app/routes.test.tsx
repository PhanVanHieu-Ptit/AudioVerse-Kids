import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { routes } from '@/app/routes';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

describe('application routing', () => {
  it('opens a feature using an accessible link and focuses its heading', async () => {
    const user = userEvent.setup();
    render(<RouterProvider router={createMemoryRouter(routes)} />);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Chào em, cùng khám phá nhé!',
      }),
    ).toBeVisible();
    await user.click(
      screen.getByRole('link', { name: 'Khám phá thư viện truyện' }),
    );
    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'Thư viện truyện',
    });
    expect(heading).toHaveFocus();
    expect(
      screen.getByRole('link', { name: 'Nghe hoặc đọc: Ba chú heo con' }),
    ).toHaveAttribute('href', '/stories/ba-chu-heo-con');
    expect(
      screen.getByRole('status', { name: 'Kết quả tìm truyện' }),
    ).toHaveTextContent('Hiển thị 21 trên 21 truyện.');
  });

  it('provides a way home for unknown URLs', async () => {
    render(
      <RouterProvider
        router={createMemoryRouter(routes, {
          initialEntries: ['/khong-ton-tai'],
        })}
      />,
    );
    expect(
      await screen.findByRole('heading', { name: 'Không tìm thấy trang' }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Về trang khám phá' }),
    ).toHaveAttribute('href', '/');
  });
});

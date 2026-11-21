import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@/components/organisms/ErrorBoundary';

function BrokenChild(): never {
  throw new Error('Expected render failure');
}

describe('ErrorBoundary', () => {
  it('replaces a crashed subtree with recovery controls', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>,
    );
    expect(
      screen.getByRole('heading', { name: 'Ứng dụng đang gặp sự cố' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Tải lại trang' })).toBeEnabled();
    expect(screen.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});

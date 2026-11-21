import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LiveAnnouncer } from './LiveAnnouncer';
import { announce, clearAnnouncement } from './announcements';

afterEach(() => {
  clearAnnouncement();
  vi.useRealTimers();
});

describe('screen reader feedback', () => {
  it('keeps a live region mounted and announces repeated messages after clearing', () => {
    vi.useFakeTimers();
    render(<LiveAnnouncer />);
    const region = screen.getByRole('status');
    expect(region).toBeEmptyDOMElement();
    act(() => {
      announce('Thử lại');
      vi.advanceTimersByTime(100);
    });
    expect(region).toHaveTextContent('Thử lại');
    act(() => announce('Thử lại'));
    expect(region).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(region).toHaveTextContent('Thử lại');
  });
  it('replaces pending feedback and clears pending work when unmounted', () => {
    vi.useFakeTimers();
    const view = render(<LiveAnnouncer />);
    act(() => {
      announce('Cũ');
      announce('Mới');
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Mới');
    act(() => announce('Chưa đọc'));
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

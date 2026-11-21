import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AudioCard } from './AudioCard';
import { AudioButton } from '@/components/atoms/AudioButton';

describe('audio controls', () => {
  it('only requests playback after activation and reflects adapter state', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    const { rerender } = render(
      <AudioButton title="Âm thử" state="ready" onActivate={onActivate} />,
    );
    expect(onActivate).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Phát: Âm thử' }));
    expect(onActivate).toHaveBeenCalledOnce();
    rerender(
      <AudioButton title="Âm thử" state="playing" onActivate={onActivate} />,
    );
    expect(
      screen.getByRole('button', { name: 'Tạm dừng: Âm thử' }),
    ).toBeEnabled();
    rerender(
      <AudioButton title="Âm thử" state="error" onActivate={onActivate} />,
    );
    await user.click(screen.getByRole('button', { name: 'Thử lại: Âm thử' }));
    expect(onActivate).toHaveBeenCalledTimes(2);
  });

  it('provides an honest unavailable state with text fallback and unique labels', async () => {
    const user = userEvent.setup();
    render(
      <>
        <AudioCard
          title="Truyện A"
          description="Mô tả A"
          state="unavailable"
          transcript="Nội dung bằng chữ của truyện A."
        />
        <AudioCard title="Truyện B" description="Mô tả B" state="unavailable" />
      </>,
    );
    expect(screen.getByRole('article', { name: 'Truyện A' })).toBeVisible();
    expect(screen.getByRole('article', { name: 'Truyện B' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Chưa có âm thanh: Truyện A' }),
    ).toBeDisabled();
    await user.click(screen.getByText('Nội dung bằng chữ'));
    expect(screen.getByText('Nội dung bằng chữ của truyện A.')).toBeVisible();
  });

  it('disables disconnected controls and blocks activation while loading', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    const { rerender } = render(<AudioButton title="Âm thử" state="ready" />);
    expect(screen.getByRole('button')).toBeDisabled();
    rerender(
      <AudioButton title="Âm thử" state="loading" onActivate={onActivate} />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    await user.click(screen.getByRole('button'));
    expect(onActivate).not.toHaveBeenCalled();
  });
});

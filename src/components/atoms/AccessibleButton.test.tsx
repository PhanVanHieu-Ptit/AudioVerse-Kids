import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccessibleButton } from './AccessibleButton';

describe('AccessibleButton', () => {
  it('uses a native button, supports keyboard activation, and does not submit forms by default', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <AccessibleButton onClick={onClick}>Khám phá</AccessibleButton>
      </form>,
    );
    const button = screen.getByRole('button', { name: 'Khám phá' });
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter} ');
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps focus while busy and prevents repeated clicks and keyboard activation', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(
      <AccessibleButton onClick={onClick}>Lưu</AccessibleButton>,
    );
    await user.tab();
    rerender(
      <AccessibleButton loading onClick={onClick} loadingLabel="Đang lưu…">
        Lưu
      </AccessibleButton>,
    );
    const button = screen.getByRole('button', { name: 'Đang lưu…' });
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{Enter} ');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
    rerender(<AccessibleButton onClick={onClick}>Lưu</AccessibleButton>);
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('blocks native form submission while a submit button is busy', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <AccessibleButton type="submit" loading>
          Lưu
        </AccessibleButton>
      </form>,
    );
    const button = screen.getByRole('button');
    await user.tab();
    await user.keyboard('{Enter} ');
    await user.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('skips disabled buttons in the keyboard sequence', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <>
        <AccessibleButton disabled onClick={onClick}>
          Chưa có
        </AccessibleButton>
        <AccessibleButton>Tiếp theo</AccessibleButton>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Tiếp theo' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Chưa có' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

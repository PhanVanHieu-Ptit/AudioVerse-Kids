import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { FormField } from './FormField';

it('associates native control with a label, hint and a text error without moving focus', async () => {
  const user = userEvent.setup();
  const field = (error?: string) => (
    <FormField
      label="Câu trả lời"
      hint="Nhập một từ."
      {...(error ? { error } : {})}
    >
      {(control) => <input {...control} required />}
    </FormField>
  );
  const view = render(field());
  const input = screen.getByRole('textbox', { name: 'Câu trả lời' });
  await user.tab();
  expect(input).toHaveFocus();
  expect(input).toBeRequired();
  expect(input).toHaveAccessibleDescription('Nhập một từ.');
  view.rerender(field('Em hãy nhập câu trả lời.'));
  expect(input).toHaveFocus();
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription(
    'Nhập một từ. Lỗi: Em hãy nhập câu trả lời.',
  );
  expect(screen.getByText('Lỗi: Em hãy nhập câu trả lời.')).toHaveAttribute(
    'aria-live',
    'polite',
  );
  await user.type(input, 'nhạc');
  view.rerender(field());
  expect(input).not.toHaveAttribute('aria-invalid');
  expect(input).toHaveValue('nhạc');
});

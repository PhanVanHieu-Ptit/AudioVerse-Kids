import { useId, type ReactNode } from 'react';

interface FieldControl {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
}

/** Native controls retain their semantics, validation and keyboard behavior. */
export function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (control: FieldControl) => ReactNode;
}) {
  const id = useId();
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') ||
    undefined;
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {hint && <p id={`${id}-hint`}>{hint}</p>}
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      <p
        id={`${id}-error`}
        className="field-error"
        aria-live="polite"
        aria-atomic="true"
      >
        {error ? `Lỗi: ${error}` : ''}
      </p>
    </div>
  );
}

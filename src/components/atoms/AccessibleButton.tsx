import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

export interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  size?: 'regular' | 'large';
  loading?: boolean;
  loadingLabel?: string;
  ref?: Ref<HTMLButtonElement>;
}

export function AccessibleButton({
  children,
  variant = 'primary',
  size = 'regular',
  loading = false,
  loadingLabel = 'Đang xử lý…',
  disabled,
  className = '',
  type = 'button',
  onClick,
  ref,
  ...props
}: AccessibleButtonProps) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={`button av-button av-button--${variant} av-button--${size} ${className}`}
      disabled={disabled}
      aria-disabled={loading || disabled || undefined}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick?.(event);
      }}
    >
      {loading && <span className="loading-indicator" aria-hidden="true" />}
      {loading ? loadingLabel : children}
    </button>
  );
}

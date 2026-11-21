import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import { Icon } from '@/components/atoms/Icon';

export function ErrorState({
  title = 'Chưa thể tải nội dung',
  description,
  onRetry,
  retrying = false,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="state-panel av-state av-state--error">
      <div role="alert" aria-atomic="true">
        <span className="state-symbol">
          <Icon name="alert" />
        </span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {onRetry && (
        <AccessibleButton
          variant="secondary"
          onClick={onRetry}
          loading={retrying}
          loadingLabel="Đang thử lại…"
        >
          <Icon name="refresh" />
          Thử lại
        </AccessibleButton>
      )}
    </div>
  );
}

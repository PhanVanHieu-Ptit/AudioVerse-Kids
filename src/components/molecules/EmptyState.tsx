import { useId, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/atoms/Icon';

export function EmptyState({
  title,
  description,
  action,
  icon = 'stories',
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: IconName;
}) {
  const id = useId();
  return (
    <section className="state-panel av-state" aria-labelledby={id}>
      <span className="state-symbol" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <h3 id={id}>{title}</h3>
      <p>{description}</p>
      {action}
    </section>
  );
}

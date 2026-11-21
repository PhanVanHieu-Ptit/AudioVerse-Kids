import { useId, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/atoms/Icon';

export function EmptyState({
  title,
  description,
  action,
  icon = 'stories',
  headingLevel = 3,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: IconName;
  headingLevel?: 2 | 3;
}) {
  const id = useId();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section className="state-panel av-state" aria-labelledby={id}>
      <span className="state-symbol" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <Heading id={id}>{title}</Heading>
      <p>{description}</p>
      {action}
    </section>
  );
}

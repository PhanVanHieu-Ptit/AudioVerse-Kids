import { useId, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/atoms/Icon';

export interface AppCardProps {
  title: string;
  description: string;
  icon?: IconName;
  tone?: 'purple' | 'teal' | 'orange' | 'blue';
  headingLevel?: 2 | 3;
  children?: ReactNode;
}

export function AppCard({
  title,
  description,
  icon,
  tone = 'purple',
  headingLevel = 3,
  children,
}: AppCardProps) {
  const id = useId();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="av-card" aria-labelledby={id}>
      {icon && (
        <span className={`category-icon ${tone}`}>
          <Icon name={icon} />
        </span>
      )}
      <Heading id={id}>{title}</Heading>
      <p>{description}</p>
      {children && <div className="av-card__actions">{children}</div>}
    </article>
  );
}

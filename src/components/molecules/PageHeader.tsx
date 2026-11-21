import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { env } from '@/lib/env';

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `${title} | ${env.appName}`;
    if (!document.querySelector('dialog[open]')) heading.current?.focus();
  }, [title, pathname]);
  return (
    <header className="page-heading av-page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        <p>{description}</p>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </header>
  );
}

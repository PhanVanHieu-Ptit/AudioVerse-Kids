import { useEffect, useRef } from 'react';
import { env } from '@/lib/env';

export function PageHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = `${title} | ${env.appName}`;
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [title]);

  return (
    <header className="page-heading">
      <h1 ref={heading} tabIndex={-1}>
        {title}
      </h1>
      <p>{description}</p>
    </header>
  );
}

import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/molecules/EmptyState';
import { PageHeading } from '@/components/molecules/PageHeading';
import type { Section } from '@/content/sections';

export function SectionPage({ section }: { section: Section }) {
  return (
    <>
      <PageHeading title={section.title} description={section.description} />
      <EmptyState
        headingLevel={2}
        icon={section.icon}
        title="Một thế giới mới đang được chuẩn bị"
        description={section.emptyMessage}
        action={
          <Link className="button" to="/">
            Về trang khám phá
          </Link>
        }
      />
    </>
  );
}

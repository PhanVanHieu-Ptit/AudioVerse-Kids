import { Link } from 'react-router-dom';
import { Icon } from '@/components/atoms/Icon';
import { PageHeading } from '@/components/molecules/PageHeading';
import type { Section } from '@/content/sections';

export function SectionPage({ section }: { section: Section }) {
  return (
    <>
      <PageHeading title={section.title} description={section.description} />
      <section className="state-panel" aria-labelledby="empty-title">
        <span className={`category-icon ${section.color}`}>
          <Icon name={section.icon} />
        </span>
        <h2 id="empty-title">Một thế giới mới đang được chuẩn bị</h2>
        <p>{section.emptyMessage}</p>
        <Link className="button" to="/">
          Về trang khám phá
        </Link>
      </section>
    </>
  );
}

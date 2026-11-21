import { Link } from 'react-router-dom';
import { EmptyState, PageHeader } from '@/design-system';

export default function StoryPage() {
  return (
    <>
      <PageHeader
        title="Nghe truyện"
        description="Một không gian để lắng nghe theo nhịp của em."
      />
      <EmptyState
        headingLevel={2}
        title="Chưa tìm thấy truyện này"
        description="Truyện có thể chưa được bổ sung hoặc đường dẫn chưa đúng. Hiện thư viện chưa có bản thu âm để phát."
        action={
          <Link className="button" to="/stories">
            Về thư viện truyện
          </Link>
        }
      />
    </>
  );
}

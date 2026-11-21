import { Link } from 'react-router-dom';
import { PageHeading } from '@/components/molecules/PageHeading';

export default function NotFoundPage() {
  return (
    <>
      <PageHeading
        title="Không tìm thấy trang"
        description="Đường dẫn này chưa có trong thế giới âm thanh."
      />
      <Link className="button" to="/">
        Về trang khám phá
      </Link>
    </>
  );
}

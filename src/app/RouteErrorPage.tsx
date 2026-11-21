import { Link } from 'react-router-dom';
import { PageHeading } from '@/components/molecules/PageHeading';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';

export function RouteErrorPage() {
  return (
    <main className="fatal-error" id="main-content">
      <RouteErrorContent />
    </main>
  );
}

export function RouteErrorContent() {
  return (
    <>
      <PageHeading
        title="Chưa thể mở trang"
        description="Trang đang gặp sự cố hoặc chưa có sẵn ngoại tuyến. Em có thể mở trang khác hoặc kết nối mạng rồi tải lại. Tiến độ chưa lưu có thể mất khi tải lại."
      />
      <AccessibleButton onClick={() => window.location.reload()}>
        Tải lại trang
      </AccessibleButton>
      <Link className="text-link" to="/">
        Về trang chủ
      </Link>
    </>
  );
}

import { Link } from 'react-router-dom';
import { PageHeading } from '@/components/molecules/PageHeading';

export function RouteErrorPage() {
  return (
    <main className="fatal-error" id="main-content">
      <PageHeading
        title="Chưa thể mở trang"
        description="Trang có thể chưa được lưu ngoại tuyến hoặc đang gặp sự cố. Em hãy kết nối mạng rồi thử lại."
      />
      <button className="button" onClick={() => window.location.reload()}>
        Tải lại trang
      </button>
      <Link className="text-link" to="/">
        Về trang chủ
      </Link>
    </main>
  );
}

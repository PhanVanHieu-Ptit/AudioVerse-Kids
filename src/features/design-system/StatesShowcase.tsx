import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorState } from '@/components/molecules/ErrorState';
import { LoadingState } from '@/components/molecules/LoadingState';
import { ShowcaseSection } from './ShowcaseSection';

export function StatesShowcase() {
  const [retried, setRetried] = useState(false);
  return (
    <ShowcaseSection
      id="trang-thai"
      title="Luôn có lời hướng dẫn tiếp theo"
      description="Mẫu trạng thái tải, trống và lỗi. Thông báo bằng chữ, không chỉ dựa vào màu hay chuyển động."
    >
      <div className="showcase-grid showcase-grid--three">
        <LoadingState label="Đang tải nội dung mẫu…" />
        <EmptyState
          title="Chưa có nội dung đã lưu"
          description="Khi có nội dung tải về, em sẽ tìm thấy ở đây."
          action={
            <Link className="text-link" to="/stories">
              Khám phá kho truyện
            </Link>
          }
        />
        <ErrorState
          title="Mẫu lỗi tải nội dung"
          description={
            retried
              ? 'Đã nhận thao tác thử lại. Đây là mẫu lỗi; không có yêu cầu tải nội dung nào được gửi.'
              : 'Chưa thể mở nội dung. Em có thể thử lại khi sẵn sàng.'
          }
          onRetry={() => setRetried(true)}
        />
      </div>
    </ShowcaseSection>
  );
}

import { Link } from 'react-router-dom';
import { AppCard } from '@/components/molecules/AppCard';
import { AudioCard } from '@/components/molecules/AudioCard';
import { AudioButton } from '@/components/atoms/AudioButton';
import { tonePreview } from '@/content/designSystem';
import { useTonePreview } from '@/hooks/useTonePreview';
import { ShowcaseSection } from './ShowcaseSection';

export function CardsShowcase() {
  const { state, activate } = useTonePreview();
  return (
    <ShowcaseSection
      id="the-noi-dung"
      title="Nội dung có tiếng nói riêng"
      description="Thẻ có tiêu đề, mô tả và hành động riêng. Không lồng nút bên trong một vùng bấm khác."
    >
      <div className="showcase-grid showcase-grid--two showcase-grid--three">
        <AppCard
          title="Kho truyện"
          description="Không gian dành cho những câu chuyện được lắng nghe, tưởng tượng và khám phá."
          icon="stories"
        >
          <Link className="text-link" to="/stories">
            Mở kho truyện
          </Link>
        </AppCard>
        <AudioCard
          title={tonePreview.title}
          description={tonePreview.description}
          metadata="Âm tổng hợp · khoảng 2 giây"
          transcript={tonePreview.transcript}
          state={state}
          onActivate={() => {
            void activate();
          }}
          feedback={
            state === 'error'
              ? 'Trình duyệt chưa thể phát âm thử. Em có thể thử lại hoặc đọc nội dung bằng chữ.'
              : state === 'playing'
                ? 'Đang phát âm thử. Chọn Tạm dừng để dừng ngay.'
                : state === 'paused'
                  ? 'Đã tạm dừng. Nghe tiếp sẽ phát nốt nhạc từ đầu.'
                  : 'Âm thử có âm lượng nhỏ. Hãy điều chỉnh âm lượng thiết bị cho thoải mái.'
          }
        />
        <AudioCard
          title="Câu chuyện tiếp theo"
          description="Mẫu thẻ khi chưa có tài nguyên âm thanh được duyệt."
          metadata="Chưa có bản ghi âm"
          state="unavailable"
        />
      </div>
      <div className="showcase-panel audio-state-samples">
        <h3>Các trạng thái bổ sung của AudioButton</h3>
        <div className="button-samples">
          <AudioButton title="Mẫu đang tải" state="loading" />
          <AudioButton title="Mẫu lỗi chưa kết nối nguồn" state="error" />
          <AudioButton title="Mẫu tạm dừng chưa kết nối nguồn" state="paused" />
          <AudioButton title="Mẫu vô hiệu hóa" state="ready" disabled />
        </div>
        <p className="token-note">
          Đây là mẫu trạng thái tĩnh. Nút chưa kết nối nguồn bị vô hiệu hóa; chỉ
          thẻ âm thử phía trên phát âm thanh thật.
        </p>
      </div>
    </ShowcaseSection>
  );
}

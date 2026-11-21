import { useState } from 'react';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import { Icon } from '@/components/atoms/Icon';
import { AppDialog } from '@/components/organisms/AppDialog';
import { ShowcaseSection } from './ShowcaseSection';

export function ControlsShowcase() {
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <ShowcaseSection
      id="dieu-khien"
      title="Tự tin ở mỗi lần chạm"
      description="Nhãn rõ ràng. Vùng chạm tối thiểu 48 × 48 CSS px ở cỡ chữ mặc định. Dùng được với Enter và Space."
    >
      <div className="showcase-grid showcase-grid--two">
        <div className="showcase-panel">
          <h3>Các kiểu nút</h3>
          <div className="button-samples">
            <AccessibleButton
              onClick={() => setMessage('Em đã chọn bắt đầu khám phá.')}
            >
              <Icon name="play" />
              Bắt đầu khám phá
            </AccessibleButton>
            <AccessibleButton
              variant="secondary"
              onClick={() => setDialogOpen(true)}
            >
              Xem hướng dẫn
            </AccessibleButton>
            <AccessibleButton
              variant="quiet"
              onClick={() => setMessage('Em đã chọn để sau.')}
            >
              Để sau
            </AccessibleButton>
            <AccessibleButton
              variant="danger"
              onClick={() => setDialogOpen(true)}
            >
              Thử nút cảnh báo
            </AccessibleButton>
          </div>
          <p className="showcase-result" role="status">
            {message}
          </p>
        </div>
        <div className="showcase-panel">
          <h3>Kích thước & trạng thái</h3>
          <div className="button-samples">
            <AccessibleButton
              size="large"
              onClick={() => setMessage('Nút lớn đã nhận thao tác.')}
            >
              <Icon name="sound" />
              Nút lớn
            </AccessibleButton>
            <AccessibleButton disabled>Chưa khả dụng</AccessibleButton>
            <AccessibleButton loading loadingLabel="Đang xử lý…">
              Lưu lựa chọn
            </AccessibleButton>
          </div>
          <p className="token-note">
            Trạng thái bận giữ focus và chặn thao tác lặp. Các mẫu bận và vô
            hiệu hóa chỉ minh họa trạng thái.
          </p>
        </div>
        <div className="showcase-panel">
          <h3>Focus luôn nhìn thấy</h3>
          <div className="button-samples">
            <AccessibleButton
              variant="secondary"
              className="focus-example"
              onClick={() => setMessage('Em đã thử nút có viền focus.')}
            >
              <Icon name="keyboard" />
              Thử dùng phím Tab
            </AccessibleButton>
          </div>
          <p className="token-note">
            Viền 3px và lớp đệm tương phản. Mẫu trên luôn hiện viền; các nút
            khác hiện khi dùng bàn phím.
          </p>
        </div>
        <div className="showcase-panel">
          <h3>Hộp thoại có điểm trở về</h3>
          <p>
            Focus ở trong hộp thoại khi mở và trở về nút đã mở khi đóng. Nhấn
            Escape hoặc chọn Đóng.
          </p>
          <div className="dialog-demo-action">
            <AccessibleButton
              variant="secondary"
              onClick={() => setDialogOpen(true)}
            >
              Mở hộp thoại mẫu
            </AccessibleButton>
          </div>
        </div>
      </div>
      <AppDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Khám phá theo cách của em"
        description="Em có thể dùng bàn phím, chạm màn hình hoặc trình đọc màn hình. Không cần bật micro."
      >
        <p>
          Nhấn Tab để đến điều khiển tiếp theo, Shift + Tab để quay lại. Enter
          hoặc Space để chọn nút. Escape để đóng hộp thoại.
        </p>
        <div className="dialog-demo-action">
          <AccessibleButton onClick={() => setDialogOpen(false)}>
            <Icon name="check" />
            Em đã hiểu
          </AccessibleButton>
        </div>
      </AppDialog>
    </ShowcaseSection>
  );
}

import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/molecules/PageHeader';
import { VoiceGuidanceButton } from '@/accessibility/VoiceGuidanceButton';
import { keyboardHelp } from '@/content/accessibility';
import { voiceMessages } from '@/content/voiceMessages';

export default function KeyboardHelpPage() {
  return (
    <>
      <PageHeader
        title="Trợ giúp bàn phím"
        description="Em có thể khám phá bằng bàn phím, cảm ứng hoặc trình đọc màn hình."
      />
      <section className="settings-panel" aria-labelledby="keyboard-title">
        <h2 id="keyboard-title">Các phím thường dùng</h2>
        <p>
          Ứng dụng không có phím tắt toàn cục. Nếu đang dùng trình đọc màn hình,
          em có thể tiếp tục dùng các phím và cử chỉ quen thuộc của mình.
        </p>
        <dl className="keyboard-help">
          {keyboardHelp.map(({ keys, action }) => (
            <div key={keys}>
              <dt>
                <kbd>{keys}</kbd>
              </dt>
              <dd>{action}</dd>
            </div>
          ))}
        </dl>
        <p>{voiceMessages.appHelp.text}</p>
        <p>
          Bộ điều khiển âm thanh có nút “Trợ giúp điều khiển”. Em có thể bật
          phím tắt riêng và xem danh sách phím trong hộp thoại này. Phím tắt mặc
          định tắt và chỉ hoạt động khi focus ở các nút của bộ điều khiển. Dùng
          Tab và Enter hoặc Space luôn được, không cần bật phím tắt.
        </p>
        <VoiceGuidanceButton message={voiceMessages.appHelp} />
      </section>
      <section className="settings-panel" aria-labelledby="explore-title">
        <h2 id="explore-title">Khám phá theo cách của em</h2>
        <p>
          Dùng liên kết “Bỏ qua điều hướng, đến nội dung chính” ở đầu trang. Khi
          mở một trang mới, tiêu đề trang được chọn để em biết mình đang ở đâu.
        </p>
        <p>
          Trong trò chơi, dùng nút Nghe nốt nhạc rồi chọn đáp án; có thể nghe
          lại hoặc mở mô tả bằng chữ. Không giới hạn thời gian, không cần kéo
          thả hoặc micrô.
        </p>
        <p>
          Trên màn hình cảm ứng, chạm vào nút. Với trình đọc màn hình, vuốt đến
          điều khiển rồi chạm hai lần theo hướng dẫn của thiết bị.
        </p>
        <p>
          Trong Cài đặt, em có thể bật chữ lớn, tương phản cao, giảm chuyển động
          và hướng dẫn giọng nói. Chức năng phóng to của trình duyệt vẫn dùng
          được.
        </p>
        <p>
          Hướng dẫn giọng nói mặc định tắt. Nếu dùng trình đọc màn hình, em có
          thể để tắt để tránh hai giọng đọc cùng lúc. Hướng dẫn chỉ đọc sau khi
          bấm Nghe hướng dẫn; bấm Dừng hướng dẫn để dừng.
        </p>
        <Link className="text-link" to="/settings">
          Mở cài đặt khả năng tiếp cận
        </Link>
      </section>
    </>
  );
}

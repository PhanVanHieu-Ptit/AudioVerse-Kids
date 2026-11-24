import { AccessibleButton } from '@/design-system';
import { useStoryDownload } from '@/hooks/useStoryDownload';

export function StoryDownload({ storyId }: { storyId: string }) {
  const download = useStoryDownload(storyId);
  return (
    <section className="story-download" aria-label="Nghe truyện ngoại tuyến">
      <p>
        Audio được tải khi em chọn nghe. Để nghe cả truyện khi không có mạng,
        tải tất cả các nhánh và phản hồi về thiết bị (
        {(download.bytes / 1024 / 1024).toFixed(1)} MB).
      </p>
      <p role="status" aria-label="Trạng thái tải truyện">
        {download.status === 'checking'
          ? 'Đang kiểm tra bản lưu trên thiết bị…'
          : download.status === 'downloading'
            ? `Đang tải ${download.completed} trên ${download.total} tệp…`
            : download.status === 'ready'
              ? 'Đã lưu đủ âm thanh truyện trên thiết bị. Em có thể nghe ngoại tuyến; trình duyệt có thể thu hồi dung lượng khi cần.'
              : download.status === 'error'
                ? 'Chưa tải đủ truyện. Kiểm tra kết nối hoặc dung lượng rồi thử lại. Em vẫn có thể đọc bằng chữ.'
                : download.status === 'cancelled'
                  ? 'Đã hủy lượt tải. Các tệp tải xong được giữ lại; em có thể tiếp tục tải sau.'
                  : 'Chưa lưu đủ âm thanh truyện để nghe ngoại tuyến.'}
      </p>
      <AccessibleButton
        variant="secondary"
        disabled={download.status === 'checking' || download.total === 0}
        onClick={
          download.status === 'downloading' ? download.cancel : download.start
        }
      >
        {download.status === 'downloading'
          ? 'Hủy tải truyện'
          : download.status === 'ready'
            ? 'Kiểm tra bản lưu'
            : download.status === 'error'
              ? 'Thử tải truyện lại'
              : 'Tải truyện để nghe ngoại tuyến'}
      </AccessibleButton>
    </section>
  );
}

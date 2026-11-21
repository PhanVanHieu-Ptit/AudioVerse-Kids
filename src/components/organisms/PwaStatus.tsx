import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaStatus() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!offlineReady && !needRefresh) return null;

  return (
    <aside className="pwa-notice" aria-label="Thông báo ứng dụng">
      <p role="status">
        {needRefresh
          ? 'Có phiên bản mới. Em có thể cập nhật khi sẵn sàng.'
          : 'Giao diện đã sẵn sàng để mở khi không có mạng. Nội dung âm thanh chưa được tải về.'}
      </p>
      {needRefresh ? (
        <button
          className="button"
          onClick={() => {
            void updateServiceWorker(true);
          }}
        >
          Cập nhật ứng dụng
        </button>
      ) : (
        <button
          className="button secondary"
          onClick={() => setOfflineReady(false)}
        >
          Đã hiểu
        </button>
      )}
    </aside>
  );
}

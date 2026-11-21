import { useStore } from 'zustand';
import { AccessibleButton } from '@/design-system';
import { activityStore } from '@/stores/activityStore';

export function ProgressNotice() {
  const status = useStore(activityStore, (state) => state.status);
  const saveStatus = useStore(activityStore, (state) => state.saveStatus);
  const memory = status === 'memory' || saveStatus === 'error';
  return (
    <div className="progress-notice">
      <p role="status">
        {memory
          ? 'Chưa lưu được trên thiết bị. Tiến độ được giữ trong phiên này; đừng tải lại hoặc đóng trang nếu muốn giữ tiến độ.'
          : saveStatus === 'saving'
            ? 'Đang lưu tiến độ…'
            : saveStatus === 'saved'
              ? 'Đã lưu tiến độ trên thiết bị.'
              : 'Tiến độ chỉ được lưu trên thiết bị này.'}
      </p>
      {memory && (
        <AccessibleButton
          variant="secondary"
          loading={saveStatus === 'saving'}
          onClick={() => void activityStore.getState().retry()}
        >
          Thử lưu tiến độ lại
        </AccessibleButton>
      )}
    </div>
  );
}

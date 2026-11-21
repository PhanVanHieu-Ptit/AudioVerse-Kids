import { useState } from 'react';
import { useBeforeUnload, useBlocker, useLocation } from 'react-router-dom';
import { useStore } from 'zustand';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import { AppDialog } from '@/components/organisms/AppDialog';
import { activityStore } from '@/stores/activityStore';

/** One blocker in the persistent layout, shared by all activity routes. */
export function ActivityNavigationGuard() {
  const { pathname } = useLocation();
  const activePath = useStore(activityStore, (state) => state.activePath);
  const saveStatus = useStore(activityStore, (state) => state.saveStatus);
  const status = useStore(activityStore, (state) => state.status);
  const [leaving, setLeaving] = useState(false);
  const active = activePath === pathname;
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      active && currentLocation.pathname !== nextLocation.pathname,
  );
  useBeforeUnload((event) => {
    if (active || saveStatus === 'saving') {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  const memoryOnly = status === 'memory' || saveStatus === 'error';

  async function leave() {
    if (blocker.state !== 'blocked') return;
    setLeaving(true);
    await activityStore.getState().flush();
    setLeaving(false);
    // Keep the warning visible if the pending write failed after opening.
    if (activityStore.getState().saveStatus === 'error' && !memoryOnly) return;
    activityStore.getState().deactivate();
    blocker.proceed();
  }

  return (
    <AppDialog
      open={blocker.state === 'blocked'}
      title="Em muốn tạm rời hoạt động?"
      description={
        memoryOnly
          ? 'Chưa lưu được tiến độ trên thiết bị. Tiến độ chỉ được giữ trong phiên này; tải lại hoặc đóng trang có thể làm mất tiến độ.'
          : 'Em có thể ở lại hoặc tạm rời. Tiến độ sẽ được lưu trên thiết bị để em tiếp tục sau.'
      }
      onClose={() => {
        if (!leaving && blocker.state === 'blocked') blocker.reset();
      }}
    >
      <div className="activity-actions">
        <AccessibleButton
          disabled={leaving}
          onClick={() => {
            if (blocker.state === 'blocked') blocker.reset();
          }}
        >
          Ở lại hoạt động
        </AccessibleButton>
        <AccessibleButton
          variant="secondary"
          loading={leaving}
          loadingLabel="Đang giữ tiến độ…"
          onClick={() => void leave()}
        >
          {memoryOnly ? 'Rời đi, giữ trong phiên' : 'Lưu và tạm rời'}
        </AccessibleButton>
        {memoryOnly && (
          <AccessibleButton
            variant="quiet"
            loading={saveStatus === 'saving'}
            onClick={() => void activityStore.getState().retry()}
          >
            Thử lưu lại
          </AccessibleButton>
        )}
      </div>
    </AppDialog>
  );
}

import { PageHeading } from '@/components/molecules/PageHeading';
import { LoadingState } from '@/components/molecules/LoadingState';
import { displayOptions } from '@/content/settings';
import { usePreferences } from '@/hooks/usePreferences';

export default function SettingsPage() {
  const { preferences, status, saveStatus, updatePreference } =
    usePreferences();
  return (
    <>
      <PageHeading
        title="Cài đặt cho em"
        description="Chọn cách hiển thị giúp em sử dụng thoải mái nhất."
      />
      {status === 'loading' ? (
        <LoadingState />
      ) : (
        <section className="settings-panel" aria-labelledby="display-title">
          <h2 id="display-title">Hiển thị và chuyển động</h2>
          <p>Các lựa chọn được áp dụng ngay và chỉ lưu trên thiết bị này.</p>
          <div className="settings-options">
            {displayOptions.map((option) => (
              <label className="setting-option" key={option.key}>
                <span>
                  <strong>{option.title}</strong>
                  <span id={`${option.key}-description`}>
                    {option.description}
                  </span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label={option.title}
                  aria-describedby={`${option.key}-description`}
                  checked={preferences[option.key]}
                  onChange={(event) => {
                    void updatePreference(option.key, event.target.checked);
                  }}
                />
              </label>
            ))}
          </div>
          <p role="status" className="save-status">
            {status === 'memory'
              ? 'Không thể lưu trên thiết bị. Em vẫn dùng được cài đặt trong phiên này.'
              : saveStatus === 'saving'
                ? 'Đang lưu cài đặt…'
                : saveStatus === 'saved'
                  ? 'Đã lưu cài đặt trên thiết bị.'
                  : 'Em có thể thay đổi bất cứ lúc nào.'}
          </p>
        </section>
      )}
      <aside className="privacy-panel">
        <h2>Không gian riêng của em</h2>
        <p>
          Không đăng nhập, không quảng cáo, không theo dõi. Cài đặt được lưu cục
          bộ; xóa dữ liệu trang web trong trình duyệt sẽ xóa các lựa chọn đã
          lưu.
        </p>
        <p>
          Ứng dụng tôn trọng cài đặt giảm chuyển động của thiết bị, ngay cả khi
          em chưa bật lựa chọn bên trên.
        </p>
      </aside>
    </>
  );
}

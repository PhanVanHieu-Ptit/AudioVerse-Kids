import { themes } from '@/content/designSystem';
import { usePreferences } from '@/hooks/usePreferences';
import { LoadingState } from '@/components/molecules/LoadingState';
import { ShowcaseSection } from './ShowcaseSection';

export function ThemeShowcase() {
  const { preferences, status, saveStatus, updatePreference } =
    usePreferences();
  const activeTheme = preferences.highContrast ? 'contrast' : preferences.theme;
  return (
    <ShowcaseSection
      id="giao-dien"
      title="Một hệ thống. Nhiều cách cảm nhận."
      description="Thử trên toàn bộ trang. Các lựa chọn được lưu riêng trên thiết bị này."
    >
      {status === 'loading' ? (
        <LoadingState label="Đang đọc cài đặt hiển thị…" />
      ) : (
        <div className="showcase-panel">
          <fieldset className="theme-options">
            <legend>Chọn giao diện</legend>
            <div className="showcase-controls">
              {themes.map((theme) => (
                <label key={theme.id}>
                  <input
                    type="radio"
                    name="theme"
                    value={theme.id}
                    checked={activeTheme === theme.id}
                    onChange={() => {
                      if (theme.id === 'contrast')
                        void updatePreference('highContrast', true);
                      else {
                        void updatePreference('theme', theme.id);
                        void updatePreference('highContrast', false);
                      }
                    }}
                  />
                  {theme.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="showcase-controls">
            <label>
              <input
                type="checkbox"
                checked={preferences.largeText}
                onChange={(event) => {
                  void updatePreference('largeText', event.target.checked);
                }}
              />
              Chữ lớn hơn
            </label>
            <label>
              <input
                type="checkbox"
                checked={preferences.reducedMotion}
                onChange={(event) => {
                  void updatePreference('reducedMotion', event.target.checked);
                }}
              />
              Giảm chuyển động
            </label>
          </div>
          <p className="token-note" role="status">
            {status === 'memory'
              ? 'Không thể lưu cài đặt; các lựa chọn vẫn dùng được trong phiên này.'
              : saveStatus === 'saving'
                ? 'Đang lưu cài đặt…'
                : saveStatus === 'saved'
                  ? 'Đã lưu cài đặt trên thiết bị.'
                  : 'Luôn tôn trọng lựa chọn giảm chuyển động của thiết bị.'}
          </p>
        </div>
      )}
    </ShowcaseSection>
  );
}

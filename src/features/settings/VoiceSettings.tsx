import { usePreferences } from '@/hooks/usePreferences';
import { FormField } from '@/components/molecules/FormField';
import { VoiceGuidanceButton } from '@/accessibility/VoiceGuidanceButton';
import { guidanceCopy } from '@/content/accessibility';

export function VoiceSettings() {
  const { preferences, updatePreference } = usePreferences();
  return (
    <section className="settings-panel" aria-labelledby="voice-title">
      <h2 id="voice-title">Hướng dẫn giọng nói</h2>
      <p>
        Chỉ đọc khi em bấm Nghe hướng dẫn. Nếu dùng trình đọc màn hình, em có
        thể để tắt để tránh hai giọng đọc cùng lúc.
      </p>
      <label className="setting-option">
        <span>
          <strong>Bật hướng dẫn giọng nói</strong>
          <span id="voice-description">
            Dùng giọng tiếng Việt cục bộ của thiết bị. Không dùng micrô, không
            gửi nội dung lên dịch vụ đọc trực tuyến.
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          aria-label="Bật hướng dẫn giọng nói"
          aria-describedby="voice-description"
          checked={preferences.voiceGuidance}
          onChange={(event) => {
            void updatePreference('voiceGuidance', event.target.checked);
          }}
        />
      </label>
      <FormField label="Tốc độ hướng dẫn" hint="Áp dụng cho lần đọc tiếp theo.">
        {(control) => (
          <select
            {...control}
            disabled={!preferences.voiceGuidance}
            value={preferences.guidanceRate}
            onChange={(event) => {
              const rate = Number(event.target.value);
              void updatePreference(
                'guidanceRate',
                rate === 0.8 || rate === 1.2 ? rate : 1,
              );
            }}
          >
            <option value={0.8}>Chậm</option>
            <option value={1}>Vừa</option>
            <option value={1.2}>Nhanh</option>
          </select>
        )}
      </FormField>
      <p>{guidanceCopy.requirements}</p>
      <VoiceGuidanceButton text={guidanceCopy.settings} />
    </section>
  );
}

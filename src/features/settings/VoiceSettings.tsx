import { usePreferences } from '@/hooks/usePreferences';
import { FormField } from '@/components/molecules/FormField';
import { VoiceGuidanceButton } from '@/accessibility/VoiceGuidanceButton';
import { voiceMessages, voiceUi } from '@/content/voiceMessages';

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
            Ưu tiên bản thu nếu có; có thể dùng TTS tiếng Việt cục bộ. Không
            dùng micrô, không gửi nội dung lên dịch vụ đọc trực tuyến.
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
      <FormField
        label="Âm lượng hướng dẫn"
        hint="Áp dụng cho lần đọc tiếp theo. Chọn 0 để tắt tiếng và dừng lời đọc."
      >
        {(control) => (
          <input
            {...control}
            type="range"
            min={0}
            max={100}
            step={5}
            aria-valuetext={`${Math.round(preferences.guidanceVolume * 100)} phần trăm`}
            disabled={!preferences.voiceGuidance}
            value={Math.round(preferences.guidanceVolume * 100)}
            onChange={(event) => {
              void updatePreference(
                'guidanceVolume',
                Number(event.target.value) / 100,
              );
            }}
          />
        )}
      </FormField>
      <fieldset
        className="voice-source"
        disabled={!preferences.voiceGuidance}
        aria-describedby="voice-source-description"
      >
        <legend>Nguồn đọc bổ sung</legend>
        <p id="voice-source-description">
          Giọng đọc của thiết bị chỉ dùng tiếng Việt cục bộ khi thiếu bản thu.
          Nếu chỉ chọn bản thu mà chưa có file, em vẫn có hướng dẫn bằng chữ.
        </p>
        <label>
          <input
            type="radio"
            name="voice-source"
            checked={preferences.guidanceTts}
            onChange={() => {
              void updatePreference('guidanceTts', true);
            }}
          />
          <span>Dùng thêm giọng đọc của thiết bị</span>
        </label>
        <label>
          <input
            type="radio"
            name="voice-source"
            checked={!preferences.guidanceTts}
            onChange={() => {
              void updatePreference('guidanceTts', false);
            }}
          />
          <span>Chỉ dùng bản thu</span>
        </label>
      </fieldset>
      <p>{voiceUi.requirements}</p>
      <p>{voiceMessages.settings.text}</p>
      <VoiceGuidanceButton message={voiceMessages.settings} />
    </section>
  );
}

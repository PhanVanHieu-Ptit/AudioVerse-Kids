# Hướng dẫn giọng nói tiếng Việt

Phạm vi: lời chào trên trang khám phá, hướng dẫn bàn phím/cảm ứng, cài đặt, tên và thao tác trò chơi, kết quả và lỗi phát âm thanh. Tất cả được đọc theo yêu cầu của người dùng. Bật cài đặt, mở trang hay khôi phục phiên không tự phát lời đọc.

## Cấu trúc

| File                                        | Trách nhiệm                                                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/content/voiceMessages.ts`              | Catalog tiếng Việt, nhãn điều khiển, thông báo fallback; tạo message tên + hướng dẫn từ content hoạt động. |
| `src/engines/audio/voiceTypes.ts`           | Message, trạng thái, tùy chọn và hợp đồng adapter. Không phụ thuộc React.                                  |
| `src/engines/audio/VoiceGuidanceService.ts` | Điều phối một lời đọc, ưu tiên bản thu, fallback TTS tùy chọn, hủy, đọc lại, timeout, subscription.        |
| `src/engines/audio/voiceAdapters.ts`        | HTMLAudioElement + cache IndexedDB hiện có; adapter SpeechSynthesis tiếng Việt cục bộ.                     |
| `src/engines/audio/VoiceGuidance.ts`        | Singleton dùng chung với AudioManager, tone preview và dialog.                                             |
| `src/hooks/useVoiceGuidance.ts`             | Kết nối React, đọc cài đặt mới nhất khi bấm nghe, xóa thông báo hoạt động đang chờ.                        |
| `src/accessibility/VoiceGuidanceButton.tsx` | Nút nghe/hủy/dừng, giữ nguyên focus; vẫn hủy được khi đang tải.                                            |
| `src/accessibility/GuidanceStatus.tsx`      | Trạng thái accessible, transcript, đọc lại; vòng đời route, visibility và pagehide.                        |
| `src/features/settings/VoiceSettings.tsx`   | Bật/tắt, tốc độ, âm lượng, cho phép TTS cục bộ hoặc chỉ bản thu.                                           |
| `src/stores/preferencesStore.ts`            | Validate, migrate và lưu cài đặt trong IndexedDB; giữ khả năng dùng trong phiên nếu lưu thất bại.          |

`VoiceGuidanceService` nhận adapter qua constructor. Có thể bỏ hẳn adapter TTS; bản thu vẫn hoạt động khi SpeechSynthesis và AudioContext đều không có. Không có request tới dịch vụ TTS trực tuyến, không dùng micrô.

## Vòng đời và lỗi

- `idle → loading → speaking → idle`; kết thúc lỗi là `error` hoặc `unavailable` nếu không có nguồn/giọng phù hợp.
- Lệnh mới hủy lệnh cũ, không xếp hàng. Callback hoặc kết quả tải cũ không được đổi trạng thái lời đọc mới.
- Bản thu thất bại chuyển sang TTS khi người dùng vẫn cho phép TTS. Nếu TTS cũng thất bại, giữ transcript và thông báo lỗi. Không tự lặp lại request lỗi.
- Hủy bằng AbortSignal; bỏ nguồn audio, dọn listener, thu hồi Blob URL và hủy utterance thuộc request. Cache tải muộn không được tự bắt đầu phát.
- Đổi location (kể cả cùng pathname), unmount hoặc rời hoạt động sẽ dừng và xóa message để nút đọc lại không phát hướng dẫn của hoạt động trước.
- Ẩn trang/pagehide, mở dialog, bắt đầu âm nội dung, trả lời game hoặc tắt hướng dẫn sẽ dừng lời đọc. Trở lại ứng dụng không tự tiếp tục.
- Giới hạn tải bản thu 15 giây; watchdog mỗi request 120 giây. Adapter tùy chỉnh vẫn phải tự giải phóng nguồn phát khi abort; service có chặn callback cũ và giải phóng Promise chờ của caller.

## Cài đặt và khả năng tiếp cận

Mặc định: hướng dẫn tắt, tốc độ `1`, âm lượng `0.7`, cho phép TTS cục bộ làm nguồn bổ sung. Khi bật hướng dẫn, người dùng vẫn cần bấm nút nghe. Tốc độ `0.8 / 1 / 1.2` và âm lượng được dùng từ lần đọc kế tiếp; đặt âm lượng 0 sẽ dừng ngay. Tắt TTS sẽ hủy lời đọc TTS hiện tại và ngăn fallback TTS từ bản thu đang tải.

Lời chào, hướng dẫn, kết quả và lỗi có văn bản trong nội dung trang. Message vừa yêu cầu còn được hiển thị cùng nút đọc lại/dừng. Fallback lỗi dùng live region `role="status"` luôn được mount; transcript không nằm trong live region để tránh tự đọc trùng. Thông báo kết quả hoạt động được xóa trước khi chủ động nghe; live region hoạt động chuyển `aria-live="off"` trong lúc service tải/đọc.

Ứng dụng không biết chắc screen reader đang đọc hay đã bật. Không thể bảo đảm triệt tiêu mọi tiếng chồng của phần mềm bên ngoài: nên để hướng dẫn tắt khi sử dụng screen reader. Không tự đọc khi focus, không có phím tắt toàn cục. Trải nghiệm NVDA, VoiceOver, TalkBack và độ rõ giọng Việt trên thiết bị thật còn phải kiểm tra thủ công.

## Bộ file giọng Việt và cách tái tạo

Ứng dụng đóng gói 8 file MP3 tiếng Việt trong `public/audio/guidance/`: lời chào, trợ giúp, cài đặt, hướng dẫn trò chơi âm cao–trầm, kết quả sai/đúng/hoàn thành và lỗi audio. Đây là giọng tổng hợp **Linh** được xuất trước bằng công cụ `say` cục bộ trên macOS, không phải bản thu người thật. Ứng dụng phát file trực tiếp, không gọi TTS hay dịch vụ mạng để tạo giọng lúc sử dụng.

Các file được chuẩn hóa bằng FFmpeg (loudness -20 LUFS, true peak -3 dB), MP3 mono 22.05 kHz, 64 kbps. Tổng dung lượng khoảng 720 KiB. `manifest.json` lưu transcript, checksum transcript/audio, thời lượng và RMS tín hiệu; `tests/voiceAssets.test.ts` đối chiếu catalog và file để phát hiện file thiếu, đổi nội dung mà chưa tái tạo hoặc file không đúng checksum. Script sinh file giải mã kiểm tra tín hiệu không im lặng, nhưng độ rõ/phát âm và sự phù hợp với trẻ vẫn cần người nghe đánh giá.

Tái tạo trên macOS có giọng Linh và FFmpeg:

```sh
npm run voice:generate
```

Lệnh đọc trực tiếp text từ catalog và content game. Không cần macOS, `say` hoặc FFmpeg để build/chạy ứng dụng vì các file đầu ra đã có trong repository. Khi thay đổi transcript, tăng phiên bản tên file trong content rồi tái tạo để cache IndexedDB không giữ bản cũ.

Có thể thay thế bằng bản thu người thật hoặc giọng tổng hợp khác:

1. Chuẩn bị và duyệt nội dung tiếng Việt đúng transcript, giọng phù hợp trẻ em, mức âm lượng nhất quán.
2. Đặt file thật trong `public/audio/guidance/` và thêm `audioSrc` vào entry tương ứng trong `voiceMessages.ts`. Đường dẫn phải tính đến base path nếu triển khai ở thư mục con.
3. Với trò chơi, thêm `guidanceAudioSrc` vào content của game; transcript phải gồm cả tên trò chơi và hướng dẫn vì `activityVoiceMessage()` ghép hai phần này.
4. Build và kiểm tra service worker đã precache file; `vite.config.ts` bao gồm mp3/ogg/wav/m4a trong glob tài nguyên tĩnh. Giữ từng file dưới giới hạn precache mặc định 2 MiB hoặc chủ động cấu hình/kèm bước tải phù hợp; không coi file chưa lưu là offline sẵn sàng.
5. Nghe thử, xác nhận transcript, tốc độ và âm lượng, thử mất mạng, mất file, đổi route và dừng lúc đang tải. Audio từ URL ngoài gói build chỉ có sẵn offline nếu đã lưu thành công bằng repository audio.

Adapter bản thu dùng lại `offlineAudioSource` và kho `audioAssets`, khóa `voice:<message.id>`, kiểm tra cả URL nguồn để không lấy nhầm bản cache cũ. Sửa bản thu nên đổi tên file/URL để invalidation rõ ràng. Cài đặt vẫn dùng khóa preferences cũ; snapshot chưa có volume/TTS được bổ sung mặc định.

## Kiểm thử

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run test:e2e
npm run test:e2e:audio
```

Nếu máy chưa có Chromium phù hợp, chạy `npx playwright install chromium`. Trong môi trường dùng cache tạm, đặt `PLAYWRIGHT_BROWSERS_PATH=/tmp/audioverse-playwright` cho cả lệnh cài và lệnh Playwright. Không cần đổi đường dẫn browser trong cấu hình dự án.

Unit/integration kiểm tra ưu tiên nguồn, TTS tùy chọn, ngôn ngữ/localService, hủy khi tải/đọc, callback cũ, timeout, đọc lại với cài đặt mới, mute/disable, migrate và lưu preferences. Các bài kiểm tra riêng cho TTS cố tình bỏ qua nguồn file ở boundary adapter; đây không phải bằng chứng cho bộ MP3.

`e2e/voice-guidance.spec.ts` phát chính các MP3 tiếng Việt đã đóng gói trong bản build production, tắt hoàn toàn SpeechSynthesis và kiểm tra media đã giải mã với thời gian phát tăng. Kiểm tra lời chào, hướng dẫn hoạt động, kết quả, dừng/đọc lại, hủy khi điều hướng và file trợ giúp chưa nghe lần nào vẫn phát offline sau reload. Bộ này không dùng tone thay cho giọng nói.

`e2e/voice-recording.spec.ts` dùng HTMLAudioElement thật với PCM WAV tạo riêng trong test: phát/dừng/đọc lại, giữ tốc độ/âm lượng, chạy không có SpeechSynthesis/Web Audio, phát Blob từ IndexedDB khi offline sau reload, 404 và retry, axe. Âm tổng hợp này chỉ xác nhận đường phát media; không phải bản thu tiếng Việt và không được đưa vào production.

## Kết quả xác minh ngày 21/11/2026

Lệnh bàn giao: `PLAYWRIGHT_BROWSERS_PATH=/tmp/audioverse-playwright npm run check`, exit code 0.

| Kiểm tra                            | Kết quả                                                |
| ----------------------------------- | ------------------------------------------------------ |
| TypeScript strict, ESLint, Prettier | Đạt                                                    |
| Vitest + React Testing Library      | 124/124 test, 23 file đạt                              |
| Vite build + PWA                    | Đạt                                                    |
| Playwright giao diện production     | 129/129 đạt                                            |
| Playwright HTML media và offline    | 18/18 đạt, trong đó 9 trường hợp cho bản thu hướng dẫn |
| axe-core                            | Không phát hiện vi phạm trong các kịch bản đã quét     |

Playwright chạy Chromium desktop, Pixel 7 giả lập và tablet cảm ứng 768×1024 giả lập; có kiểm tra chữ 200% tại 320px. Đây không phải kiểm thử thiết bị thật, độ rõ giọng Việt hoặc nghiệm thu toàn bộ WCAG. Đã sửa lỗi tốc độ HTMLAudioElement bị reset khi gán nguồn và tràn ngang phần chọn nguồn đọc khi chữ 200%.

## Danh sách file trong thay đổi

### File mới

- `docs/voice-guidance.md`
- `e2e/fixtures/voice.html`
- `e2e/fixtures/voiceHarness.tsx`
- `e2e/voice-guidance.spec.ts`
- `e2e/voice-recording.spec.ts`
- `public/audio/guidance/am-cao-am-tram.v1.mp3`
- `public/audio/guidance/app-help.v1.mp3`
- `public/audio/guidance/audio-error.v1.mp3`
- `public/audio/guidance/manifest.json`
- `public/audio/guidance/result-completed.v1.mp3`
- `public/audio/guidance/result-correct.v1.mp3`
- `public/audio/guidance/result-incorrect.v1.mp3`
- `public/audio/guidance/settings.v1.mp3`
- `public/audio/guidance/welcome.v1.mp3`
- `scripts/generate-voice-guidance.mjs`
- `src/content/voiceMessages.ts`
- `src/engines/audio/VoiceGuidanceService.ts`
- `src/engines/audio/voiceAdapters.test.ts`
- `src/engines/audio/voiceAdapters.ts`
- `src/engines/audio/voiceTypes.ts`
- `src/hooks/useVoiceGuidance.ts`
- `tests/voiceAssets.test.ts`

### File chỉnh sửa

- `README.md`
- `docs/accessibility.md`
- `e2e/accessibility.spec.ts`
- `package.json`
- `playwright.audio.config.ts`
- `playwright.config.ts`
- `src/accessibility/GuidanceStatus.tsx`
- `src/accessibility/LiveAnnouncer.tsx`
- `src/accessibility/VoiceGuidanceButton.tsx`
- `src/accessibility/voiceGuidance.integration.test.tsx`
- `src/components/templates/AppLayout.tsx`
- `src/content/accessibility.ts`
- `src/content/games.ts`
- `src/engines/audio/VoiceGuidance.test.ts`
- `src/engines/audio/VoiceGuidance.ts`
- `src/engines/audio/index.ts`
- `src/features/games/ToneGame.tsx`
- `src/features/help/KeyboardHelpPage.tsx`
- `src/features/home/HomePage.tsx`
- `src/features/settings/VoiceSettings.tsx`
- `src/stores/preferencesStore.test.ts`
- `src/stores/preferencesStore.ts`
- `src/styles/components.css`
- `src/types/preferences.ts`
- `tsconfig.node.json`
- `vite.config.ts`
- `vitest.config.ts`

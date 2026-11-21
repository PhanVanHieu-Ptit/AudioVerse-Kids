# Accessibility Foundation — AudioVerse Kids

Ngày kiểm tra: 21/11/2026. Phạm vi: giao diện hiện có và trò chơi Âm cao hay âm trầm. Đây là nền tảng đã kiểm thử tự động; chưa phải chứng nhận WCAG hoặc nghiệm thu trải nghiệm với trẻ em và trình đọc màn hình thực tế.

Phần hướng dẫn giọng nói đã được mở rộng với service, catalog, bản thu và TTS tùy chọn, đọc lại, âm lượng, trạng thái và kiểm thử riêng. Xem [kiến trúc và kết quả cập nhật](voice-guidance.md). Các số liệu trong bảng nền tảng bên dưới là kết quả lịch sử trước lần mở rộng này.

## Checklist triển khai và bằng chứng

Dấu `[x]` xác nhận triển khai và kiểm thử tự động tương ứng, không xác nhận kiểm thử người dùng thực tế.

- [x] HTML native: link cho điều hướng; button cho hành động; checkbox/select, fieldset/legend, details/summary; không dùng `role="application"`.
- [x] Tab/Shift+Tab theo DOM, Enter/Space theo hành vi trình duyệt; không tabindex dương, không phím tắt toàn cục, không bắt phím ký tự hoặc phím mũi tên ngoài điều khiển native.
- [x] Skip link hiển thị khi focus và đưa focus vào main; có landmark, heading, tên trang tiếng Việt và aria-current cho điều hướng hiện hành.
- [x] Điều hướng trang đưa focus tới h1 và để trình duyệt cuộn tiêu đề vào vùng nhìn; tải chậm có trạng thái loading. Không giành focus khỏi dialog đang mở. Thay đổi cài đặt hoặc chọn sai đáp án không chuyển focus.
- [x] Dialog native `showModal()` làm nền inert; có tên/mô tả; Tab vòng trong hộp thoại, Escape và nút Đóng; khôi phục focus tới phần tử mở nếu còn tồn tại.
- [x] Vùng thông báo polite tồn tại trước khi cập nhật; thông báo mới thay thông báo đang chờ; lặp lại cùng đáp án sai vẫn cập nhật live region. Dọn timer khi rời hoạt động.
- [x] FormField nối label, hint, lỗi bằng ID duy nhất; aria-invalid chỉ khi lỗi; lỗi có chữ “Lỗi”, không chỉ màu. Kiểm thử native input required, lỗi và focus; cài đặt dùng select/checkbox native.
- [x] Game dùng nút có tên và nhóm đáp án có legend; không giới hạn thời gian, không kéo thả, không yêu cầu micrô; âm tổng hợp thật, có nghe lại/dừng và mô tả chữ.
- [x] Focus game tới câu mới sau bắt đầu/trả lời đúng và tới kết quả khi hoàn thành. Chọn sai giữ focus tại đáp án.
- [x] Tương phản cao, giao diện sáng/tối và forced-colors dùng token chung. Trạng thái switch có vị trí nút gạt; đáp án và lỗi có chữ; không chỉ dùng màu.
- [x] Giảm chuyển động theo lựa chọn ứng dụng hoặc `prefers-reduced-motion`; không ghi đè yêu cầu giảm chuyển động của hệ điều hành.
- [x] Chữ lớn 125% lưu trong IndexedDB; dùng rem và tôn trọng cỡ chữ mặc định trình duyệt; kiểm tra cỡ chữ 200% ở viewport 320px trên trợ giúp, cài đặt, game và Design System, không tràn ngang. Các switch tự xuống dòng để không ép mô tả thành từng chữ. Thông báo PWA nằm trong luồng trang, không che điều khiển đang focus.
- [x] Trang `/help`: bàn phím, cảm ứng, trình đọc màn hình, skip link, game và cài đặt. Truy cập được khi offline sau lần precache thành công.
- [x] Hướng dẫn giọng nói mặc định tắt; bật không tự phát; chỉ đọc sau khi bấm Nghe hướng dẫn; có Dừng hướng dẫn và tốc độ chậm/vừa/nhanh.
- [x] Mỗi lần đọc hủy lần cũ, không xếp hàng. Bắt đầu âm nội dung sẽ dừng hướng dẫn; nghe hướng dẫn sẽ dừng âm nội dung. Bắt đầu/trả lời game, mở dialog, đổi trang, ẩn trang hoặc tắt tính năng sẽ dừng hướng dẫn.
- [x] Chỉ dùng giọng Việt `localService` từ Speech Synthesis; không tự chọn giọng trực tuyến. Thiếu API/giọng hoặc đọc lỗi có thông báo và hướng dẫn chữ; có thể thử lại khi giọng thiết bị sẵn sàng.
- [x] Cài đặt giọng đọc lưu cùng preferences hiện có; snapshot cũ được bổ sung mặc định an toàn. Lỗi IndexedDB giữ ứng dụng hoạt động trong phiên và thông báo không lưu được.

## Kết quả kiểm thử nền tảng ban đầu

| Kiểm tra                       | Kết quả                                            | Giới hạn                                                                                               |
| ------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| TypeScript strict              | Đạt                                                | Gồm ứng dụng và E2E                                                                                    |
| ESLint                         | Đạt                                                | Gồm jsx-a11y và React Hooks                                                                            |
| Prettier                       | Đạt                                                | Toàn repo                                                                                              |
| Vitest + React Testing Library | 55/55 đạt                                          | Giọng đọc thành công dùng test double, không xác nhận âm thanh nghe được                               |
| Vite build + PWA               | Đạt                                                | Service worker precache route và module cục bộ                                                         |
| Playwright                     | 123/123 đạt                                        | Chromium desktop, Pixel 7 giả lập, tablet 768×1024 giả lập                                             |
| axe-core                       | Không phát hiện vi phạm trong các lần quét đã chạy | WCAG 2 A/AA, 2.1 A/AA, 2.2 AA theo kịch bản; không chứng minh tuân thủ toàn bộ WCAG                    |
| Keyboard-only                  | Luồng tự động đạt                                  | Help → skip → settings; game → mô tả → đáp án → dialog → Escape; chưa có người dùng kiểm tra trực tiếp |
| Offline                        | Đạt trong Chromium                                 | Sau precache; TTS thực tế offline còn cần giọng cục bộ và thử trên thiết bị                            |

Các lần chạy đầu chưa mở được preview do sandbox, sau đó thiếu Chromium trong cache mặc định. Chạy thành công bằng Chromium đúng phiên bản trong `/private/tmp/audioverse-playwright`; không đổi cấu hình Playwright của repo để phụ thuộc đường dẫn máy cá nhân.

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Nếu dùng cache tạm như phiên này, đặt `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/audioverse-playwright` cho cả lệnh install và test:e2e. Báo cáo HTML: `playwright-report/index.html`; các báo cáo là dữ liệu sinh tự động, không commit.

## Kiểm thử thực tế còn bắt buộc trước nghiệm thu

| Môi trường                                                                   | Trạng thái                                                                       |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Windows + NVDA + Firefox/Chrome                                              | **Chưa kiểm thử thực tế**                                                        |
| macOS + VoiceOver + Safari                                                   | **Chưa kiểm thử thực tế**                                                        |
| iPhone/iPad + VoiceOver + Safari                                             | **Chưa kiểm thử thực tế**                                                        |
| Android + TalkBack + Chrome                                                  | **Chưa có thiết bị phù hợp để kiểm thử**                                         |
| Bàn phím vật lý, công tắc hỗ trợ, bàn phím Bluetooth trên mobile             | **Chưa kiểm thử thực tế**                                                        |
| Giọng Việt cục bộ, độ rõ/tốc độ, nghe tai nghe và offline trên thiết bị thật | **Chưa kiểm thử thực tế**                                                        |
| Browser zoom 200%/400%, tăng cỡ chữ hệ điều hành, Windows High Contrast thật | **Chưa kiểm thử thực tế**; tự động mới kiểm tra font 200% và media forced-colors |
| Trẻ em thuộc các độ tuổi/mức thị lực khác nhau, người hỗ trợ                 | **Chưa kiểm thử người dùng**                                                     |

Không thể phát hiện đáng tin cậy việc trình đọc màn hình đang bật. Để tránh hai giọng đọc cùng lúc, giữ hướng dẫn giọng nói của ứng dụng ở trạng thái tắt khi dùng screen reader. Việc live region được đọc đầy đủ, đúng thứ tự, không lặp hoặc bỏ sót vẫn phải nghe kiểm tra thực tế.

Kịch bản dùng cho từng môi trường trên:

- [ ] Ghi hệ điều hành, thiết bị, trình duyệt, phiên bản screen reader, giọng đọc, ngày và người kiểm tra.
- [ ] Mở ứng dụng, xác nhận ngôn ngữ tiếng Việt, tên trang và vị trí focus; khám phá landmarks và headings bằng lệnh screen reader.
- [ ] Dùng skip link, mở Help/Cài đặt/Game; quay lại/tiến tới bằng lịch sử; không mất vị trí hoặc focus vào nền của dialog.
- [ ] Đổi theme/chữ lớn/contrast/motion bằng bàn phím hoặc cử chỉ; nghe tên và trạng thái lựa chọn; focus giữ tại điều khiển vừa dùng.
- [ ] FormField: kiểm tra label, hint, required, lỗi mới xuất hiện và lỗi hết; chữ “Lỗi” được đọc đúng, không chỉ đổi màu.
- [ ] Game: nghe nốt hoặc mở mô tả; chọn sai hai lần liên tiếp và nghe phản hồi đủ hai lần; trả lời đúng, tiếp tục đến hoàn thành; không bị thúc ép thời gian.
- [ ] Mở dialog rời game: nghe tên/mô tả; Tab/Shift+Tab hoặc vuốt không vào nền; Escape/Đóng trả focus đúng; thử lưu khi dung lượng lưu trữ bị chặn.
- [ ] Bật hướng dẫn khi screen reader tắt; nghe/dừng/đổi tốc độ, đọc yêu cầu khác liên tiếp; mở dialog/đổi trang/ẩn app khi đang đọc. Không phát chồng và không tiếp tục giọng cũ.
- [ ] Thử khi không có giọng Việt hoặc API đọc không hỗ trợ: đọc fallback, thử lại, dùng hướng dẫn chữ và hoàn thành game qua mô tả.
- [ ] Tắt mạng sau lần tải đầu: Help, Cài đặt, game và tiến độ vẫn dùng được; thử giọng Việt offline thật.
- [ ] Kiểm tra zoom/cỡ chữ, focus không bị che, mục tiêu chạm, contrast và reduced motion trên thiết bị thật.

Mỗi lỗi cần ghi bước tái hiện, kết quả mong đợi/thực tế, mức ảnh hưởng và điều kiện thiết bị. Không đánh dấu nghiệm thu trước khi xử lý lỗi cản trở luồng chính.

## File và hợp đồng dùng chung

| Nhóm file tạo/chỉnh sửa                                                                                                                                        | Trách nhiệm                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/accessibility/announcements.ts`, `LiveAnnouncer.tsx`                                                                                                      | `announce(message)` cho phản hồi hoạt động; `clearAnnouncement()` khi rời hoạt động. Nội dung hiển thị bằng chữ không cần thêm live region thứ hai cho cùng phản hồi. |
| `src/accessibility/VoiceGuidanceButton.tsx`, `GuidanceStatus.tsx`                                                                                              | Nút đọc/dừng theo cài đặt, thông báo lỗi và vòng đời dừng giọng. Gắn trong AppLayout để tồn tại qua route.                                                            |
| `src/engines/audio/VoiceGuidance.ts`, `audioFocus.ts`                                                                                                          | Speech engine tách khỏi React; `registerAudioStop()` để các player đăng ký dừng. Player HTMLAudioElement trong tương lai cần đăng ký tương tự Web Audio hiện có.      |
| `src/hooks/useTonePreview.ts`                                                                                                                                  | Phối hợp quyền phát âm thanh, dừng khi ẩn trang và chống trạng thái phát muộn sau khi đã dừng.                                                                        |
| `src/components/molecules/FormField.tsx`, `src/design-system/index.ts`                                                                                         | Field native có tên/mô tả/lỗi; children nhận props gắn vào input/select/textarea. Caller quản lý validation và luồng submit, không thêm ARIA role cho native control. |
| `src/content/accessibility.ts`, `src/content/settings.ts`                                                                                                      | Nội dung trợ giúp, phản hồi game, hướng dẫn và lựa chọn hiển thị tách khỏi engine.                                                                                    |
| `src/features/help/KeyboardHelpPage.tsx`, `src/app/routes.tsx`                                                                                                 | Route `/help` lazy, precache cùng app shell.                                                                                                                          |
| `src/features/settings/SettingsPage.tsx`, `VoiceSettings.tsx`                                                                                                  | Hiển thị native forms và cài đặt hướng dẫn.                                                                                                                           |
| `src/types/preferences.ts`, `src/stores/preferencesStore.ts`                                                                                                   | `voiceGuidance` và `guidanceRate`; parse dữ liệu chưa tin cậy, mặc định off/1, giữ khóa IndexedDB cũ.                                                                 |
| `src/components/templates/AppLayout.tsx`, `src/components/molecules/PageHeader.tsx`, `src/app/RouteLoadingState.tsx`, `src/components/organisms/AppDialog.tsx` | Tích hợp shell, điều hướng trợ giúp và focus/dialog/audio.                                                                                                            |
| `src/features/games/ToneGame.tsx`                                                                                                                              | Phản hồi repeated answer và hướng dẫn game; dừng lời hướng dẫn khi chuyển bước do người dùng.                                                                         |
| `src/styles/components.css`, `src/styles/global.css`                                                                                                           | sr-only, field, lỗi, trợ giúp và responsive; tiếp tục dùng token contrast/motion/largeText sẵn có.                                                                    |
| `src/accessibility/*.test.tsx`, `src/engines/audio/VoiceGuidance.test.ts`, `src/hooks/useTonePreview.test.tsx`, `src/components/molecules/FormField.test.tsx`  | Kiểm thử mới cho announcement, voice, audio race và form.                                                                                                             |
| `src/stores/preferencesStore.test.ts`, `src/lib/storage/preferencesRepository.test.ts`                                                                         | Kiểm thử migration và round-trip preferences mở rộng.                                                                                                                 |
| `e2e/accessibility.spec.ts`, `e2e/app.spec.ts`, `e2e/navigation.spec.ts`                                                                                       | Keyboard-only, axe, offline, scale, voice fallback và cập nhật truy vấn loading khi có live region dùng chung.                                                        |
| `README.md`, `docs/accessibility.md`                                                                                                                           | Điểm vào tài liệu, checklist, bằng chứng và các kiểm thử thực tế còn thiếu.                                                                                           |

Với tính năng mới: bắt đầu từ native HTML và DOM theo thứ tự đọc, thêm nội dung tiếng Việt vào content data, chỉ di chuyển focus khi người dùng đổi ngữ cảnh; không thêm handler phím toàn cục. Test double chỉ nằm trong test; ứng dụng không giả vờ có file âm thanh hoặc giọng đọc.

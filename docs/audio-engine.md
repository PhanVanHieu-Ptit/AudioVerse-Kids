# Audio Engine — AudioVerse Kids

## Phân lớp và vòng đời

`AudioPlayer → useAudioPlayer → AudioManager/AudioEngine → AudioChannel → HTMLAudioElement + AudioMixer`. Engine ghi snapshot vào vanilla Zustand store; React chỉ subscribe. `offlineAudioSource → audioRepository → IndexedDB` giải quyết nguồn tải cục bộ trước URL. Nội dung tiếng Việt của player nằm trong `src/content/audioPlayer.ts`; metadata và transcript được caller cung cấp qua `AudioResource`.

Story Engine, Game Engine và Learning Engine phải dùng **cùng `audioManager`**, tránh tạo engine riêng cho mỗi component. Trong cùng instance luôn chỉ có một narration; mỗi kênh music/effects có một media element, request mới thay thế request cũ. Kênh effects hiện không hỗ trợ nhiều hiệu ứng chồng lên nhau. Quy tắc này áp dụng trong một ứng dụng/tab; chưa có khóa phát giữa nhiều tab.

`AppProviders` gọi `audioManager.attach()`: đăng ký audio focus có sẵn, pause khi trang ẩn/pagehide, dừng và đóng context khi consumer cuối unmount. Attach/cleanup có reference count, tương thích React StrictMode; context mới chỉ mở khi có lệnh phát tiếp theo. Giọng hướng dẫn và tone preview có thể dừng player qua audio focus; bắt đầu player sẽ dừng giọng hướng dẫn/tone preview. Không tự phát lại khi trở về tab.

Import, constructor, render và mount không tạo AudioContext, media, tải file hay phát âm thanh. Chỉ lệnh bắt đầu playback mới thử mở/resume một AudioContext dùng chung. `AudioPlayer` unmount chỉ unsubscribe; nó không sở hữu playback dùng chung. Khi rời một hoạt động cần dừng, feature gọi `audioManager.stop()` hoặc `stopAll()`. Instance độc lập do caller tạo cần `await dispose()` lúc kết thúc; `dispose()` là kết thúc vĩnh viễn và idempotent. Singleton của ứng dụng dùng attach/detach qua provider để có thể remount trong StrictMode.

## API dùng chung

```ts
import {
  audioManager,
  audioRepository,
  type AudioResource,
} from '@/engines/audio';

// Metadata do content catalogue đã biên tập cung cấp, không dựng URL file giả.
function startLesson(narration: AudioResource, music: AudioResource) {
  // Gọi từ onClick/onKeyDown của thao tác người dùng.
  void audioManager.play(music, 'music', { loop: true });
  void audioManager.play(narration);
}

function enqueueChapters(chapters: readonly AudioResource[]) {
  audioManager.enqueue(chapters); // Chưa tự phát.
  return audioManager.playQueue(); // Gọi khi người dùng chọn bắt đầu.
}

function prompt(hint: AudioResource) {
  return audioManager.interrupt(hint);
}

async function saveForOffline(resource: AudioResource, signal: AbortSignal) {
  await audioRepository.download(resource, signal);
  // Chỉ báo tải thành công sau khi promise hoàn tất.
}
```

| API                                                          | Quy tắc                                                                                                                                                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `play(resource, channel = 'narration', { loop?, startAt? })` | Thay nguồn hiện tại của kênh; narration mới xóa queue và interruption cũ. `startAt` tính bằng giây.                                                                                                                                  |
| `pause(channel?)` / `resume(channel?)`                       | Giữ vị trí. Pause khi đang tải hủy tải; resume sẽ giải quyết lại nguồn. Resume sau lỗi tải/giải mã thử lại nguồn và giữ queue/interruption.                                                                                          |
| `stop(channel?)` / `stopAll()`                               | Hủy request đang chờ, dừng và giải phóng media/URL/graph. Narration stop xóa queue/interruption, vị trí về 0.                                                                                                                        |
| `replay(channel?)`                                           | Phát lại nguồn của kênh từ đầu, giữ queue/interruption.                                                                                                                                                                              |
| `seek(seconds, channel?)`                                    | Giới hạn trong `[0, duration]`; bỏ qua giá trị không hữu hạn.                                                                                                                                                                        |
| `setVolume(value, channel?)`                                 | Giới hạn `[0, 1]`, giá trị người dùng tách khỏi effectiveVolume khi ducking.                                                                                                                                                         |
| `setPlaybackRate(rate, channel?)`                            | Giới hạn `[0.5, 2]`; độc lập theo kênh.                                                                                                                                                                                              |
| `setDucking(factor)`                                         | Hệ số nhân âm lượng music trong `[0, 1]`; mặc định `0.25`; chọn `1` để không giảm.                                                                                                                                                   |
| `enqueue(resources)` / `clearQueue()` / `playQueue()`        | Queue chỉ dành cho narration. Chuyển tiếp khi có `ended`; lỗi/blocked chờ người dùng retry. `playQueue` lấy mục đầu và thay narration hiện tại.                                                                                      |
| `interrupt(resource)`                                        | Lưu narration gốc/vị trí, giữ queue, thay bằng lời nhắc. Lời nhắc mới thay lời nhắc cũ và vẫn giữ bản gốc. Kết thúc lời nhắc sẽ khôi phục bản gốc; nếu gốc đã pause thì giữ pause. Stop hoặc play narration trực tiếp hủy khôi phục. |
| `store.getState()` / `store.subscribe(listener)`             | Snapshot từng kênh: resource, status, currentTime, duration, volume, effectiveVolume, playbackRate, error; cộng queue và interrupted.                                                                                                |
| `dispose()`                                                  | Hủy mọi request, gỡ media listeners, pause/xóa src/load lại media, revoke blob URLs, disconnect nodes và đóng context.                                                                                                               |

Các lệnh phát trả `Promise<boolean>`: `true` khi media bắt đầu phát, `false` khi bị thay thế, hủy, lỗi, blocked hoặc instance đã dispose. Đây không phải promise chờ nghe xong. Quan sát `status === 'ended'` hoặc subscribe store cho tiến trình; không sửa store từ business logic.

Không gọi `play()` để retry một narration lỗi đang có queue/interruption vì lệnh này chủ động bắt đầu nội dung mới. Dùng `resume()` hoặc `replay()` để giữ ngữ cảnh. Player đã dùng quy tắc này.

## Concurrency, autoplay và fallback

Mỗi channel có revision và AbortController. Nguồn, metadata hoặc promise `play()` của request cũ không thể cập nhật trạng thái của request mới. Dừng/pause trong lúc tải hủy request chờ. Callback của media cũ được gỡ khi thay nguồn; chúng không được chuyển queue hoặc khôi phục narration cũ. Loading có timeout mặc định 30 giây, cấu hình qua `AudioEngineOptions.loadTimeoutMs`.

`NotAllowedError` đưa kênh sang `blocked`; nút “Nghe tiếp” gọi resume từ thao tác người dùng, không có vòng lặp tự retry. Queue và khôi phục sau interruption được phép tiếp tục trong phiên nghe, nhưng vẫn có thể bị browser chặn và chuyển sang blocked. Không phát tự động lúc mount/route/reload. Không dùng micro hay bắt buộc nhận diện giọng nói.

Không có Web Audio hoặc constructor/resume context thất bại: phát bằng HTMLAudioElement và điều chỉnh volume trực tiếp. Nếu context đã nối media rồi không thể resume, engine tạo lại media cho HTML fallback vì MediaElementAudioSource không thể chuyển ngược về đầu ra HTML của cùng element. Không đổi volume hệ thống; một số trình duyệt di động giới hạn volume HTML khi thiếu Web Audio. Tệp từ domain khác cần CORS phù hợp; khuyến nghị file cùng origin hoặc blob tải qua repository. Định dạng/codec vẫn cần được thiết bị hỗ trợ.

Ducking chỉ áp dụng khi narration thực sự ở trạng thái playing; pause, ended, lỗi hoặc stop sẽ trả music về volume đã chọn. Narration đang tải không làm giảm nhạc. Hiệu ứng không ngắt narration và không làm duck music.

## Offline và quyền riêng tư

Database `audioverse-kids` nâng từ v2 lên v3, thêm store `audioAssets`, giữ nguyên `preferences` và `activityProgress`. Lưu `{ src, blob }` theo resource ID; thay URL cùng ID sẽ không dùng bản tải cũ. Blob URL được tạo cho thời gian sử dụng và revoke khi thay nguồn/stop/dispose. `download` từ chối HTTP lỗi, file rỗng, lỗi quota/lưu trữ và cancellation; không báo “đã tải” khi lưu thất bại. `remove(id)` xóa bản tải khi không còn cần.

Chỉ tải khi có lệnh rõ ràng; phát bình thường không tự ghi file vào IndexedDB. Storage bị chặn vẫn cho thử nguồn URL/bundled; khi offline mà chưa tải thì hiển thị lỗi, giữ transcript. Không có telemetry, tài khoản, ghi âm, nội dung cá nhân hoặc service TTS online. PWA hiện có giữ shell offline; repository giữ media offline. Trình duyệt có thể thu hồi dung lượng, nên không cam kết lưu vĩnh viễn. Hiện chưa có giao diện quản lý tải/xóa hay giới hạn dung lượng tự động; API có sẵn cho feature triển khai.

## UI và accessibility

```tsx
import { AudioPlayer } from '@/design-system';

// Không resource: theo dõi narration của manager dùng chung, hoặc hiển thị trống.
<AudioPlayer />;

// Có resource: điều khiển một nội dung đã chọn; không tự phát khi prop thay đổi.
<AudioPlayer resource={reviewedResource} />;
```

`AudioPlayer` dùng `AudioControlBar → useAudioControls → useAudioPlayer` cho các lệnh; player giữ phần seek và thông tin queue. Không tạo engine/store phát lại trong component. Các feature có thể dùng bar độc lập:

```tsx
import { AudioControlBar } from '@/design-system';

<AudioControlBar
  playlist={approvedResources}
  instructions={activityInstructions}
  onBack={() => navigate('/stories')}
  onExit={() => navigate('/')}
/>;
```

`AudioControlBarProps` và `AudioControlsOptions` nhận `resource`, `playlist`, `channel` (mặc định narration), `engine` (mặc định singleton), `instructions` (mặc định bản hướng dẫn ứng dụng có MP3 thật), `onBack`, `onExit`. Hook cũng dùng độc lập cho UI của feature.

- Không có playlist: `resource` cố định nếu được truyền; nếu không, theo dõi resource hiện tại của channel. Có playlist: theo entry đang chọn trong engine nếu entry thuộc danh sách; nếu không, dùng resource thuộc playlist hoặc entry đầu. Đối chiếu cả ID và URL. Danh sách do feature cung cấp, không tạo nội dung giả.
- Trước/tiếp theo phát entry liền kề sau thao tác rõ ràng, không vòng lại hoặc tự phát lúc mount/thay props. Playlist của bar là danh sách điều hướng; queue của engine vẫn có API riêng. Retry dùng resume để giữ queue. Chuyển nội dung mới chủ động thay queue như API play hiện có.
- Thiếu nội dung liền kề hoặc callback điều hướng: nút tương ứng bị vô hiệu hóa kèm giải thích bằng chữ. Feature chịu trách nhiệm chọn URL, lưu tiến độ và tích hợp navigation guard. Bar dừng mọi kênh, queue, âm báo và hướng dẫn trước khi gọi callback; không gọi history.back hay tự đoán route.
- Nghe hướng dẫn tuân theo cài đặt giọng nói có sẵn; mặc định tắt. Nút luôn hiện và giải thích cách bật khi chưa khả dụng. Khi bật, có thể hủy tải/dừng hướng dẫn. Lỗi/mất giọng có thông báo và hướng dẫn bằng chữ. Dùng bộ điều phối audio focus hiện có: singleton có thể bị dừng/reset vị trí khi mở hướng dẫn hoặc hộp thoại; không tự phát tiếp khi đóng. Không thay đổi chính sách audio focus của ứng dụng.
- Phím tắt mặc định tắt, chỉ có hiệu lực tại các nút của bar sau khi bật: P phát/tạm dừng, R nghe lại, [ trước, ] tiếp, H hướng dẫn, ? trợ giúp. Không có listener toàn cục, role application, chiếm Enter/Space/Tab/mũi tên hay lệnh điều hướng phá hủy. Bỏ qua modifier Ctrl/Alt/Meta, key repeat, IME, ô nhập, slider, select, vùng editable và portal hộp thoại. Danh sách phím và handler dùng chung `src/content/audioControls.ts`.
- Điều khiển tuần tự luôn có sẵn: Tab/Shift+Tab và Enter/Space. Trên màn hình cảm ứng dùng nút native, không cần hover, kéo thả, micrô hoặc gesture riêng. Vùng nút tối thiểu 56px ở cỡ chữ mặc định; viền focus 3px, responsive một/hai/ba cột, theo theme và high contrast hiện có.
- Âm báo thao tác là tùy chọn tắt mặc định, dùng `TonePreview` tổng hợp nốt ngắn/nhẹ 160ms, không tải file. Gain theo âm lượng channel; volume 0 giữ im lặng. Âm báo xác nhận nhận lệnh, không thay cho trạng thái phát thành công. Tắt/ngắt/rời hoạt động giải phóng âm báo; lỗi Web Audio có fallback chữ. Lựa chọn phím tắt/âm báo chỉ tồn tại trong phiên mount của bar, không thêm dữ liệu cá nhân hay schema lưu trữ.

Nút native có nhãn chữ; slider seek/volume có label và aria-valuetext; select tốc độ có label. Loading dùng aria-busy và giữ focus tại nút chính; nút Dừng vẫn hủy được tải. Status live chỉ đọc thay đổi trạng thái/lỗi và tên nội dung khi chuyển playlist, không thông báo thời gian mỗi nhịp. Transcript luôn truy cập được bằng details. `KeyboardHelpDialog` tái sử dụng `AppDialog` native: modal, focus trap, Escape, trả focus về trigger và khóa cuộn nền. Không tự đọc giọng nói khi mở trợ giúp.

## Kiểm thử và giới hạn xác nhận

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run test:e2e
npm run test:e2e:audio
```

Bộ audio E2E dùng Vite tại `127.0.0.1:4174`, entry chỉ nằm trong `e2e/fixtures`, không vào production bundle. Tệp PCM WAV 6 giây được tạo bởi test, không có asset giả trong catalog ứng dụng. Bộ E2E ứng dụng vẫn chạy production/PWA tại cổng 4173. Cả hai dùng ba cấu hình Chromium: desktop, điện thoại, tablet. Nếu browser nằm trong cache tạm của phiên này, thêm `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/audioverse-playwright` trước lệnh Playwright; không phụ thuộc đường dẫn này trong cấu hình repo.

Unit tests xác nhận concurrency, queue, interruption, pause/stop trong lúc tải, autoplay rejection, source/metadata timeout, media errors, ducking, blob URL cleanup, gain graph/context cleanup, fallback, StrictMode attach/cleanup và migration giữ dữ liệu v2. Test doubles chỉ đặt tại ranh giới trình duyệt vì jsdom không giải mã/phát media. E2E dùng HTMLAudioElement thật để kiểm tra transport/seek/rate, accessibility axe-core, fallback thiếu Web Audio và blob persist qua reload rồi phát khi offline.

Chưa có bản thu nội dung được biên tập để đưa vào thư viện; player trong Design System hiển thị trống. Kiểm thử Chromium không thay thế xác minh chất lượng nghe, screen reader thực tế, Safari/iOS, Firefox, Bluetooth hoặc interruption bởi cuộc gọi trên thiết bị thật.

Kết quả local ngày 21/11/2026: `npm run check` kết thúc với exit code 0; typecheck, ESLint, Prettier và build/PWA đạt; **91 unit/integration tests**, **123 E2E production/PWA** và **9 E2E audio** đạt. Các lượt quét axe-core trong hai bộ E2E không phát hiện vi phạm trong phạm vi kiểm thử. Chưa chạy GitHub CI trong phiên này.

## File bàn giao

| Nhóm                       | File tạo hoặc chỉnh sửa                                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audio engine và public API | `src/engines/audio/AudioEngine.ts`, `AudioManager.ts`, `AudioChannel.ts`, `AudioMixer.ts`, `types.ts`, `index.ts`                                                                                               |
| Store và React adapter     | `src/stores/audioStore.ts`, `src/hooks/useAudioPlayer.ts`, `src/app/AppProviders.tsx`                                                                                                                           |
| Player và Design System    | `src/components/organisms/AudioPlayer.tsx`, `AudioPlayer.css`, `src/content/audioPlayer.ts`, `src/design-system/index.ts`, `src/features/design-system/CardsShowcase.tsx`                                       |
| Offline storage            | `src/lib/storage/audioRepository.ts`, `database.ts`                                                                                                                                                             |
| Unit/integration tests     | `src/engines/audio/AudioEngine.test.ts`, `AudioManager.test.ts`, `AudioMixer.test.ts`, `src/components/organisms/AudioPlayer.test.tsx`, `src/lib/storage/audioRepository.test.ts`, `src/test/audioTestUtils.ts` |
| Browser tests và cấu hình  | `e2e/audio-engine.spec.ts`, `e2e/fixtures/audio.html`, `audioHarness.tsx`, `playwright.audio.config.ts`, `playwright.config.ts`, `tsconfig.node.json`, `package.json`                                           |
| Tài liệu                   | `README.md`, `docs/audio-engine.md`                                                                                                                                                                             |

### Bổ sung bộ điều khiển thống nhất

| Nhóm                     | File tạo hoặc chỉnh sửa trong nhiệm vụ bộ điều khiển                                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hook và logic điều khiển | `src/hooks/useAudioControls.ts`, `src/hooks/useAudioControls.test.tsx`                                                                                                                                         |
| Giao diện                | `src/components/organisms/AudioControlBar.tsx`, `AudioControlBar.css`, `AudioControlBar.test.tsx`, `KeyboardHelpDialog.tsx`; `src/components/molecules/AudioControlSettings.tsx`                               |
| Tích hợp player          | `src/components/organisms/AudioPlayer.tsx`, `AudioPlayer.css`, `AudioPlayer.test.tsx`; `src/design-system/index.ts`                                                                                            |
| Nội dung và trợ giúp     | `src/content/audioControls.ts`, `src/content/accessibility.ts`, `src/features/help/KeyboardHelpPage.tsx`                                                                                                       |
| Browser tests            | `e2e/audio-controls.spec.ts`, `e2e/audio-engine.spec.ts`, `e2e/fixtures/audioRoute.ts`, `e2e/fixtures/controls.html`, `e2e/fixtures/controlsHarness.tsx`, `playwright.config.ts`, `playwright.audio.config.ts` |
| Tài liệu                 | `README.md`, `docs/audio-engine.md`, `docs/accessibility.md`                                                                                                                                                   |

Kết quả bổ sung ngày 21/11/2026: `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/audioverse-playwright npm run check` đạt, exit code 0. Typecheck strict, ESLint, Prettier, build/PWA, **145 unit/integration tests**, **129 E2E production/PWA** và **30 E2E audio** đều đạt. Trong đó bộ điều khiển bổ sung 21 unit/integration tests và 12 lượt E2E trên ba cấu hình desktop/mobile/tablet. Các lượt axe-core không phát hiện vi phạm trong phạm vi kiểm thử. Reflow kiểm tra cả tràn ngang và từ tiếng Việt bị bẻ đôi trong nút tại 320px/chữ 200%; ảnh đã được xem lại. Chưa kiểm thử thủ công VoiceOver/NVDA, Safari/iOS hoặc nghiệm thu với trẻ em trên thiết bị thật.

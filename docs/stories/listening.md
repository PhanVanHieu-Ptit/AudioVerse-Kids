# Nghe truyện tiếng Việt

Kho 21 truyện có **301 MP3 thật**: 133 cảnh, 56 câu hỏi và 112 phản hồi. Người kể chính dùng giọng nam **Thanh Bình**, tạo trước bằng VieNeu-TTS cục bộ; lời nhân vật được phân vai bằng các preset Anh Khôi, Xuân Vĩnh hoặc cấu hình riêng cho truyện. Không gọi TTS qua mạng, không dùng micrô và không cần giọng Việt trong trình duyệt. Dung lượng tải được tính từ các tệp thực trong manifest; tổng thời lượng bao gồm mọi nhánh và các đoạn câu hỏi được nghe lại riêng, không phải thời lượng một lượt nghe truyện.

Bộ giọng mới đang dùng khoảng **64,1 MiB**, tổng thời lượng khoảng **93 phút** trên mọi nhánh và các bản câu hỏi nghe riêng. Đã chạy lại công cụ tạo giọng bằng cache, đối chiếu manifest và checksum không thay đổi; không phải tổng hợp lại khi đầu vào giữ nguyên.

## Luồng sử dụng

Mở Thư viện truyện, chọn **Nghe hoặc đọc**, rồi bấm **Phát** ở cảnh hiện tại. Có tạm dừng/nghe tiếp, nghe lại, dừng, tua, âm lượng và tốc độ đọc. Cảnh không tự phát khi vừa mở hoặc đổi nhánh; khi nghe hết, người dùng chọn phần tiếp theo. Đọc chữ và câu hỏi luôn dùng được dù không phát âm thanh.

Bản mở đầu gồm tên truyện, giới thiệu, ghi nguồn nếu là bản kể lại, nhân vật và cảnh đầu. Mỗi bản cảnh chỉ chứa nội dung của cảnh đó, thông điệp khi tới kết thúc, câu hỏi tùy chọn và nhãn lựa chọn. Không đọc nối các kết thúc khác nhau. Lời thoại vẫn đọc tên người nói để không phụ thuộc khả năng nhận diện chất giọng. Giọng nhân vật nhất quán trong mọi cảnh; khoảng nghỉ phân biệt lượt nói và chuyển cảnh. Không hạ pitch hoặc thêm các âm cảm xúc chưa được nghe duyệt.

Câu hỏi có nút **Nghe câu hỏi**. Khi chọn đáp án, âm đang phát được tạm dừng và phản hồi xuất hiện bằng chữ; không tự phát một giọng mới đè lên screen reader. Bấm **Nghe phản hồi** để nghe đúng lựa chọn đó. Các đoạn này dùng interruption của audio manager; có thể dừng bằng nút của đoạn đọc. Đổi cảnh hoặc rời truyện dừng/cancel audio thuộc cảnh cũ, kể cả request chưa tải xong. Ẩn tab/pagehide tạm dừng theo chính sách của audio manager; không tự phát lại khi quay lại tab.

## Nghe ngoại tuyến

PWA precache giao diện và bản chữ, **không precache toàn bộ MP3 truyện**. Trong trang truyện có nút **Tải truyện để nghe ngoại tuyến**, kèm dung lượng cụ thể. Tác vụ tải mọi cảnh, câu hỏi và phản hồi của riêng truyện đó để người dùng được đổi nhánh khi mất mạng.

Lớp tải kiểm tra số byte và SHA-256 trước khi ghi từng Blob vào IndexedDB. Chỉ khi lưu đủ mới báo sẵn sàng. Hủy hoặc lỗi giữ các tệp đã hoàn tất để lần sau tiếp tục; không báo đã tải đủ nếu bị lỗi mạng, quota hoặc quyền lưu trữ. Có thể dùng **Kiểm tra bản lưu** để kiểm tra/tải bù. Trình duyệt có thể thu hồi dung lượng, nên bản lưu không phải cam kết vĩnh viễn.

Playback đọc IndexedDB trước URL nguồn. Khi chưa tải mà đã offline, player báo lỗi và giữ bản chữ; khi lưu trữ bị chặn nhưng còn mạng, vẫn thử phát từ URL. Retry là thao tác rõ ràng của người dùng, không vòng lặp tự phát.

Khi đổi giọng, URL chứa hash mới. Bản lưu có cùng ID nhưng URL cũ không được dùng để phát hoặc tính là đã tải đủ. Sau khi cập nhật ứng dụng, người đã tải giọng Linh cần tải lại truyện để nghe giọng mới ngoại tuyến; tải mới thay bản cũ của cùng ID, giữ cài đặt và tiến độ khác.

Các MP3 `.v1.mp3` được giữ trên máy chủ để phiên bản PWA cũ chưa cập nhật vẫn phát được. Playback manifest mới chỉ trỏ tới 301 tệp `.v2.mp3`; bản mới không tải giọng cũ. Các phiên bản MP3 đều nằm ngoài precache PWA.

## Manifest và tái tạo

[Manifest playback](../../public/audio/stories/manifest.json) chỉ ghi file thực với `status: ready`, ID, loại cảnh/câu hỏi/phản hồi, tên file, bytes, thời lượng, RMS/peak, checksum audio/transcript/phân vai và các `cueIds` được bao phủ. `listeningReview: pending` phân biệt việc đã có tệp hợp lệ với việc đã được người biên tập nghe duyệt. [Danh mục nhẹ](../../src/content/stories/audio-availability.json) giúp thư viện hiển thị khả năng nghe mà không tải toàn bộ metadata playback. Metadata đầy đủ chỉ nằm trong chunk của trang truyện.

[Kế hoạch cue](../../src/content/stories/audio-manifest.json) giữ 872 đoạn lời và 133 hiệu ứng dự kiến. Toàn bộ 872 đoạn lời đã được bao phủ trong các bản cảnh/câu hỏi/phản hồi ghép; các tên `targetFile` cho clip riêng vẫn là kế hoạch và không được đưa vào player. Trạng thái bộ cue là `speech-recordings-available`; hiệu ứng vẫn chưa sản xuất. Không dùng bản thu thử cũ để giả làm những truyện này.

Tái tạo khi đã chuẩn bị Python, VieNeu-TTS, FFmpeg và đúng cache mô hình theo [hướng dẫn sản xuất](../../scripts/local-tts/README.md):

```sh
npm run stories:audio:generate
npm run content:build
npm run content:validate
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run test:e2e
npm run test:e2e:audio
```

`src/lib/stories/performance.ts` lập kế hoạch từng lượt nói từ chính các cue của bản cảnh/câu hỏi/phản hồi, không đổi lời hoặc chọn nhánh. [Profile sản xuất](../../scripts/local-tts/library-profile.json) chứa người kể, phân vai, tempo, khoảng nghỉ và revision mô hình. `scripts/local-tts/render-library.py` tạo tệp tại `.cache/local-tts/library-render`, có cache lời nói theo hash để tái dùng câu hỏi và thông điệp trùng. Có thể chạy lại sau khi gián đoạn. Cache WAV và MP3 được đối chiếu checksum trước khi tái dùng.

`scripts/generate-story-audio.ts` chỉ thay playback manifest sau khi kiểm tra đủ tất cả bản đọc. Tên file `.v2.mp3` chứa hash của transcript, toàn bộ lượt nói và profile; thay giọng/tốc độ/nghỉ/mô hình sẽ đổi URL. Không chỉnh MP3 bằng tay mà giữ nguyên URL. Xem kế hoạch trước khi tạo bằng `npm run stories:audio:generate -- --plan-only`.

Đầu ra mono 24 kHz, MP3 96 kbps từ nguồn 48 kHz, FFmpeg loudnorm mục tiêu -20 LUFS/true peak -3 dB. Script giải mã mọi file vừa tạo, đo thời lượng/tín hiệu, chặn file rỗng, thời lượng bất thường hoặc peak quá cao trước khi xuất manifest cuối. Giới hạn thời lượng chỉ phát hiện một số lỗi thô, không xác nhận phát âm hay lời thực tế chính xác. Build ứng dụng chỉ đọc file đã có, không cần Python, mô hình hoặc FFmpeg.

## Phân lớp

| Nhóm                  | File chính                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Lời đọc từ nội dung   | `src/lib/stories/recordings.ts`, `src/lib/stories/performance.ts`                                                                 |
| Sản xuất file         | `scripts/generate-story-audio.ts`, `scripts/local-tts/render-library.py`, `scripts/local-tts/library-profile.json`                |
| Metadata playback     | `src/content/storyAudio.ts`, `public/audio/stories/manifest.json`                                                                 |
| Phát và vòng đời cảnh | `StorySceneView.tsx`, `StoryClipButton.tsx`, audio manager/player dùng chung                                                      |
| Download UI và logic  | `StoryDownload.tsx`, `useStoryDownload.ts`, `offlineStory.ts`                                                                     |
| Lưu và integrity      | `audioRepository.download(resource, signal, { bytes, sha256 })`                                                                   |
| Kiểm tra              | `tests/storyPerformance.test.ts`, `tests/storyRecordings.test.ts`, `tests/storyAudioIntegrity.test.ts`, `e2e/story-audio.spec.ts` |

Không tạo engine riêng theo component và không đưa luật chọn nhánh vào audio engine. Player lồng trong cảnh dùng heading h3/h4 để giữ cấu trúc tiêu đề dưới h2 của cảnh.

## Giới hạn kiểm chứng

### Thử giọng nam kể chuyện

Hai bản trích đoạn khoảng 45 giây với người kể **Thanh Bình** và **Anh Khôi** vẫn được giữ ở [trang nghe thử](../../artifacts/voice-previews/nam-ke-chuyen/index.html), có MP3 và transcript, không tự phát. Kho truyện hiện dùng Thanh Bình theo cùng hướng giọng nam kể chuyện; bản sản xuất dùng transcript đầy đủ, gồm nguồn, lựa chọn, câu hỏi và phản hồi. Không coi việc kiểm tra tín hiệu hoặc checksum là xác nhận chất lượng diễn cảm. [Quy trình tái tạo và nguồn mô hình](../../scripts/local-tts/README.md).

Bản thử có kiểm tra transcript/nhánh/timeline/checksum bằng Vitest. `npm run stories:voice:check` kiểm tra ở 1280 px và 390 px: phát/tạm dừng bằng bàn phím với MP3 thật, không tự phát hoặc chồng tiếng, mở bản chữ, không tràn chiều ngang và axe-core. Các kiểm tra này không thay thế đánh giá nghe hoặc thử screen reader trên thiết bị thật.

Kiểm tra ngày 24/11/2026: TypeScript strict, ESLint, Prettier, kiểm tra đồng bộ nội dung và production build đạt; **297 tests Vitest**, **171 tests Playwright giao diện production** và **30 tests Playwright media/bộ điều khiển** đạt. Các ca nghe truyện dùng chính MP3 tiếng Việt đã tạo, không dùng tone thay cho giọng nói. Đã kiểm tra phát/tạm dừng/nghe tiếp, tua, tốc độ/âm lượng, kết thúc cảnh, hủy request khi đổi cảnh, audio thiếu/retry, câu hỏi/phản hồi, download/cancel/retry, cold offline, nghe cảnh chưa mở từ IndexedDB sau reload, lưu trữ bị chặn, bàn phím và axe-core. Ca đổi giọng xác nhận bản lưu có URL cũ bị bỏ qua, tải lại đúng URL mới rồi nghe từ IndexedDB khi offline sau reload. Browser là Chromium desktop, Pixel 7 giả lập và viewport tablet cảm ứng.

Hai bộ Playwright có thư mục kết quả/báo cáo riêng (`test-results`, `playwright-report`; `test-results-audio`, `playwright-audio-report`) để không xóa trace của nhau. Screenshot dùng `testInfo.outputPath`, không phụ thuộc đường dẫn tạm riêng của máy.

Kiểm tra tự động đối chiếu transcript đầu vào, phân vai, checksum, tín hiệu và playback thật. Chưa có đánh giá nghe thủ công toàn bộ 301 clip, thử với trẻ hoặc kiểm tra NVDA/VoiceOver/TalkBack và thiết bị vật lý. Giọng hiện tại là giọng tổng hợp neural; mức tự nhiên, diễn cảm và cách đọc tên riêng cần người biên tập nghe duyệt trước nghiệm thu nội dung. Hiệu ứng/nhạc nền không được giả định tồn tại và chưa trộn vào các bản đọc.

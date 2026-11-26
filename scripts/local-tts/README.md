# Sản xuất giọng kể cục bộ

## Kho truyện

`npm run stories:audio:generate` tạo lại toàn bộ các bản cảnh, câu hỏi và phản hồi của 21 truyện. Người kể chính là **Thanh Bình**; các vai dùng Anh Khôi, Xuân Vĩnh hoặc override trong [library-profile.json](library-profile.json). Cấu hình không suy đoán giới tính nhân vật hoặc độ khuyết tật từ tên. Lời thoại vẫn đọc tên người nói. Nguồn 48 kHz, đầu ra MP3 mono 24 kHz/96 kbps, loudnorm mục tiêu -20 LUFS/true peak -3 dB.

Kế hoạch do `src/lib/stories/performance.ts` lập từ chính các `cueIds` của `storyRecordingDefinitions`, bảo toàn thứ tự và transcript. Xem kế hoạch bằng `npm run stories:audio:generate -- --plan-only`. `render-library.py` chạy mô hình cục bộ rồi lưu tại `.cache/local-tts/library-render`; WAV từng lượt nói và MP3 hoàn chỉnh có checksum để tiếp tục sau khi gián đoạn. Các lượt nói trùng được tái dùng, kể cả câu hỏi nghe riêng.

CLI chỉ cập nhật `public/audio/stories/manifest.json` và `src/content/stories/audio-availability.json` sau khi đủ bản đọc và đã đối chiếu checksum. Tên MP3 có hash của lời, hướng đọc từng lượt và profile, nên đổi giọng hoặc mô hình không lấy nhầm cache cũ. Không có fallback tự động sang giọng Linh khi tạo thất bại. Manifest ghi `listeningReview: pending`; các kiểm tra máy không thay cho nghe duyệt lời và cách diễn đạt.

Sau khi tạo, chạy `npm run check` để kiểm tra nội dung, typecheck, lint, format, Vitest, build và cả hai bộ Playwright. `tests/storyPerformance.test.ts` kiểm tra toàn bộ lời/nhánh/phân vai; `tests/storyRecordings.test.ts` đối chiếu file thật với transcript/profile; `e2e/story-audio.spec.ts` kiểm tra phát và thay bản lưu có URL cũ khi đổi giọng.

## Hướng dẫn trò chơi và Khu vườn âm nhạc

`npm run voice:generate` dùng [guidance-profile.json](guidance-profile.json) và cùng `render-library.py` để tạo lời hướng dẫn bằng giọng Thanh Bình. Script tách lời thành câu, giữ tốc độ tự nhiên và nghỉ 200 ms giữa các câu. Kế hoạch/MP3 tạm ở `.cache/local-tts/guidance-render`; WAV câu dùng cache chung có checksum. Catalog giữ transcript, đường dẫn bản `.v2.mp3`, còn `public/audio/guidance/manifest.json` ghi giọng và cấu hình của từng bản mới. Chỉ cập nhật manifest sau khi đủ tài nguyên hợp lệ, rồi xóa file phiên bản cũ được thay thế.

Các file Linh cũ không đổi nội dung vẫn được giữ và kiểm tra checksum. Bản cần tạo mới dùng VieNeu; không fallback sang `say`. Sau khi tạo, chạy `npm test`, `npm run build` và `npx playwright test e2e/voice-guidance.spec.ts` để xác nhận transcript, file đóng gói và phát offline khi tắt TTS thiết bị. Độ rõ lời và độ tự nhiên vẫn cần nghe đánh giá; manifest ghi `listeningReview: pending`.

## Bản nghe thử

`npm run stories:voice:preview` tạo hai bản từ nội dung hiện hành của **Rùa và Thỏ**, đi theo nhánh `cuoc-hen → xin-loi`. Chạy tại thư mục gốc. Mở `artifacts/voice-previews/nam-ke-chuyen/index.html` để nghe bằng bộ điều khiển gốc của trình duyệt, tải MP3 hoặc đọc transcript. Không tự phát.

`npm run stories:voice:check` kiểm tra hai kích thước màn hình bằng Playwright/axe-core: phát bằng bàn phím, tạm dừng, tự dừng bản trước khi nghe bản còn lại, mở transcript, không tràn chiều ngang và không tự phát. Cần Chromium của Playwright đã cài.

- Người kể: thử **Thanh Bình** và **Anh Khôi**; Thỏ dùng **Xuân Vĩnh**, Rùa dùng giọng của người kể với tempo 0,98. Tên người nói vẫn được đọc để không phụ thuộc nhận diện giọng.
- Giữ nguyên lời trong dữ liệu truyện; thêm tên người nói cho các đoạn thoại. Không thêm tiếng cười, hiệu ứng hoặc nhạc chưa có tài nguyên.
- Khoảng nghỉ giữa các lượt nói 400–550 ms, sau tiêu đề cảnh 800 ms; giữ khoảng thở do mô hình sinh. Không hạ pitch nhân tạo.
- ONNX CPU fp32, 48 kHz, MP3 128 kbps; loudnorm mục tiêu -20 LUFS, true peak -3 dB. Chất giọng đến từ preset. Tham số `style` bị SDK bỏ qua nên không sử dụng nó để hứa hẹn cảm xúc.

## Môi trường sản xuất

Cần Python 3.12, FFmpeg/ffprobe trong PATH và môi trường `.cache/local-tts/venv` có `vieneu==3.8.5` (xem `requirements.txt`). Cache Hugging Face phải đặt ở `.cache/local-tts/huggingface`. Đây là công cụ sản xuất tài nguyên; ứng dụng React không tải mô hình hoặc chạy Python.

Hai phiên bản mô hình đã kiểm tra:

| Mô hình                                      | Revision                                   |
| -------------------------------------------- | ------------------------------------------ |
| pnnbao-ump/VieNeu-TTS-v3-Turbo               | `61b85e3d937fbbacb387714180e8182823512523` |
| OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX | `ceff0d0749bfb3fa2d61149794ec6feef0d1e1ae` |

Máy mới cần chuẩn bị môi trường và tải đúng các revision trước; script cố ý không tự cài hoặc tải từ mạng. Nó kiểm tra revision của cache, bật chế độ offline, chặn kết nối socket trong tiến trình tạo giọng và dùng preset có sẵn; không nhận giọng tham chiếu cá nhân hoặc gửi văn bản tới dịch vụ TTS. Không gọi `.env.vbee.local`.

`voices.json` chứa lựa chọn giọng, tempo và khoảng nghỉ. `preview-plan.ts` đối chiếu cảnh/nhánh/nhân vật với Story schema; `render-preview.py` dùng cache theo hash của lời, giọng và profile, rồi giải mã MP3 để kiểm tra thời lượng, RMS, peak và checksum. Seed được lưu để hỗ trợ tái tạo, không cam kết byte-identical giữa các máy hoặc phiên bản thư viện. Manifest ghi timeline các lượt nói, revision nội dung và trạng thái `generated-awaiting-listening-review`; đây **không phải** xác nhận phát âm đúng hoặc giọng truyền cảm.

Bản thử được lưu ngoài `public`, không được đưa vào playback manifest hay precache PWA. Kho truyện dùng các bản sản xuất đầy đủ từ `library-profile.json`, không dùng trích đoạn này để thay cho cảnh còn thiếu. Build ứng dụng dùng MP3 đã có và không cần môi trường TTS.

Xem [nguồn và giấy phép](NOTICE.md).

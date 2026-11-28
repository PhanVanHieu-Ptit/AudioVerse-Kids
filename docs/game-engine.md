# Game Engine và tám trò chơi

Tám trò chơi mới xuất hiện tại `/games`. Mỗi trò có 24 thử thách, chia thành ba cấp độ với tám thử thách mỗi cấp. Hoạt động âm cao–trầm cũ vẫn dùng URL riêng.

| Trò chơi               | URL                          | Cách chơi và độ khó                                             |
| ---------------------- | ---------------------------- | --------------------------------------------------------------- |
| Đoán tiếng động vật    | `/games/doan-tieng-dong-vat` | Tám bản thu thật; 2/3/4 lựa chọn, giữ nguyên tiếng kêu tự nhiên |
| Đoán nhạc cụ           | `/games/doan-nhac-cu`        | Tám âm sắc mô phỏng; 2/3/4 lựa chọn, biến đổi cao độ và độ dài  |
| Nhớ chuỗi âm thanh     | `/games/nho-chuoi-am-thanh`  | Nhập đúng thứ tự chuỗi từ 2 đến 6 nốt                           |
| Tìm cặp âm thanh       | `/games/tim-cap-am-thanh`    | Bàn có 2/3/4 cặp, vị trí xáo trộn có seed                       |
| Đố vui kiến thức       | `/games/do-vui-kien-thuc`    | 24 câu hỏi, từ cuộc sống đến khoa học và suy luận               |
| Toán học bằng âm thanh | `/games/toan-hoc-am-thanh`   | 24 bài toán có giọng đọc: đếm, cộng/trừ, nhân/chia, nhiều bước  |
| Phiêu lưu giải đố      | `/games/phieu-luu-giai-do`   | Ba chương có tám chặng liên tiếp, phản hồi nối tiếp câu chuyện  |
| Ghi nhớ nhịp điệu      | `/games/ghi-nho-nhip-dieu`   | Tái hiện khoảng nghỉ, hoặc chọn Ngắn/Dài/Rất dài                |

## Cấu trúc

- `src/types/game.ts`: hợp đồng dữ liệu, âm thanh, phiên chơi và snapshot.
- `src/content/activityGames.ts`: danh mục trò chơi, hướng dẫn, cấp độ và builder thử thách.
- `src/content/gameQuestions.ts`: câu hỏi, lựa chọn và giải thích do tác giả soạn.
- `src/content/gameSounds.ts`: đường dẫn bản thu động vật, thông số âm tổng hợp và mô tả bằng chữ.
- `src/engines/game/GameEngine.ts`: luật thuần, không phụ thuộc React hoặc âm thanh.
- `src/engines/audio/GameAudio.ts`: phát và cache bản thu cục bộ, xếp lịch các âm tổng hợp trên đồng hồ Web Audio.
- `src/features/games/ActivityGame.tsx`: giới thiệu, chọn cấp độ, lưu/khôi phục, kết quả, chơi lại.
- `src/features/games/ChallengeControls.tsx`: điều khiển theo loại thử thách.

`transitionGame(session, challenges, action)` nhận một phiên và trả phiên tiếp theo; thao tác không hợp lệ trả lại cùng phiên. Action gồm `answer`, `append`, `undo`, `clear`, `submit`, `card`, `hide`, `rhythm` và `next`.

Trả lời sai giữ nguyên thử thách và tăng số lần thử sai. Trả lời đúng chuyển sang `feedback`; cần bấm tiếp để sang thử thách sau hoặc kết quả. Thao tác trả lời lặp lại khi ở `feedback` không cộng thêm điểm. Kết quả ghi số thử thách hoàn thành, số đúng ngay lần đầu và số lần thử chưa đúng. Trò ghép cặp chỉ tính hoàn thành khi tìm đủ cả bàn; không cho chọn một thẻ hai lần hoặc mở thẻ thứ ba trước khi úp cặp sai.

## Tiến độ

Snapshot `ActivityProgress.game` có `version: 1`, cấp độ đang chọn và phiên riêng cho từng cấp. Snapshot đi qua hàng đợi ghi và cơ chế thử lại của `activityStore`/`activityRepository` hiện có. Không cần nâng schema IndexedDB vì store chứa object.

Mỗi lần trả lời, nhập nốt, mở/ghép/úp thẻ hoặc đổi cấp độ đều tạo checkpoint. Khôi phục kiểm tra phiên theo ngân hàng thử thách hiện tại, bỏ cấp độ có dữ liệu lỗi và giữ cấp độ còn hợp lệ. `position` là tổng số thử thách đã giải của ba cấp; `completed` chỉ đúng khi cả ba cấp đã đến màn hình kết quả. Chơi lại xóa phiên của cấp độ hiện tại, giữ hai cấp còn lại.

Thời điểm gõ nhịp chỉ tồn tại trong giao diện vì đồng hồ `performance.now()` không dùng lại được sau reload. Tạm dừng/tiếp tục bắt đầu lại phần gõ dở, giữ thử thách, điểm và số lần thử sai. Phần nhập khoảng nghỉ bằng nút vẫn có checkpoint như chuỗi nốt.

## Âm thanh và accessibility

Không tự phát âm thanh hoặc dùng micrô. Động vật dùng tám **bản thu thật** cục bộ trong `public/audio/animals/`, giữ nguyên cao độ và tốc độ ở cả ba cấp độ. Độ khó tăng bằng số lựa chọn. Nhạc cụ dùng âm tổng hợp **mô phỏng**. Chuỗi nốt và mẫu nhịp được tạo trên thiết bị. Các nguồn phát đăng ký `audioFocus` để dừng khi giọng đọc hoặc nguồn khác phát, khi ẩn trang và khi tháo component. Lệnh phát đang chờ không được hồi sinh sau khi bị hủy.

Các bản thu động vật có giấy phép CC0/public domain; tác giả, URL nguồn, hash và thông số xử lý nằm trong `public/audio/animals/sources.json`. Các MP3 được đưa vào PWA precache. Dùng `python3 scripts/prepare-animal-audio.py --download` để tải lại nguồn có kiểm tra SHA-256 và tái tạo bằng FFmpeg (chuẩn hóa hai lượt −18 LUFS, đỉnh −2 dBTP, mono 44,1 kHz, 128 kbps; cắt khoảng lặng, lọc dưới 60 Hz và fade mép ngắn). Tiếng mèo/chó được lặp hai lần. Trình phát không giảm bản thu xuống mức gain 0,045 của âm tổng hợp; phát lại dùng buffer đã giải mã và dừng sẽ hủy tải đang chờ.

Hướng dẫn tám trò chơi, 72 câu hỏi có lời đọc và ba phản hồi chung có MP3 tiếng Việt cục bộ trong `public/audio/guidance/`, được đưa vào PWA precache. Chạy `npm run voice:generate` trên macOS có giọng Linh và FFmpeg để tái tạo. Script giữ lại file có transcript và SHA-256 không đổi; manifest lưu transcript, hash, thời lượng và năng lượng RMS. `tests/voiceAssets.test.ts` kiểm tra sự tồn tại và tính toàn vẹn của từng file. Runtime không phụ thuộc dịch vụ TTS từ xa.

Nút bật hướng dẫn tôn trọng tùy chọn của người dùng; bật xong bấm Nghe hướng dẫn/Nghe câu hỏi/Nghe phản hồi để phát. Chữ luôn có sẵn khi không phát được âm thanh. Thẻ úp không tiết lộ danh tính âm thanh; nút Bật mô tả chỉ hiển thị mô tả thẻ đã mở. Các nút dùng Tab, Shift+Tab, Enter, Space; không có phím tắt toàn cục. Tiêu đề nhận focus khi bắt đầu, đổi thử thách và xem kết quả; phản hồi được thông báo qua live region chung. Nhịp điệu so sánh tỷ lệ khoảng nghỉ, cho phép gõ chậm hơn mẫu, với dung sai 35%/25%/18%. Chế độ chọn khoảng nghỉ cho phép hoàn thành mà không cần thao tác theo thời gian.

## Kiểm thử

```sh
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
npx playwright test e2e/games.spec.ts
```

Unit test kiểm tra toàn bộ 192 thử thách có thể giải được, chấm điểm, thứ tự nốt, cặp sai, thao tác lặp, nhịp và snapshot lỗi. Integration test đi hết ba cấp độ của cả tám trò, xem kết quả và chơi lại; thêm luồng IndexedDB, bàn phím, audio lỗi và thử lưu lại. Playwright chạy trên desktop, điện thoại và tablet, kiểm tra file giọng đọc thật, Web Audio, axe, 320px với chữ 200%, điều hướng có lưu tiến độ và tiếp tục sau reload.

# Kho truyện AudioVerse Kids

Kho nội dung gồm **21 truyện tiếng Việt, 7 truyện mỗi cấp, 133 cảnh, 42 kết thúc và 70 đường đi từ mở đầu tới kết thúc**. Bộ ban đầu giữ nguyên 15 truyện gốc (5 truyện mỗi cấp). Bộ bổ sung có 6 truyện dân gian/kinh điển kể lại bằng lời mới (2 truyện mỗi cấp), ghi rõ xuất xứ và điều chỉnh. Không gắn nhãn nguyên bản cho truyện chuyển thể.

Dữ liệu gốc: [stories.json](../../src/content/stories/stories.json). Hợp đồng: [Story TypeScript](../../src/types/story.ts) và [JSON Schema draft-07](../../src/content/stories/story.schema.json). Cả 21 truyện đã có bản đọc tổng hợp tiếng Việt và giao diện nghe/đọc theo cảnh; xem [hướng dẫn nghe và tải ngoại tuyến](listening.md).

## Chọn cấp độ

Các cấp phân biệt độ phức tạp ngôn ngữ và suy luận, không xếp hạng trẻ hoặc mức thị lực. Tuổi là gợi ý, không khóa nội dung. Trẻ có thể chọn bất kỳ cấp nào, nghe/đọc lại và nhờ người lớn đọc cùng.

| Cấp | Tên      | Tuổi gợi ý    | Đặc điểm                                                                                    |
| --- | -------- | ------------- | ------------------------------------------------------------------------------------------- |
| 1   | Làm quen | 4–6           | Câu ngắn, sự việc gần gũi, một điểm quyết định với hai lựa chọn.                            |
| 2   | Khám phá | 7–9           | Nguyên nhân và kết quả; hai điểm lựa chọn; nhánh có thể gặp lại nhau.                       |
| 3   | Suy luận | 10–12 trở lên | Bằng chứng, giới hạn, quyền lựa chọn và nhu cầu nhiều người; hai quyết định qua nhiều cảnh. |

Thông tin có cấu trúc: [levels.json](../../src/content/stories/levels.json).

Phân loại nội dung: [collections.json](../../src/content/stories/collections.json). Mọi truyện đang dùng thuộc đúng một bộ sưu tập. Truyện chờ rà soát quyền chỉ nằm trong `deferred`, không có dữ liệu lời kể hoặc tài nguyên phát.

## Danh mục và transcript

Mỗi liên kết mở transcript đầy đủ: giới thiệu, nhân vật, lời kể/đối thoại, hiệu ứng đề xuất, liên kết tới cảnh được chọn, câu hỏi, phản hồi, kết thúc và thông điệp. Transcript chứa **mọi nhánh**, không phải thứ tự đọc tự động tất cả các cảnh. Bắt đầu ở cảnh mở đầu và đi theo lựa chọn; chỉ đọc kết thúc đã tới.

| Cấp | Truyện và transcript                                                                      | Chủ đề                              |
| --- | ----------------------------------------------------------------------------------------- | ----------------------------------- |
| 1   | [Chiếc ghế trong vòng bạn](transcripts/chiec-ghe-trong-vong-ban.md)                       | Tình bạn, kỹ năng sống              |
| 1   | [Hạt mưa xin nghỉ](transcripts/hat-mua-xin-nghi.md)                                       | Thiên nhiên, kỹ năng sống           |
| 1   | [Sóc Bông và hộp hạt](transcripts/soc-bong-va-hop-hat.md)                                 | Động vật, tình bạn                  |
| 1   | [Chuyến tàu gõ nhịp](transcripts/chuyen-tau-go-nhip.md)                                   | Tưởng tượng, khám phá               |
| 1   | [Lời nhắn trong túi vải](transcripts/loi-nhan-trong-tui-vai.md)                           | Kỹ năng sống, tình bạn              |
| 2   | [Bản đồ mùi hương](transcripts/ban-do-mui-huong.md)                                       | Thiên nhiên, khám phá, tình bạn     |
| 2   | [Nhóm bạn sửa tiếng lạch cạch](transcripts/nhom-ban-sua-tieng-lach-cach.md)               | Khoa học, tình bạn, kỹ năng sống    |
| 2   | [Buổi họp dưới gốc me](transcripts/buoi-hop-duoi-goc-me.md)                               | Động vật, kỹ năng sống, tình bạn    |
| 2   | [Câu lạc bộ bong bóng không xà phòng](transcripts/cau-lac-bo-bong-bong-khong-xa-phong.md) | Khoa học, khám phá                  |
| 2   | [Xưởng may âm thanh](transcripts/xuong-may-am-thanh.md)                                   | Tưởng tượng, tình bạn, kỹ năng sống |
| 3   | [Trạm dự báo sân trường](transcripts/tram-du-bao-san-truong.md)                           | Khoa học, thiên nhiên, kỹ năng sống |
| 3   | [Thư viện tiếng động không tên](transcripts/thu-vien-tieng-dong-khong-ten.md)             | Khám phá, kỹ năng sống, khoa học    |
| 3   | [Hội đồng bên dòng suối](transcripts/hoi-dong-ben-dong-suoi.md)                           | Động vật, thiên nhiên, tình bạn     |
| 3   | [Bưu cục hành tinh Nghỉ](transcripts/buu-cuc-hanh-tinh-nghi.md)                           | Tưởng tượng, khám phá, tình bạn     |
| 3   | [Bảo tàng những điều chưa xong](transcripts/bao-tang-nhung-dieu-chua-xong.md)             | Tưởng tượng, khám phá, kỹ năng sống |

Sáu bản kể lại bổ sung:

| Cấp | Truyện và transcript                                      | Nguồn cốt truyện                           |
| --- | --------------------------------------------------------- | ------------------------------------------ |
| 1   | [Ba chú heo con](transcripts/ba-chu-heo-con.md)           | Truyện dân gian Anh; Joseph Jacobs sưu tầm |
| 1   | [Rùa và Thỏ](transcripts/rua-va-tho.md)                   | Truyền thống ngụ ngôn Aesop                |
| 2   | [Cô bé quàng khăn đỏ](transcripts/co-be-quang-khan-do.md) | Truyện cổ do anh em Grimm sưu tầm          |
| 2   | [Sư tử và Chuột](transcripts/su-tu-va-chuot.md)           | Truyền thống ngụ ngôn Aesop                |
| 3   | [Trạng Quỳnh – Mầm đá](transcripts/trang-quynh-mam-da.md) | Truyện cười dân gian Việt Nam              |
| 3   | [Cậu bé chăn cừu](transcripts/cau-be-chan-cuu.md)         | Truyền thống ngụ ngôn Aesop                |

## Nguồn và quyền sử dụng

Xem [hồ sơ nguồn và quyết định chọn truyện](rights.md). Quyền đối với cốt truyện cổ không đồng nghĩa quyền sao chép bản dịch, truyện tranh, minh họa, phim, nhạc hoặc bản thu hiện đại. Các bản kể mới sử dụng cốt truyện đã rà soát, không lấy câu chữ từ những bản chuyển thể đó.

Trường `source` bổ sung tùy chọn vào Story v1 để giữ tương thích 15 truyện gốc. Với bộ kể lại, metadata này bắt buộc qua validator bộ sưu tập, gồm xuất xứ, liên kết đối chiếu, nhận định quyền có phạm vi, ngày rà soát và những điều chỉnh. Transcript giữ đầy đủ metadata; manifest/thu âm có cue `source-credit` đọc lời ghi nguồn. Phần đối chiếu pháp lý và ghi chú biên tập không tự đưa vào lời thoại cho trẻ.

**Hoàng tử bé chưa được thêm vào kho truyện.** Nguồn SNE nêu tác phẩm tại Pháp còn được bảo hộ đến hết năm 2032. Chưa xác định phạm vi phát hành/giấy phép để coi tác phẩm dùng tự do trên mọi lãnh thổ; các bản dịch và bản thu còn cần xét riêng. Mục chờ rà soát không được coi là một truyện đã sẵn sàng.

Bản kể mới công khai việc thay đổi tình tiết. Không có cảnh nuốt người, nấu nhân vật trong nước sôi hoặc bỏ mặc trẻ khi cầu cứu. Trạng Quỳnh giữ tiếng cười phê phán thói chuộng của lạ; không dùng lối nói tục hoặc định kiến. Rùa và Thỏ không dùng tốc độ để xếp giá trị con người. Các bản này không phải bản dịch nguyên văn hay văn bản dân gian duy nhất.

## Quy ước dữ liệu và tương tác

- `schemaVersion: 1`, `language: "vi"`, `level: 1 | 2 | 3`. Các chủ đề là mã ổn định; nội dung hiển thị đều bằng tiếng Việt. ID truyện/cảnh/nhân vật không dấu, không mang tên tài nguyên âm thanh có sẵn.
- `entrySceneId` là cảnh bắt đầu. Mỗi cảnh có **đúng một** trong `interaction` hoặc `ending`. Lựa chọn chứa `label` đầy đủ và `nextSceneId`; không có nhánh dựa vào thời gian, màu, vị trí, micrô hay khả năng nghe ra hiệu ứng.
- `segments` là văn bản lời kể và lời thoại để hiển thị/đọc khi chưa có audio. `speakerId: "narrator"` là người kể; mã khác tham chiếu nhân vật. Đoạn kể có thể trích lời nhân vật, vẫn được đọc bằng giọng người kể nếu không tách thành đoạn thoại riêng.
- `soundEffects` chỉ đề xuất sản xuất. `anchorSegmentId` và `placement` chỉ điểm đặt trước/sau đoạn; thời lượng chưa được giả định. Không lặp nền hoặc trộn hiệu ứng che lời. Có thể tắt mọi hiệu ứng mà vẫn hiểu câu chuyện.
- `questions` là phần tùy chọn, không chặn bước tiếp theo và không chấm điểm. `suggestedOptionId: null` là suy ngẫm, không có đáp án ưu tiên. Giá trị khác là đáp án tham khảo cho câu hỏi nội dung, kèm phản hồi cho **mọi** lựa chọn. Không tự đọc tất cả phản hồi.
- `transcript.file` là tên tài liệu tương đối trong `docs/stories/transcripts`, **không phải URL runtime**. Khi tích hợp UI, dùng `segments`, `interaction`, `questions`, `ending` để dựng nội dung chữ tương ứng; không tải đường dẫn tài liệu như tệp audio.

Các chủ đề kỳ ảo được nói rõ là tưởng tượng. Phần tìm hiểu khoa học phân biệt quan sát, dự đoán và kết luận. Những thao tác với nước, vật nhỏ, thiết bị hoặc địa điểm tham quan có người lớn phụ trách; tương tác trong app chỉ cần chọn, bỏ qua, đọc hoặc nghe. Không yêu cầu trẻ thực hiện thao tác vật lý để mở nhánh.

Không gắn thị lực với đạo đức, trí thông minh, giác quan “phi thường” hoặc vai trò cần được cứu giúp. Tình tiết dựa trên lời kể, đối thoại, âm thanh được mô tả, mùi/cảm giác được giải thích; không dùng màu, nét mặt hay hình dạng chưa được mô tả làm dữ kiện bắt buộc. Quyền từ chối, khoảng chờ và cách tham gia khác nhau xuất hiện xuyên suốt bộ truyện.

## Kế hoạch sản xuất âm thanh

[audio-manifest.json](../../src/content/stories/audio-manifest.json) là kế hoạch **872 cue giọng đọc và 133 cue hiệu ứng**, với `targetFile` dành cho clip riêng. Trạng thái bộ là `speech-recordings-available`: 872 cue lời đã được bao phủ trong **301 file MP3 thật** ở [manifest playback](../../public/audio/stories/manifest.json), gồm 133 cảnh, 56 câu hỏi và 112 phản hồi. Các cue riêng và hiệu ứng vẫn mang trạng thái kế hoạch; không dùng `targetFile` làm URL phát.

Manifest playback có tên file thực chứa hash, bytes, thời lượng và checksum đo được; app dựng `src` từ file đã có. Âm hướng dẫn và các bản thử cũ không được gán sang các truyện mới. [Schema kế hoạch](../../src/content/stories/audio-manifest.schema.json) vẫn không cho phép `src` để phân biệt kế hoạch với tài nguyên thực.

[Kịch bản thu âm/chuyển giọng đọc](recording-script.md) chứa nguyên văn từng cue, người đọc và mã đối chiếu. Script macOS dùng giọng Linh đã cài để tạo MP3 cục bộ; không gửi nội dung tới dịch vụ TTS bên ngoài. File đã có trong repo nên máy chạy/build ứng dụng không cần công cụ tổng hợp.

Khi sản xuất, chỉ đọc lời, không đọc ID hay chỉ dẫn kỹ thuật. Hiệu ứng vẫn cần sản xuất/kiểm tra nguồn và mức âm riêng; truyện đã nghe được đầy đủ khi không có hiệu ứng. Chi tiết profile, cách tái tạo và phạm vi kiểm thử nằm trong [hồ sơ nghe truyện](listening.md).

## Kiểm tra và cập nhật

```sh
npm run content:build
npm run content:validate
npm run typecheck
npm run lint
npm test
```

Sửa nội dung ở `stories.json`, cập nhật phân loại ở `collections.json`, rồi chạy `content:build`. Lệnh này sinh lại transcript, kịch bản, manifest và [báo cáo nhánh](validation-report.json) từ cùng một nguồn. Các tệp sinh ra không chỉnh sửa tay. `content:validate` chỉ đọc và báo lỗi nếu bất kỳ tài liệu nào thiếu, thừa hoặc khác dữ liệu hiện tại. Lệnh đã được thêm vào `npm run check`; không còn giới hạn cứng kho truyện ở 15 mục.

`contentRevision` là SHA-256 của dữ liệu truyện đã parse, dùng phát hiện tài liệu cũ, không phải checksum của audio. Báo cáo còn giữ `collectionsRevision` để phát hiện thay đổi phân loại/mục chờ rà soát. Không ghi thời gian sinh để kết quả tái tạo ổn định.

Validator Ajv kiểm tra cấu trúc theo JSON Schema; logic độc lập UI kiểm tra ID trùng, tham chiếu nhân vật/cảnh/đoạn hiệu ứng/đáp án, nhánh cụt, vòng lặp và cảnh không tới được. Mọi cảnh cuối phải có kết thúc; mỗi đường đi được liệt kê đến kết thúc. Giới hạn 100 cảnh và 10.000 lượt duyệt bảo vệ công cụ khi nạp dữ liệu khác. Báo cáo hiện có 70 đường đi hợp lệ. Tests còn cố ý làm hỏng dữ liệu để chứng minh validator phát hiện lỗi, bao gồm đồ thị có nhánh hội tụ và có quá nhiều đường đi. Validator bộ sưu tập chặn mất ghi nguồn, gắn nhãn nguyên bản cho bản kể lại, truyện thiếu/trùng phân loại và mục chờ rà soát bị đưa vào dữ liệu hoạt động. Các kiểm tra này không tự đưa ra kết luận pháp lý từ một URL.

Kiểm tra tự động xác nhận cấu trúc, độ đầy đủ, file âm thanh và playback; không đánh giá được mức hấp dẫn hay mức phù hợp thực tế với từng trẻ. Bộ truyện chưa được thử với trẻ/người chăm sóc hoặc chuyên gia nội dung; cần nghe duyệt giọng tổng hợp và kiểm tra thủ công bằng screen reader/thiết bị vật lý.

## Giao diện thư viện và đọc truyện

Nguyên nhân thư viện trước đây luôn trống: `StoriesPage` chỉ render `SectionPage` với thông báo trống cố định; `StoryPage` luôn render trạng thái không tìm thấy mà chưa tra ID trong catalog. Dữ liệu hợp lệ trong repo chưa tự tạo thành giao diện.

`/stories` hiện liệt kê cả 21 truyện, không lọc bỏ truyện thiếu audio. Có tìm tên có/không dấu, lọc cấp độ và bộ truyện; kết quả rỗng có nút bỏ bộ lọc và trả focus về ô tìm. Bộ lọc nằm trong URL để giữ qua reload.

`/stories/:storyId` hiển thị giới thiệu, nhân vật, ghi nguồn cho bản kể lại và văn bản của từng cảnh. Lựa chọn là liên kết có nhãn đầy đủ, dẫn đến `?scene=...`; câu hỏi tùy chọn có phản hồi riêng, không chặn chuyển cảnh. Khi đổi cảnh hoặc dùng Back/Forward, focus đến tiêu đề cảnh. URL giữ cảnh đang đọc khi tải lại; không ghi câu trả lời hoặc suy ra một lộ trình đã đi từ chỉ số cảnh trong IndexedDB. ID truyện/cảnh không đúng có lối quay lại phù hợp.

Nút Phát dùng audio manager và MP3 thật; không tự phát khi mở hoặc đổi cảnh. Câu hỏi/phản hồi có nút nghe riêng. Nội dung JSON được precache nên đọc chữ offline sau khi PWA tải xong; âm thanh chỉ sẵn sàng offline sau khi người dùng tải đủ riêng truyện đó vào IndexedDB. Không precache cả bộ MP3 56,8 MiB khi cài ứng dụng. Không cần gọi API nội dung bên ngoài.

## Kiểm tra nghe truyện ngày 23/11/2026

Đã có 301 MP3 thật cho cả 21 truyện và bản ghi nguồn trong audio mở đầu. Kiểm tra đạt: TypeScript strict, ESLint, Prettier, content validation, production build, **271 tests Vitest**, **168 E2E giao diện** và **30 E2E media/bộ điều khiển**. Các ca mới phát chính giọng đọc tiếng Việt khi browser TTS/Web Audio không có, kiểm tra tải/kiểm chứng/lưu IndexedDB và nghe offline sau reload, lỗi/retry/cancel, audio tải muộn, đổi cảnh và kết thúc không tự chọn nhánh. Xem [hồ sơ nghe truyện](listening.md) cho chi tiết và các giới hạn kiểm chứng.

## Kiểm tra tích hợp giao diện ngày 23/11/2026 (trước khi thêm audio)

TypeScript strict, ESLint, Prettier, kiểm tra đồng bộ nội dung và production build đạt. Toàn bộ **244 tests Vitest trong 30 tệp** và **144 tests Playwright** trong cấu hình mặc định đạt trên Chromium desktop, Pixel 7 giả lập và viewport tablet cảm ứng. Các ca mới kiểm tra đủ 21 route nội dung bằng RTL, tìm kiếm không dấu, kết hợp bộ lọc, danh sách trống, câu hỏi không chặn nhánh, focus khi chuyển cảnh, Back/Forward, reload và URL sai. E2E còn xác nhận truyện chưa mở vẫn hoạt động offline, không yêu cầu tệp audio truyện chưa có, giao diện tối/tương phản cao và bố cục 320px với chữ 200%. Axe-core không phát hiện vi phạm trong phạm vi được quét. Chưa kiểm thử thủ công bằng screen reader hoặc thiết bị vật lý.

File triển khai chính: `src/features/stories/StoriesPage.tsx`, `StoryPage.tsx`, `StoryReader.tsx`, `StorySceneView.tsx`, `StoryQuestionView.tsx`, `Stories.css`; logic lọc ở `src/lib/stories/filterStories.ts`, nhãn dùng chung ở `src/content/storyInterface.ts`. Kiểm tra hồi quy được thêm vào `src/features/stories/stories.integration.test.tsx`, `src/lib/stories/filterStories.test.ts`, `e2e/stories.spec.ts` và cập nhật `src/app/routes.test.tsx` để xác nhận có nội dung thay vì mong đợi màn hình trống.

## Kiểm tra bộ bổ sung ngày 23/11/2026

TypeScript strict, ESLint, Prettier, `content:validate` và production build đạt. Toàn bộ **214 tests Vitest trong 28 tệp** đạt, bao gồm 21 truyện, 70 đường đi, kiểm tra nguồn trong transcript/cue thu âm và các trường hợp mất xuất xứ, sai phân loại hoặc đưa mục chờ quyền vào nội dung hoạt động. Có 872 cue giọng đọc và 133 hiệu ứng chờ sản xuất. Không thay đổi UI hoặc audio engine; không chạy lại Playwright cho lần bổ sung nội dung này. Chưa thử bản kể với trẻ hoặc sản xuất audio.

## Kiểm tra lần bàn giao 15 truyện gốc ngày 23/11/2026

TypeScript strict, ESLint, Prettier, kiểm tra đồng bộ nội dung và production build đạt. Toàn bộ 196 tests Vitest đạt. Hai bộ Playwright `app.spec.ts` và `accessibility.spec.ts` đạt 69 tests trên Chromium desktop, Pixel 7 giả lập và viewport tablet cảm ứng. Axe-core không báo vi phạm trong các phạm vi được quét của giao diện hiện có. Đây là kiểm tra hồi quy ứng dụng, chưa phải kiểm tra trình phát hoặc khả năng tiếp cận của luồng truyện mới vì chưa tích hợp UI và audio.

Phạm vi lint/format đã loại `.cache` chứa thư viện TTS cục bộ; format còn loại `artifacts/voice-previews` chứa bản thu thử và metadata sinh sẵn. Mã nguồn, schema và manifest truyện mới vẫn được kiểm tra đầy đủ. Không sửa hoặc tái sử dụng nội dung trong các bản thu thử cũ.

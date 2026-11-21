# AudioVerse Kids – Thế Giới Âm Thanh

Ứng dụng tiếng Việt dành cho trẻ em khiếm thị và trẻ có các mức thị lực khác nhau. Nền tảng ưu tiên khả năng tiếp cận, bàn phím, cảm ứng và trình đọc màn hình. Không yêu cầu tài khoản; không có analytics, quảng cáo hay dịch vụ thu thập dữ liệu cá nhân.

## Cài đặt

Cần **Node.js 22.12+** và **npm 10+**. Có thể dùng `nvm use` để chọn Node 22.

```sh
npm ci
npm run dev
```

Mở URL Vite in ra terminal, thường là `http://localhost:5173`. Các file `.env.development` và `.env.production` đã có giá trị mặc định; không cần cấu hình dịch vụ ngoài.

```sh
# Tùy chỉnh giá trị public trên máy (không bắt buộc)
cp .env.example .env.local
```

`VITE_APP_NAME` là tên hiển thị trong tiêu đề trang. `VITE_APP_ENV` chỉ nhận `development` hoặc `production` và được kiểm tra khi ứng dụng khởi động. `.env.local` dùng chung cho các chế độ; nếu cần ghi đè từng chế độ, dùng `.env.development.local` hoặc `.env.production.local`. **Không đặt bí mật trong biến `VITE_*`: chúng được đưa vào mã phía trình duyệt.**

## Các lệnh

| Lệnh                    | Mục đích                                                            |
| ----------------------- | ------------------------------------------------------------------- |
| `npm run dev`           | Máy chủ phát triển, cập nhật nóng                                   |
| `npm run typecheck`     | Kiểm tra TypeScript cho ứng dụng, cấu hình và E2E                   |
| `npm run lint`          | ESLint, React Hooks, JSX accessibility, cấm `any`, kiểm tra Promise |
| `npm run format`        | Định dạng bằng Prettier                                             |
| `npm run format:check`  | Kiểm tra định dạng                                                  |
| `npm test`              | Vitest + React Testing Library                                      |
| `npm run test:watch`    | Kiểm thử liên tục                                                   |
| `npm run test:coverage` | Coverage cho store và lớp lưu trữ                                   |
| `npm run build`         | Typecheck rồi build production vào `dist/`                          |
| `npm run preview`       | Phục vụ bản build để kiểm tra tại local                             |
| `npm run test:e2e`      | Playwright trên Chromium desktop/mobile/tablet, kèm axe-core        |
| `npm run check`         | Toàn bộ kiểm tra, build và E2E                                      |

Trước khi chạy E2E lần đầu:

```sh
npx playwright install chromium
npm run build
npm run test:e2e
```

Trên Linux CI dùng `npx playwright install --with-deps chromium`. E2E tự mở preview ở `127.0.0.1:4173`; cần để cổng này trống. Báo cáo nằm trong `playwright-report/`; trace của lỗi nằm trong `test-results/`.

## Kiến trúc

```text
src/
  app/                 # AppProviders, AppRouter, routes, lỗi routing và 404
  assets/              # Tài nguyên được import qua bundler
  components/
    atoms/             # Thành phần nhỏ, ví dụ Icon
    molecules/         # PageHeading, LoadingState
    organisms/         # ErrorBoundary, thông báo PWA
    templates/         # AppLayout và bố cục trang nội dung
  features/
    home/              # Trang khám phá
    stories/           # Kho truyện
    games/             # Trò chơi
    music/             # Âm nhạc
    learning/          # Học tập
    settings/          # Cài đặt hiển thị
    teacher/           # Góc giáo viên
  engines/
    audio/             # Contract audio; triển khai player ở giai đoạn tiếp theo
    game/              # Vị trí dành cho engine trò chơi
    story/             # Vị trí dành cho engine truyện
  hooks/               # React adapters cho trạng thái dùng chung
  stores/              # Zustand; nghiệp vụ cài đặt không phụ thuộc React
  content/             # Metadata, mô tả và nội dung các lựa chọn
  lib/                 # Env, IndexedDB và repository
  styles/              # CSS thuần, tokens và responsive
  test/                # Test setup
  types/               # Kiểu dùng chung
e2e/                   # Playwright + axe-core
public/                # PWA icons và favicon cục bộ
```

Alias `@/*` trỏ đến `src/*` trong TypeScript, Vite và Vitest. TypeScript bật `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, kiểm tra biến/tham số không dùng và cấm fallthrough.

Vitest và coverage được ghim cùng phiên bản để tránh lệch peer dependency. `overrides` giới hạn riêng `workbox-build → glob` ở bản đã vá; cần kiểm tra lại build service worker khi nâng các gói này. `.env.test` cung cấp cấu hình ứng dụng cho Vitest, không bật service worker trong unit test.

Luồng phụ thuộc: **UI → hook/store → repository → IndexedDB**. Store nhận repository qua tham số để kiểm thử độc lập. Metadata nằm trong `content/`; UI không chứa quy tắc phát âm thanh hoặc logic game. Khi mở rộng, đặt component, hook, service và test riêng trong feature trước khi chuyển thành thành phần dùng chung khi có nhu cầu thực tế.

`AppProviders` khởi tạo cài đặt và áp dụng thuộc tính hiển thị lên `html`. Router lazy-load các trang; `Suspense` cung cấp trạng thái đang tải. Có ErrorBoundary cho lỗi render toàn cục, lỗi routing/chunk riêng và trang 404.

## Routing

| URL            | Trang                              |
| -------------- | ---------------------------------- |
| `/`            | Khám phá                           |
| `/truyen`      | Kho truyện                         |
| `/tro-choi`    | Trò chơi                           |
| `/am-nhac`     | Âm nhạc                            |
| `/hoc-tap`     | Học tập                            |
| `/cai-dat`     | Cài đặt                            |
| `/giao-vien`   | Góc giáo viên                      |
| Đường dẫn khác | Trang 404 và liên kết về trang chủ |

Khi deploy static, máy chủ phải rewrite URL ứng dụng (ví dụ `/truyen`) về `index.html`; các file tĩnh vẫn được phục vụ trực tiếp. Cấu hình hiện tại chạy tại root domain, chưa hỗ trợ triển khai dưới subpath. Production cần HTTPS; localhost được trình duyệt cho phép dùng service worker.

## Accessibility và quyền riêng tư

- HTML `lang="vi"`, landmarks, một `h1` mỗi trang, nhãn rõ ràng và biểu tượng trang trí ẩn với screen reader.
- Skip link, focus nhìn thấy được, `aria-current` trên điều hướng. Khi chuyển trang, cập nhật document title và focus `h1` để trình đọc màn hình nhận biết ngữ cảnh mới.
- Nút và mục tương tác cao tối thiểu 48 CSS px; hỗ trợ zoom, chữ lớn, tương phản cao, giảm chuyển động và `prefers-reduced-motion` của thiết bị.
- Không tự phát âm thanh, không yêu cầu micro và không dùng phím tắt một ký tự. Dùng `Tab`/`Shift+Tab`, `Enter`; `Space` để thay đổi switch.
- Chỉ lưu ba lựa chọn hiển thị trong IndexedDB `audioverse-kids`, store `preferences`, khóa `display-v1`. Dữ liệu được kiểm tra kiểu khi đọc. Các lượt ghi được xếp hàng để tránh lưu sai thứ tự khi thao tác nhanh.
- Nếu IndexedDB bị chặn hoặc hết dung lượng, cài đặt vẫn hoạt động trong bộ nhớ và thông báo rõ việc không lưu được. Không gửi thông tin lỗi hoặc dữ liệu cài đặt lên máy chủ.
- Xóa dữ liệu trang web trong trình duyệt để xóa cài đặt và cache. Mỗi tab đọc cài đặt khi khởi động; đồng bộ trực tiếp giữa các tab chưa được triển khai.

Các kiểm tra tự động không thay thế thử nghiệm thủ công với NVDA, VoiceOver, TalkBack và trẻ/người chăm sóc. Cần xác thực các luồng thực tế trên thiết bị và trình đọc màn hình trước khi bàn giao sản phẩm hoàn chỉnh.

## Offline và PWA

`vite-plugin-pwa` dùng `generateSW`, precache HTML, CSS, JS (bao gồm lazy chunks) và icon cục bộ. Sau khi tải thành công lần đầu và service worker cài đặt xong, các trang của vỏ ứng dụng có thể mở offline. Có thông báo khi sẵn sàng offline. Cập nhật dùng chế độ `prompt`: người dùng chọn cập nhật, tránh tự tải lại giữa hoạt động.

PWA tắt ở development để tránh cache làm nhiễu HMR. Kiểm tra offline bằng bản production:

```sh
npm run build
npm run preview
```

Mở trang online, chờ thông báo sẵn sàng, sau đó chuyển trình duyệt sang offline và tải lại. E2E cũng kiểm tra tải lại và mở route chưa truy cập khi offline. Trình duyệt có thể thu hồi cache/lưu trữ; không cam kết dữ liệu tồn tại vĩnh viễn.

## Phạm vi của bản khởi tạo

Kiểm tra tại local ngày 21/11/2026: typecheck, ESLint, Prettier và build production đạt; 10 unit/integration test và 33 E2E test đạt trên Chromium với viewport desktop, điện thoại và máy tính bảng. Các bài axe-core không phát hiện vi phạm trong phạm vi quét. Coverage cho store và lớp lưu trữ: 95% dòng. `npm audit` báo 0 lỗ hổng tại thời điểm cài đặt. CI đã được cấu hình nhưng chưa chạy trên GitHub trong phiên này.

Đã triển khai nền tảng, routing, UI responsive, cài đặt thực lưu IndexedDB và vỏ PWA. Các trang truyện, trò chơi, âm nhạc, học tập và giáo viên đang có trạng thái trống rõ ràng; không có audio giả hoặc nội dung chưa được duyệt.

Web Audio API và `HTMLAudioElement` là API có sẵn của trình duyệt, không cần npm package. Thư mục `engines/audio` hiện chỉ định nghĩa contract; **chưa triển khai audio engine**, điều khiển phát, tải nội dung offline hay nghiệp vụ game/truyện. Khi có tài nguyên thật, engine sẽ quản lý media playback qua `HTMLAudioElement` và graph/mixing qua Web Audio API, chỉ khởi tạo sau tương tác người dùng; UI truy cập engine thông qua adapter. Các yêu cầu đó cần được triển khai và kiểm thử trong nhiệm vụ riêng.

Tham khảo cấu hình: [Vite](https://vite.dev/guide/), [Vite PWA](https://vite-pwa-org.netlify.app/guide/service-worker-strategies-and-behaviors), [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing).

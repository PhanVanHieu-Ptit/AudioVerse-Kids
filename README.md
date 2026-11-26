# AudioVerse Kids – Thế Giới Âm Thanh

Bộ nội dung truyện: [21 truyện tiếng Việt gồm 15 truyện gốc và 6 bản kể lại dân gian/kinh điển](docs/stories/README.md). `/stories` có tìm kiếm/lọc và [nghe/đọc từng cảnh](docs/stories/listening.md) bằng 301 MP3, người kể chính là giọng nam tổng hợp **Thanh Bình**, có phân giọng nhân vật. Có phát/tạm dừng, nghe lại, tua, tốc độ/âm lượng và tải riêng truyện vào IndexedDB để nghe offline. Bản chữ được precache; âm thanh được tải theo lựa chọn của người dùng. Hoàng tử bé vẫn chờ rà soát quyền, không thuộc kho truyện đang hiển thị.

Kiểm tra nghe truyện ngày 24/11/2026: typecheck, lint, format, content validation và build đạt; **297 tests Vitest, 171 E2E giao diện và 30 E2E audio đạt**, gồm thay giọng trong bản tải ngoại tuyến. Chi tiết nguồn giọng, tái tạo và giới hạn kiểm chứng ở [hồ sơ bàn giao nghe truyện](docs/stories/listening.md).

Ứng dụng tiếng Việt dành cho trẻ em khiếm thị và trẻ có các mức thị lực khác nhau. Nền tảng ưu tiên khả năng tiếp cận, bàn phím, cảm ứng và trình đọc màn hình. Không yêu cầu tài khoản; không có analytics, quảng cáo hay dịch vụ thu thập dữ liệu cá nhân.

Accessibility Foundation: xem [checklist, kiến trúc và kết quả kiểm thử](docs/accessibility.md). Trang `/help` hướng dẫn bàn phím; `/settings` có hiển thị và hướng dẫn giọng nói theo yêu cầu. NVDA, VoiceOver và TalkBack **chưa được kiểm thử thực tế**.

Hướng dẫn giọng nói: xem [service, catalog, adapter, cài đặt và bộ file tiếng Việt](docs/voice-guidance.md). Đã kèm 8 file giọng tổng hợp tiếng Việt để phát trực tiếp và dùng offline sau precache; không cần giọng Việt trong trình duyệt. Có TTS cục bộ tùy chọn, đọc lại, tốc độ và âm lượng riêng. Vào Cài đặt, bật hướng dẫn rồi bấm nút nghe.

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
    atoms/             # Icon, AccessibleButton, AudioButton
    molecules/         # Cards, PageHeader, loading/empty/error states
    organisms/         # AppDialog, ErrorBoundary, thông báo PWA
    templates/         # AppLayout và bố cục trang nội dung
  features/
    home/              # Trang khám phá
    stories/           # Kho truyện
    games/             # Trò chơi
    music/             # Âm nhạc
    learning/          # Học tập
    settings/          # Cài đặt hiển thị
    teacher/           # Góc giáo viên
    design-system/     # Showcase chia theo từng nhóm component
  design-system/       # Public exports để tái sử dụng component
  engines/
    audio/             # AudioEngine, AudioManager, channels, mixer và audio focus
    game/              # Quy tắc trò chơi, không phụ thuộc UI
    story/             # Vị trí dành cho engine truyện
  hooks/               # React adapters cho trạng thái dùng chung
  stores/              # Zustand; cài đặt, tiến độ và audio, không phụ thuộc React
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

| URL                 | Trang                                                               |
| ------------------- | ------------------------------------------------------------------- |
| `/`                 | Trang chủ / Khám phá                                                |
| `/stories`          | Thư viện truyện                                                     |
| `/stories/:storyId` | Đọc truyện theo cảnh, chọn nhánh; fallback cho ID không có nội dung |
| `/games`            | Danh sách trò chơi                                                  |
| `/games/:gameId`    | Chơi trò chơi; fallback cho ID không tồn tại                        |
| `/music`            | Khu vườn âm nhạc                                                    |
| `/learning`         | Học điều hay                                                        |
| `/settings`         | Cài đặt                                                             |
| `/teacher`          | Chế độ giáo viên                                                    |
| `/design-system`    | Design System Showcase hiện có                                      |
| `*`                 | Không tìm thấy trang                                                |

Các URL cũ `/truyen`, `/tro-choi`, `/am-nhac`, `/hoc-tap`, `/cai-dat`, `/giao-vien` chuyển hướng với `replace` đến URL mới, không thêm vòng lặp vào lịch sử. Tất cả màn hình được lazy-load, giữ `AppLayout` chung. `PageHeader` cập nhật document title, focus tiêu đề và đưa trang về đầu khi đổi pathname. Query/hash không làm mất focus hay reset hoạt động. `RouteLoadingState` thông báo đang tải và đặt focus vào main khi chờ chunk; `RouteContentBoundary` giữ điều hướng khi màn hình lỗi và reset khi chuyển sang pathname khác.

### Bảo vệ tiến độ hoạt động

Có tám trò chơi dùng Game Engine chung tại `/games`, mỗi trò có 24 thử thách chia đều ba cấp độ: đoán động vật, nhạc cụ, nhớ chuỗi, ghép cặp, kiến thức, toán, phiêu lưu và nhịp điệu. Có hướng dẫn tiếng Việt cục bộ, phản hồi, kết quả, chơi lại và checkpoint theo từng cấp độ. Dữ liệu nằm riêng trong `src/content/`; luật thuần nằm trong `src/engines/game/GameEngine.ts`. Xem [hợp đồng, nội dung và kiểm thử Game Engine](docs/game-engine.md). Hoạt động `/games/am-cao-am-tram` trước đây vẫn hoạt động. Âm động vật/nhạc cụ được ghi rõ là mô phỏng tổng hợp.

`activityStore` (Zustand) lưu tiến độ qua `activityRepository` vào IndexedDB `audioverse-kids` phiên bản 3, store `activityProgress`. Migration giữ nguyên cài đặt v1. Bản ghi có loại hoạt động, ID, vị trí, trạng thái hoàn thành, thời điểm cập nhật và snapshot game tùy chọn (cấp độ, điểm, câu đang chơi, chuỗi đang nhập và thẻ đã mở/ghép); không lưu danh tính hoặc bản ghi âm. Ghi được xếp hàng, snapshot game được kiểm tra theo nội dung khi khôi phục, ghi lỗi vẫn giữ bản mới nhất trong bộ nhớ và có nút thử lại.

`ActivityNavigationGuard` đặt một lần trong layout. Sau khi bắt đầu/tiếp tục trò chơi, chuyển sang pathname khác bằng liên kết, Back hoặc Forward cần xác nhận. Đóng dialog, Escape hoặc “Ở lại hoạt động” hủy điều hướng và trả focus về điều khiển mở. “Lưu và tạm rời” chờ hàng đợi ghi; lỗi lưu chuyển sang cảnh báo rõ ràng và cần chọn “Rời đi, giữ trong phiên”. Hoạt động đã hoàn thành hoặc chưa bắt đầu không bị chặn. Quay lại hoạt động chỉ khôi phục tiến độ; không tự phát âm thanh.

Reload, đóng tab hoặc điều hướng ra ngoài dùng `beforeunload` của trình duyệt qua `useBeforeUnload`; nội dung/khả năng hiện hộp thoại do trình duyệt quyết định. Mobile có thể đóng tiến trình mà không phát sự kiện; ứng dụng ghi ngay mỗi bước thay vì chờ rời trang. Không thể bảo đảm phục hồi sau reload nếu lưu trữ bị chặn, bị thu hồi hoặc thao tác ghi chưa hoàn tất. Tiến độ độc lập theo tab, chưa đồng bộ nhiều tab. API chặn điều hướng được dùng theo [React Router useBlocker](https://api.reactrouter.com/v7/functions/react-router.useBlocker.html).

Khi deploy static, máy chủ phải rewrite URL ứng dụng (ví dụ `/stories`) về `index.html`; các file tĩnh vẫn được phục vụ trực tiếp. Cấu hình hiện tại chạy tại root domain, chưa hỗ trợ triển khai dưới subpath. Production cần HTTPS; localhost được trình duyệt cho phép dùng service worker.

## Accessibility và quyền riêng tư

- HTML `lang="vi"`, landmarks, một `h1` mỗi trang, nhãn rõ ràng và biểu tượng trang trí ẩn với screen reader.
- Skip link, focus nhìn thấy được, `aria-current` trên điều hướng. Khi chuyển trang, cập nhật document title và focus `h1` để trình đọc màn hình nhận biết ngữ cảnh mới.
- Nút và mục tương tác cao tối thiểu 48 CSS px; hỗ trợ zoom, chữ lớn, tương phản cao, giảm chuyển động và `prefers-reduced-motion` của thiết bị.
- Không tự phát âm thanh, không yêu cầu micro và không dùng phím tắt một ký tự. Dùng `Tab`/`Shift+Tab`, `Enter`; `Space` để thay đổi switch.
- Lưu theme sáng/tối và ba lựa chọn hiển thị trong IndexedDB `audioverse-kids`, store `preferences`, khóa `display-v1`. Dữ liệu được kiểm tra kiểu khi đọc. Các lượt ghi được xếp hàng để tránh lưu sai thứ tự khi thao tác nhanh.
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

Mở trang online, chờ thông báo sẵn sàng để giao diện/bản chữ dùng được offline. Với audio truyện, vào trang truyện, chọn **Tải truyện để nghe ngoại tuyến** và chờ thông báo đã lưu đủ trước khi tắt mạng. E2E kiểm tra nghe cảnh chưa mở từ IndexedDB sau reload. Trình duyệt có thể thu hồi cache/lưu trữ; không cam kết dữ liệu tồn tại vĩnh viễn.

## Phạm vi của bản khởi tạo

Kiểm tra tại local ngày 21/11/2026: typecheck, ESLint, Prettier và build production đạt; 10 unit/integration test và 33 E2E test đạt trên Chromium với viewport desktop, điện thoại và máy tính bảng. Các bài axe-core không phát hiện vi phạm trong phạm vi quét. Coverage cho store và lớp lưu trữ: 95% dòng. `npm audit` báo 0 lỗ hổng tại thời điểm cài đặt. CI đã được cấu hình nhưng chưa chạy trên GitHub trong phiên này.

Đã triển khai nền tảng, routing, UI responsive, cài đặt thực lưu IndexedDB và vỏ PWA. Thư viện có 21 truyện với bản chữ, đọc/nghe từng cảnh và chọn nhánh; audio offline cần tải riêng từng truyện. Trang trò chơi có tám game (192 thử thách) cùng hoạt động âm cao–trầm, với hướng dẫn, câu hỏi và phản hồi tiếng Việt đóng gói cục bộ. Music Playground có nhạc cụ tổng hợp, sáng tác, lưu bản nhạc cục bộ và hai trò chơi âm nhạc. Các trang học tập và giáo viên còn ở trạng thái trống. Nội dung/giọng truyện chưa được thử với trẻ hoặc nghe duyệt toàn bộ bởi chuyên gia; chưa có thư viện bản thu nhạc đã biên tập cho trẻ.

Audio engine dùng `HTMLAudioElement` cho playback, Web Audio gain graph khi khả dụng và IndexedDB cho tài nguyên tải ngoại tuyến. `AudioManager` dùng chung cho Story/Game/Learning, với ba kênh narration, nhạc nền và hiệu ứng; narration có queue, interruption và ducking nhạc nền. UI truy cập qua `useAudioPlayer` và `AudioPlayer`; player tái sử dụng bộ điều khiển thống nhất `AudioControlBar`, `useAudioControls` và `KeyboardHelpDialog`. Bộ điều khiển có phát/tạm dừng, nghe lại, volume/rate, trước/tiếp theo, hướng dẫn, callback quay lại/thoát, điều khiển tuần tự và phím tắt cục bộ/âm báo tùy chọn. Không khởi tạo media hoặc AudioContext lúc import/render; browser autoplay denial có trạng thái và nút tiếp tục rõ ràng. Xem [API, hợp đồng tích hợp và tài liệu bàn giao Audio Engine](docs/audio-engine.md#ui-và-accessibility). Truyện đã dùng player này với MP3 tổng hợp và download từng truyện; Design System vẫn có trạng thái trống để minh họa fallback.

Tham khảo cấu hình: [Vite](https://vite.dev/guide/), [Vite PWA](https://vite-pwa-org.netlify.app/guide/service-worker-strategies-and-behaviors), [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing).

## Music Playground

Mở `/music` (hoặc `/am-nhac`). Chọn đàn phím, sáo, chuông hoặc trống để nghe tiếng tổng hợp gợi nhạc cụ. Các nốt là native button: chạm, Tab + Enter/dấu cách; phím A S D F G H J K chỉ có hiệu lực khi bật tùy chọn và tiêu điểm nằm trên một nút nốt nhạc. Escape và nút Dừng âm thanh hủy cả lượt phát đang chờ. Không tự phát âm thanh khi tải trang, lấy tiêu điểm hay đổi nhạc cụ.

Khi bật thêm nốt, mỗi lần chơi thêm một bước vào bản đang soạn. Có thể sửa nốt, nhạc cụ, độ dài, thứ tự, thêm khoảng nghỉ và đổi tốc độ. Lưu tối đa 30 bản, mỗi bản tối đa 64 bước, trong `localStorage` với khóa `audioverse.music.v1`. Lưu thất bại giữ nguyên bản đang soạn; dữ liệu đọc không hợp lệ không bị tự ghi đè. Xóa dữ liệu trình duyệt sẽ xóa nhạc đã lưu.

`MusicEngine` dùng Web Audio, mặc định âm lượng 30%, giới hạn gain đầu ra 0.12 và có envelope tăng/giảm âm. Chuỗi nốt được đặt trên đồng hồ âm thanh; lượt phát mới thay lượt cũ và không chồng tiếng. Âm lượng thực tế còn phụ thuộc thiết bị. Chuyển nền, rời trang hoặc phát hướng dẫn/âm thanh khác sẽ dừng nhạc. Không cần tải sample hay bản nhạc có bản quyền. Sau khi service worker cài xong, trang, nhạc cụ, bản lưu và hai trò chơi chạy offline; giọng đọc hướng dẫn tùy khả năng TTS cục bộ/cài đặt giọng nói. Hướng dẫn chữ và nhãn trình đọc màn hình luôn có sẵn.

Hai trò chơi gồm ghi nhớ ba nốt và nghe/chọn nhịp giống mẫu. Có nghe lại, phản hồi bằng chữ/live region, gợi ý chữ và thao tác tuần tự; không ép trả lời theo thời gian hoặc dựa vào màu sắc/chuyển động. Giao diện dùng các theme và thiết lập reduced motion chung.

- Mã chính: `src/engines/music/`, `src/features/music/`, `src/hooks/useMusicEngine.ts`, `src/lib/music/compositions.ts`.
- Unit/integration: `npx vitest run src/engines/music src/lib/music src/features/music`.
- Trình duyệt: `npm run build && npx playwright test e2e/music.spec.ts` (desktop, điện thoại, máy tính bảng; có axe, chữ 200%, reduced motion và offline).

## Design System

Mở `/design-system` từ điều hướng chính. Showcase đặt trong `AppLayout` thật, có thể đổi sáng/tối/tương phản cao, tăng chữ, giảm chuyển động, mở dialog, thử âm tổng hợp và xem trạng thái loading/empty/error. Các mẫu tĩnh được ghi chú rõ. Không có tài nguyên ghi âm giả hay tự phát âm thanh.

| Nhóm file                                                                                | Trách nhiệm                                                                                 |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/styles/tokens.css`                                                                  | Semantic colors cho ba theme; typography, spacing, radii, touch target và motion tokens     |
| `src/styles/global.css`                                                                  | Reset, layout ứng dụng, focus, responsive, reduced motion và forced colors                  |
| `src/styles/components.css`                                                              | Các component và Showcase; import sau global để các variant có hiệu lực                     |
| `src/components/atoms/AccessibleButton.tsx`                                              | Native button, primary/secondary/quiet/danger, hai kích thước, disabled/busy, hỗ trợ ref    |
| `src/components/atoms/AudioButton.tsx`                                                   | Transport có nhãn chữ, nhận state và callback từ adapter                                    |
| `src/components/molecules/AppCard.tsx`, `AudioCard.tsx`                                  | Article có tên truy cập, action riêng, audio status và nội dung chữ tùy chọn                |
| `src/components/organisms/AppDialog.tsx`                                                 | Controlled native modal, inert background, vòng Tab, Escape, khôi phục focus và scroll      |
| `src/components/molecules/LoadingState.tsx`, `EmptyState.tsx`, `ErrorState.tsx`          | Thông báo bằng chữ, live status/alert và hành động tiếp theo                                |
| `src/components/molecules/PageHeader.tsx`                                                | Tiêu đề, mô tả, eyebrow, action, document title và focus khi đổi route                      |
| `src/components/templates/AppLayout.tsx`                                                 | Sidebar responsive, skip link, main landmark, footer và Suspense                            |
| `src/design-system/index.ts`                                                             | Public exports; component tiếp tục nằm đúng lớp atoms/molecules/organisms/templates         |
| `src/features/design-system/`                                                            | Các phần Showcase, mỗi phần là một component nhỏ                                            |
| `src/content/designSystem.ts`, `audioControls.ts`                                        | Dữ liệu token mẫu, nhãn trạng thái, thông số và mô tả âm thử                                |
| `src/hooks/useTonePreview.ts`, `src/engines/audio/TonePreview.ts`                        | React adapter và audio lifecycle; xử lý unavailable/error, dừng và giải phóng khi rời trang |
| `src/types/preferences.ts`, `src/stores/preferencesStore.ts`, `src/app/AppProviders.tsx` | Theme type-safe, đọc dữ liệu cũ, lưu qua IndexedDB hiện có và áp dụng lên html              |
| `src/features/settings/SettingsPage.tsx`, `src/content/settings.ts`                      | Chọn theme trong trang cài đặt; tùy chọn boolean tách khỏi theme                            |
| `src/app/routes.tsx`, `src/main.tsx`                                                     | Lazy route Showcase và thứ tự import styles                                                 |

Sử dụng component qua public entry point:

```tsx
import { AccessibleButton, AppDialog, AudioCard } from '@/design-system';

<AccessibleButton variant="secondary" onClick={openHelp}>
  Xem hướng dẫn
</AccessibleButton>;

<AudioCard
  title={resource.title}
  description={resource.description}
  state={playback.state}
  onActivate={playback.toggle}
  transcript={resource.transcript}
/>;

<AppDialog
  open={helpOpen}
  onClose={closeHelp}
  title="Hướng dẫn"
  description="Dùng Tab để đến điều khiển tiếp theo."
/>;
```

`AccessibleButton` mặc định `type="button"`; dùng `type="submit"` tường minh trong form. Luôn cung cấp nhãn chữ nhìn thấy; icon trang trí ẩn khỏi screen reader. `loading` giữ focus bằng `aria-disabled` và chặn click/Enter/Space; truyền nhãn bận mô tả tác vụ. `disabled` dùng thuộc tính native và ra khỏi thứ tự Tab.

`AudioButton`/`AudioCard` là controlled UI, không tự tạo player: `ready`, `playing`, `paused`, `loading`, `error`, `unavailable`. `onActivate` do adapter cung cấp; retry ở trạng thái error chỉ bật khi có callback. Không có callback hoặc tài nguyên thì hiển thị điều khiển vô hiệu hóa. Luôn cung cấp feedback giải thích lỗi hoặc thiếu tài nguyên; transcript dùng `<details>` không cần nghe để đọc. Âm thử 440 Hz là tổng hợp thật trong engine, tự kết thúc sau hai giây; nghe tiếp sau tạm dừng phát nốt từ đầu và được giải thích ngay trên thẻ.

Theme mặc định sáng; `data-theme="dark"` bật tối và `data-high-contrast="true"` luôn ưu tiên hơn theme. Dữ liệu cũ không có `theme` được đọc thành sáng, không đổi schema hay xóa cài đặt. `data-large-text="true"` dùng 125%; CSS dùng rem và xuống dòng khi tăng chữ. Breakpoints mobile-first 40rem, 68rem, 86rem được ghi rõ trong tokens và Showcase; media queries dùng literal vì CSS custom properties chưa dùng được trong điều kiện media query native. Navigation tự điều chỉnh số cột theo không gian. Font hệ thống hoạt động offline và tôn trọng font mặc định của trình duyệt.

Focus dùng viền 3px, offset 4px và lớp đệm tương phản. Vùng chạm nút ít nhất 3rem; nội dung không có chiều cao cố định. `prefers-reduced-motion`, lựa chọn giảm chuyển động trong app và Windows forced colors đều có fallback riêng. Dialog dùng `<dialog>.showModal()` trên trình duyệt hiện đại, có tên/mô tả, nút đóng bằng chữ và không đóng khi vô tình chạm nền; component quản lý trạng thái qua `open`/`onClose`. `PageHeading` giữ alias tương thích cho các trang hiện tại.

Kiểm thử bổ sung: `AccessibleButton.test.tsx`, `AudioCard.test.tsx`, `TonePreview.test.ts`, các test migration/theme trong `preferencesStore.test.ts`, các snapshot mới trong `preferencesRepository.test.ts`, route Showcase trong `e2e/app.spec.ts` và các luồng Design System trong `e2e/design-system.spec.ts`. Bộ E2E chạy bản production có service worker để kiểm tra route offline thực tế, ba theme với axe-core, dialog, âm thật và fallback, cài đặt sau reload, 320px với chữ 200%, reduced motion và forced colors. Kiểm tra âm trong trình duyệt xác nhận lifecycle phát; chất lượng nghe và mức âm lượng trên thiết bị vật lý vẫn cần kiểm tra thủ công.

Kiểm tra Design System tại local ngày 21/11/2026: typecheck, ESLint, Prettier, build production và 22 unit/integration test đạt; 63 E2E test đạt trên Chromium desktop/mobile/tablet. Axe-core không phát hiện vi phạm trong các phạm vi quét. Chưa xác minh thủ công bằng NVDA, VoiceOver, TalkBack hoặc trên thiết bị vật lý; đây chưa phải chứng nhận tuân thủ WCAG.

## Kết quả nhiệm vụ routing và màn hình cơ bản

Kiểm tra bản cập nhật ngày 21/11/2026: TypeScript strict, ESLint, Prettier và build production đạt; **44 unit/integration test và 99 E2E test đạt**. E2E chạy trên Chromium desktop, Pixel 7 giả lập và viewport tablet cảm ứng. Axe-core không phát hiện vi phạm trong phạm vi quét; chưa kiểm tra Firefox, Safari, thiết bị vật lý hoặc trình đọc màn hình thủ công.

Các ca mới kiểm tra URL chuẩn, ID không tồn tại, redirect URL cũ, title/focus, lazy loading và chunk lỗi, layout còn dùng được sau lỗi, dialog/Tab/Escape, Back/Forward, reload, tiến độ sau khi đổi route, hoạt động offline, lưu trữ bị chặn, lỗi ghi trong lúc xác nhận rời trang, migration v1 → v2, dữ liệu lưu hỏng và audio không được hỗ trợ. Ảnh QA và báo cáo được tạo trong `test-results/` và `playwright-report/` (không đưa vào Git).

| Nhóm file tạo/chỉnh sửa                                                                                                                                                 | Nội dung                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/app/routes.tsx`, `RouteErrorPage.tsx`, `RouteContentBoundary.tsx`, `RouteLoadingState.tsx`                                                                         | URL chuẩn, hai route chi tiết, redirect, fallback và phục hồi lỗi         |
| `src/components/templates/AppLayout.tsx`, `SectionPage.tsx`; `src/components/molecules/PageHeader.tsx`, `EmptyState.tsx`; `src/styles/components.css`                   | Layout, focus theo pathname, component trống dùng lại và bố cục hoạt động |
| `src/content/sections.ts`; `src/features/home/HomePage.tsx`; `src/features/design-system/CardsShowcase.tsx`, `StatesShowcase.tsx`                                       | Nhãn tiếng Việt và liên kết đến URL mới                                   |
| `src/features/stories/StoryPage.tsx`; `src/features/games/GamesPage.tsx`, `GamePage.tsx`, `ToneGame.tsx`, `ProgressNotice.tsx`                                          | Màn hình chi tiết, game thật và thông báo lưu tiến độ                     |
| `src/content/games.ts`; `src/engines/game/toneGame.ts`; `src/hooks/useTonePreview.ts`                                                                                   | Nội dung game, quy tắc độc lập UI và adapter âm tổng hợp                  |
| `src/types/activity.ts`; `src/stores/activityStore.ts`; `src/lib/storage/activityRepository.ts`, `database.ts`; `src/components/organisms/ActivityNavigationGuard.tsx`  | Tiến độ, IndexedDB, migration và xác nhận rời hoạt động                   |
| `src/app/routes.test.tsx`, `navigation.test.tsx`; `src/stores/activityStore.test.ts`; `src/lib/storage/activityRepository.test.ts`; `src/engines/game/toneGame.test.ts` | Unit/integration test                                                     |
| `e2e/app.spec.ts`, `design-system.spec.ts`, `navigation.spec.ts`; `README.md`                                                                                           | Kiểm thử trình duyệt, accessibility và tài liệu bàn giao                  |

Sau nhiệm vụ routing, thư viện đã có catalog, trang nghe/đọc theo cảnh, MP3 thật và tải audio ngoại tuyến qua audio engine dùng chung. Các route âm nhạc, học tập và giáo viên vẫn là màn hình nền tảng có trạng thái trống.

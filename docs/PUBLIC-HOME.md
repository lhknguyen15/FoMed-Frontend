# Trang công khai FoMed

## Giao diện

Trang chủ dùng chung `PublicHeader` và `PublicFooter` với danh sách bác sĩ, chuyên khoa và dịch vụ. Các khối nền xanh nhạt xen kẽ nền trắng; card bác sĩ dùng ảnh từ API hoặc tên viết tắt khi ảnh chưa tải/lỗi. Phần giới thiệu, tiện ích, hướng dẫn và FAQ là nội dung tĩnh. Tư vấn trực tuyến và Tin tức y tế dẫn tới trang thông báo đang phát triển, không có chức năng giả. Các mục khác chưa triển khai trong footer chỉ hiển thị nhãn “Sắp ra mắt”.

Routes công khai: `/`, `/doctors`, `/doctors/:doctorId`, `/specialties`, `/services`, `/online-consultation`, `/health-news`. Luồng chuyển hướng về workspace khi tài khoản đăng nhập truy cập `/` được giữ nguyên như trước.

### Thanh điều hướng và biểu tượng trình duyệt (2026-10-07)

- `index.html` dùng logo PNG FoMed có sẵn cho favicon và biểu tượng màn hình chính; Vite chuyển sang đường dẫn asset có hash khi build. Không phụ thuộc vào React khởi động mới có biểu tượng tab.
- Thanh điều hướng chung không còn mục Trang chủ (logo vẫn dẫn về `/`). Ba danh mục Bác sĩ, Chuyên khoa, Dịch vụ nằm trong menu “Đặt khám theo”; hai mục còn lại là Tư vấn trực tuyến và Tin tức y tế. Header phủ chiều rộng màn hình, logo ở trái (24px từ mép ở desktop), menu và một nút “Đăng nhập” gom chung bên phải bằng `ml-auto`. Không còn menu Tài khoản, nút đăng ký hoặc đặt lịch trong header; đăng ký vẫn có trên trang đăng nhập/footer, đặt khám vẫn truy cập qua danh mục và các nút trong nội dung trang.
- Chữ trong menu/button dùng chung `.public-header .public-nav-item`: Be Vietnam Pro, 14px, weight 600, line-height 21px. Quy tắc được đặt ngoài CSS layer để không bị `button { font: inherit }` ghi đè; không thay đổi font các biểu mẫu khác. Đã đo computed style đúng trên desktop và mobile.
- Menu desktop mở bằng click/Enter/Space. Mobile có menu thu gọn và nhóm Đặt khám theo dạng accordion; nút Đăng nhập luôn hiện. Chọn liên kết, đổi trang, bấm ngoài header, chuyển focus ra ngoài header hoặc đổi breakpoint đều đóng menu. Esc đóng menu phụ trước và trả focus về nút của nó; Esc lần nữa đóng menu mobile. Liên kết/nút có focus ring và nhãn hỗ trợ đọc màn hình.
- Điều chỉnh giới hạn chiều rộng body để không tràn ngang do thanh cuộn ở viewport 320px; không thay đổi nghiệp vụ hay dữ liệu.
- `node tests/public-navigation.audit.cjs`: 19 kiểm tra render/source, không thay thế kiểm thử tương tác. Fixture `tests/fixtures/public-navigation.html` hiển thị header thật, không dùng phiên đăng nhập hoặc gọi API. Đã kiểm tra trong trình duyệt trên các trang thật: Enter/Tab/Esc và focus, click bên ngoài, chọn Dịch vụ đóng menu và giữ trạng thái active, bố cục 320/390/1024/1920px qua các lần chỉnh sửa. Lần chỉnh bố cục trái/phải kiểm tra riêng vị trí 1920px, font chữ desktop/mobile và không tràn ngang ở 320px. Không đăng nhập, tạo lịch hẹn hay ghi dữ liệu trong kiểm thử này.

### Trang chức năng đang phát triển

`FeatureComingSoonPage` dùng chung cho `/online-consultation` và `/health-news`, với tên và nội dung riêng từng chức năng. Trang có thông báo rõ ràng “Chức năng đang phát triển”, không hứa ngày ra mắt, không có biểu mẫu gửi yêu cầu, bài viết mẫu hoặc API mới. Người dùng có thể quay lại trang chủ hoặc tìm bác sĩ. Khi chuyển đến trang (kể cả từ footer), cuộn về đầu trang, focus tiêu đề và cập nhật tên tab; khôi phục tên tab khi rời trang. Hai route truy cập công khai và tải lại trực tiếp được trong môi trường Vite đã kiểm thử; máy chủ production vẫn cần cấu hình SPA fallback như các route hiện có.

### Danh sách chuyên khoa và bác sĩ trượt ngang (2026-10-07)

- Hai phần chính trên trang chủ dùng `PublicCatalogCarousel`, hiển thị toàn bộ chuyên khoa/bác sĩ đã tải thay vì giới hạn 10 chuyên khoa và 4 bác sĩ. Các thẻ trong phần đầu trang và danh mục dịch vụ không thay đổi.
- Nút tròn trái/phải chuyển theo nhóm thẻ đang hiển thị và tự vô hiệu hóa ở đầu/cuối. Có cuộn ngang tự nhiên, thanh cuộn, vị trí dừng theo thẻ; không tự chạy. Desktop hiển thị 5 chuyên khoa hoặc 4 bác sĩ, tablet 3/2; điện thoại hé một phần thẻ kế tiếp để gợi ý vuốt.
- Danh sách có nhãn tiếng Việt, hướng dẫn đọc màn hình và focus bàn phím. Khi focus danh sách có thể dùng trái/phải/Home/End; không chặn bàn phím trên liên kết trong thẻ. Giảm chuyển động khi thiết bị yêu cầu. Theo dõi scroll/resize và hủy listener/observer khi rời trang.
- Giữ nguyên tải/lỗi/rỗng, nút thử lại, liên kết hồ sơ bác sĩ và lọc chuyên khoa. Không thêm API, dependency hoặc thay đổi dữ liệu.
- `node tests/public-carousel.audit.cjs`: 10 kiểm tra render/source với 0, 1, 17 lựa chọn; `node tests/public-navigation.audit.cjs`: 19 kiểm tra vẫn đạt. Build và ESLint hai tệp React liên quan đạt. Đây chưa phải kiểm thử tương tác trình duyệt.
- Fixture `tests/fixtures/public-carousel.html` dùng thẻ thật và dữ liệu minh họa riêng (12 chuyên khoa, 11 bác sĩ), có nút chuyển còn một lựa chọn. Không gọi API hoặc dùng dữ liệu bệnh nhân. Chưa kiểm tra trực tiếp fixture vì lần khởi chạy máy chủ xem thử bị chặn ở bước xét duyệt quyền; cần kiểm tra tiếp nút chuyển, resize, vuốt, bàn phím và tràn ngang trên 320/390/768/1024/1440px trước khi xác nhận hoàn tất giao diện.

## API

- `GET /api/doctors`: bổ sung `avatarUrl` vào DTO danh sách; không gọi thêm API chi tiết cho mỗi card.
- `GET /api/specialties`: danh sách chuyên khoa.
- `GET /api/services?page=N`: 20 dịch vụ/trang. API hiện chưa có search và metadata total/hasNext. Trang dịch vụ đọc trước trang kế để xác định có thể đi tiếp; tìm kiếm chỉ lọc trong trang hiện tại, có ghi rõ trên giao diện. Chưa có đặt dịch vụ trực tiếp hoặc trang chi tiết dịch vụ vì chưa có API/workflow công khai tương ứng.

Khởi động lại API sau khi build để danh sách trả trường avatar mới. Không cần chạy thêm SQL cho thay đổi này.

## Kiểm thử giao diện

`tests/public-home.smoke.cjs` chạy với Playwright được cài/cache riêng, không thêm dependency production. Có thể đặt `PLAYWRIGHT_MODULE` trỏ tới thư mục package Playwright và `FOMED_PREVIEW_URL` trỏ tới server preview (mặc định `http://127.0.0.1:5184`). Chạy `node tests/public-home.smoke.cjs` sau khi build FE và khởi động preview có proxy đến API mới.

Kiểm tra dữ liệu thật, điều hướng, FAQ, tìm kiếm dịch vụ, lỗi/rỗng/tải lại và responsive 320–1440px. Ảnh chụp sinh vào `dist/review` (không theo dõi bởi Git). Fixture lỗi/rỗng chỉ thay phản hồi trong trình duyệt, không cập nhật database.

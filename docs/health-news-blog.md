# Tin tức y tế FoMed — blog và nguồn tin bên ngoài

## Phạm vi hiện tại

Trang công khai `/health-news` thay trang «đang phát triển», dùng cùng điều hướng và màu thương hiệu FoMed. Có bài mới nhất, lưới bài viết, tìm kiếm tiếng Việt có/không dấu, lọc chủ đề, sắp xếp và xem thêm. Chưa có màn hình quản trị, trình soạn thảo, chức năng đăng bài hoặc trang chi tiết bài viết nội bộ.

Dữ liệu là bản tin thực từ [RSS Sức khỏe VnExpress](https://vnexpress.net/rss/suc-khoe.rss), không phải bài viết FoMed tự biên soạn. Mỗi bài ghi tên nguồn, ngày xuất bản và mở bản gốc trong thẻ mới. Chỉ hiển thị tiêu đề và đoạn giới thiệu tối đa 200 ký tự; không tải toàn văn. Ảnh/HTML trong RSS không được tái sử dụng. Hình trang trí là biểu tượng sẵn có của dự án, không phải ảnh của bài báo.

### Bản thử phân cấp nền và thẻ

Vùng đọc dùng nền trung tính `#F6F8F7`; thẻ tin và bài mới nhất dùng nền trắng, viền mảnh và bóng nhẹ. Phần giới thiệu giữ xanh bạc hà, nút và liên kết giữ xanh ngọc. Selector `.public-site.health-news-page` bảo đảm nền dùng chung không ghi đè nền riêng của trang tin tức; không thay đổi các trang khác.

Bỏ khung minh họa xanh lớn lặp lại ở mỗi bài. Khi chưa có ảnh được cấp quyền sử dụng, ưu tiên tiêu đề, đoạn tin, ngày xuất bản và nhãn chủ đề nhỏ; không gán ảnh minh họa chung thành ảnh thật của bài báo. Bài mới nhất có tiêu đề lớn hơn và đường nhấn xanh bên trái. Giữ nguyên dữ liệu, liên kết nguồn, tìm kiếm, lọc và sắp xếp.

Kiểm tra bổ sung: 12 kiểm thử trang tin tức và 6 kiểm thử bảng màu đạt; build/lint đạt, còn cảnh báo gói JavaScript lớn đã có trước. Trình duyệt xác nhận nền trang `rgb(246, 248, 247)` khác nền thẻ trắng; tìm kiếm và lọc chủ đề hoạt động, không tràn ngang ở desktop và 375px. Chưa commit/push bản thử này.

[Điều khoản RSS của VnExpress](https://vnexpress.net/rss) đề cập việc cung cấp miễn phí cho cá nhân và tổ chức phi lợi nhuận, yêu cầu ghi nguồn, và quyền yêu cầu ngừng phân phối. Bản này dành cho demo học tập. Cần rà soát/xin phép trước khi sử dụng trong hoạt động thương mại; việc truy cập được RSS không đồng nghĩa quyền sao chép toàn bộ bài hoặc ảnh. Không ngụ ý VnExpress bảo trợ FoMed.

## Kiến trúc

`HealthNewsPage → news-api.ts → GET /news-feed → server/health-news.mjs → RSS đã cố định`

- Vercel: rewrite `/news-feed` đến function `api/health-news.mjs`, trước rewrite SPA. Function dùng handler chung trong `server/`. Cần triển khai phiên bản frontend mới để function xuất hiện; chưa có thao tác triển khai trong thay đổi này.
- Local: `npm run dev` dùng middleware Vite cùng handler; không cần proxy công khai hoặc khóa API. `npm run preview` cũng có middleware này. Chạy một máy chủ chỉ phục vụ file `dist` sẽ không có endpoint tin tức.
- Không đổi FoMed-API, Azure, CORS hoặc biến `VITE_API_URL`; không chuyển token người dùng cho dịch vụ đọc tin.
- Chỉ lấy tối đa 40 bản tin, sắp mới nhất trước. Không phải kho lưu trữ toàn bộ bài cũ.
- Nhóm chủ đề là nhãn gợi ý của FoMed theo từ khóa tiêu đề, không phải chuyên mục chính thức của báo hoặc phân loại y khoa. Không sửa lời khuyên y tế, không tự sinh nội dung sức khỏe.

## Giới hạn và an toàn

- Một URL nguồn HTTPS cố định; người xem không thể truyền URL tùy ý. Không theo chuyển hướng. Liên kết bài chỉ chấp nhận HTTPS `vnexpress.net`, không có thông tin đăng nhập hoặc cổng tùy ý.
- RSS tối đa 1 MB, thời gian chờ nguồn 10 giây; từ chối DTD/khai báo entity. Trình duyệt chờ tối đa 15 giây và hủy khi rời trang.
- Thư viện `rss-parser` chỉ chạy phía máy chủ, không đưa vào gói React. RSS được chuyển thành văn bản; giao diện không dùng `dangerouslySetInnerHTML`.
- Cache mới trong 5 phút, gộp yêu cầu đang chạy trong cùng instance. Khi nguồn lỗi, có thể trả cache cũ tối đa 24 giờ với nhãn rõ ngày cập nhật. Cache trong bộ nhớ có thể mất khi serverless khởi động lại; không phải kho lưu trữ bền vững.
- Giảm gọi lại nguồn trong 60 giây sau lỗi. Có cache CDN cho GET thành công. Không thay thế giải pháp rate limit toàn hệ thống nếu lưu lượng tăng.
- Khi chưa có cache và nguồn lỗi: trả 503, giao diện báo lỗi thân thiện, cho thử lại và cung cấp liên kết nguồn. Không tự tạo bài giả để lấp chỗ trống.
- Trang chỉ cung cấp thông tin tham khảo, không thay thế chẩn đoán/tư vấn của nhân viên y tế.

## Lộ trình quản lý và đăng bài

1. Tạo bảng bài viết, chuyên mục, thẻ, ảnh và lịch sử chỉnh sửa trong FoMed-API/Azure. Các trường cốt lõi: `id`, `slug`, `title`, `excerpt`, `body`, `coverImage`, `authorId`, `categoryId`, `status`, `publishedAt`, `updatedAt`, `origin`, `sourceUrl`.
2. Tách bài nội bộ và liên kết ngoài bằng kiểu dữ liệu rõ ràng. Bài ngoài tiếp tục mở nguồn; bài FoMed mới có `/health-news/:slug` và nội dung đã duyệt. Không dùng URL nguồn làm nội dung sở hữu của FoMed.
3. Quy trình nháp → chờ duyệt → đã đăng → lưu trữ; phân quyền viết/duyệt/đăng phía API. Chỉ Admin hoặc vai trò biên tập được cấp quyền rõ ràng mới có thể đăng. Trang công khai tuyệt đối không trả bài nháp.
4. Trình soạn thảo và tải ảnh cần kiểm tra đầu vào, giới hạn kích thước/loại file, làm sạch HTML và bảo vệ quyền tác giả. Lưu nguồn tham khảo, người chịu trách nhiệm chuyên môn và ngày rà soát với nội dung y tế.
5. API công khai phân trang, tìm kiếm và lọc; giao diện đổi provider, giữ lại các thành phần danh sách hiện có. Tách dữ liệu quản trị khỏi dữ liệu công khai; bổ sung nhật ký đăng/sửa/gỡ bài và kiểm thử phân quyền.
6. Bổ sung SEO, metadata riêng từng bài, sitemap và xem trước chia sẻ cho bài FoMed. Không gắn schema tác giả/bác sĩ/đánh giá không được xác minh cho tin tổng hợp.

## Kiểm tra

- `node --test tests/health-news-feed.test.mjs`: kiểm tra parser, nguồn URL, HTML, giới hạn, cache, lỗi nguồn, handler và rewrite Vercel.
- `node --test tests/health-news-page.test.cjs`: kiểm tra danh sách, xem thêm, chủ đề, tìm kiếm, sắp xếp, lỗi/thử lại, liên kết, hủy request và không gửi thông tin đăng nhập.
- `node tests/public-navigation.audit.cjs` và `node tests/public-carousel.audit.cjs`: kiểm tra hồi quy điều hướng/trang chủ.
- Chạy `npm run lint`, `npm run build` và kiểm tra trình duyệt desktop/mobile trước bàn giao. Các unit test dùng dữ liệu riêng, không đăng gì lên báo hoặc Azure.

Lần kiểm tra nguồn thật ngày 22/10/2026 lấy được 40 bài. Nguồn có thể gián đoạn hoặc thay đổi điều khoản sau này; kết quả này không đảm bảo dịch vụ bên ngoài luôn sẵn sàng.

Kết quả cục bộ: 22/22 kiểm thử tin tức, 19/19 kiểm tra điều hướng và 10/10 kiểm tra thanh trượt đạt; build và lint thành công. Trình duyệt kiểm tra thêm/xóa từ khóa, lọc chủ đề, thứ tự ngày và liên kết nguồn. Không tràn ngang ở 320/375/768/1440px; lưới chuyển đúng 1/2/3 cột. Function Vercel mới chỉ được kiểm tra cấu hình và handler dùng chung cục bộ, chưa được triển khai hay xác minh trên hosting. Ảnh xem thử lưu trong `dist/review/`, không đưa vào Git.

`npm audit` sau khi thêm RSS không báo lỗ hổng ở `rss-parser`; còn cảnh báo high ở Vite 7.3.6 hiện có của dự án (nhóm launch-editor và các cảnh báo dev server). Không chạy `npm audit fix` toàn bộ trong công việc thiết kế này. Nên xử lý nâng bản vá Vite thành công việc riêng, kiểm tra lại dev server/build và Node đang sử dụng. Build vẫn có cảnh báo gói JavaScript hơn 500 kB; đây là cảnh báo tối ưu, không phải lỗi lấy tin.

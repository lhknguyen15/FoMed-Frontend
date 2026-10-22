# Bản thử thiết kế trang chủ FoMed

Chưa commit, push hoặc triển khai. Không thay đổi API, dữ liệu hoặc quy trình đặt khám.

## Cơ sở thiết kế

Áp dụng [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), phiên bản nguồn `623a9a9037d006ea727f8213f084d02a6b6f11b5` (22/10/2026), đọc và chạy từ bản sao tạm, không cài toàn cục.

Truy vấn lựa chọn: `medical clinic minimal accessible --design-system --variance 2 --density 3`, kết hợp hướng dẫn React `accessible search responsive cards --stack react`.

Hướng được chọn: Minimalism & Swiss Style — thứ bậc rõ ràng, khoảng trắng, lưới nhất quán, tương phản và thao tác bàn phím. Không dùng gợi ý neumorphism từ truy vấn đầu do khó đảm bảo tương phản. Không thêm đánh giá, chứng nhận hay số liệu người dùng chưa kiểm chứng.

## Điều chỉnh cho FoMed

- Giữ xanh thương hiệu `#0f766e`, nền trắng và xanh nhạt `#f1f7f5`. Chuyên khoa và dịch vụ cùng nền. Không dùng bảng màu cyan/xanh lá mới mà bộ skill đề xuất.
- Giữ Be Vietnam Pro và Manrope sẵn có để hiển thị tiếng Việt đồng bộ, không tải thêm phông chữ.
- Đưa tìm bác sĩ thành thao tác chính. Bản thử ảnh mới thay khối hồ sơ bên phải bằng ảnh minh họa tay cầm ống nghe và liên kết khám phá bác sĩ; danh sách bác sĩ thật vẫn ở thanh trượt bên dưới, không hiển thị lịch trống giả.
- Giữ thanh trượt chuyên khoa/bác sĩ, trạng thái tải/lỗi/rỗng, tìm kiếm, chuyển hướng theo vai trò và điều hướng hiện có.
- Ảnh bác sĩ vắng hoặc lỗi dùng biểu tượng người trong các thẻ xem trước, không thay bằng ảnh người không đúng danh tính.
- CSS thiết kế mới giới hạn trong `.fomed-home`, không thay màu giao diện quản trị.
- Có liên kết bỏ qua điều hướng, nhãn tìm kiếm, focus rõ ràng và hỗ trợ giảm chuyển động. Không thêm tự động trượt.

## Kiểm tra

- `npm run build`: đạt; còn cảnh báo gói JavaScript lớn hơn 500 kB, không chặn build.
- `npm run lint`: đạt.
- `public-carousel.audit.cjs`: 10/10; `public-navigation.audit.cjs`: 19/19. Đây là kiểm tra render/mã nguồn, không thay thế kiểm tra tương tác.
- Trình duyệt: tìm kiếm tiếng Việt chuyển đúng URL; menu desktop mở/đóng bằng Escape; menu di động mở/đóng; câu hỏi thường gặp mở được.
- API Render phản hồi sau thời gian chờ ban đầu: hiển thị 16 bác sĩ, 9 chuyên khoa và 6 dịch vụ xem trước. Không tạo hoặc sửa dữ liệu.
- Nút trượt bác sĩ/chuyên khoa thay đổi vị trí cuộn lần lượt 1.041px/833px trên viewport mặc định; các thẻ vẫn dùng danh mục đầy đủ.
- Không tràn ngang toàn trang ở 320px, 375px và 1440px. Nền chuyên khoa và dịch vụ đều là `rgb(241, 247, 245)`.
- Ảnh kiểm tra cục bộ nằm trong `dist/review/` (thư mục build bị Git bỏ qua). Bản xem thử chạy riêng ở `http://127.0.0.1:5197/`.

Chưa kiểm tra với trình đọc màn hình thực tế hoặc chạy toàn bộ kiểm thử nghiệp vụ; không coi các kiểm tra trên là đánh giá khả năng truy cập đầy đủ.

## Bản thử ảnh chụp

Thêm hai ảnh Pexels trong `src/assets/images/home/`, tổng khoảng 183 KiB: ảnh cận cảnh ống nghe ở đầu trang và ảnh không gian chờ ở phần giới thiệu. Ghi nguồn và giấy phép trong `ATTRIBUTION.md` cùng thư mục. Cả hai được ghi chú minh họa; ảnh không gian không được mô tả là cơ sở thật của FoMed. Không thay chân dung bác sĩ bằng ảnh người mẫu.

Giữ nền trắng/xanh nhạt và nav căn cùng nội dung. Chữ dài không chồng lên ảnh. Bốn thẻ lợi ích được đưa xuống hàng riêng sau phần giới thiệu. Ảnh đầu trang tải ưu tiên, ảnh phía dưới tải lười; có khung giữ tỷ lệ, văn bản thay thế và trạng thái dự phòng khi ảnh lỗi.

Kiểm tra bổ sung: `node --test tests/home-photos.test.cjs` đạt 5/5; thanh trượt đạt 10/10, điều hướng đạt 20/20; build/lint đạt. Trình duyệt xác nhận cả hai ảnh tải thành công và không tràn ngang ở 320/375/768/1440px. Chưa commit hoặc triển khai.

## Bản thử hai màu thương hiệu — 22/10/2026

Phần này thay thế các mô tả màu nền ở các bản thử phía trên.

- Màu chính: xanh ngọc đậm `#0F766E`, dùng cho nút, liên kết nổi bật và chân trang.
- Màu phụ: xanh bạc hà `#DDEFE8`, dùng cho nền các mảng lớn. Trắng là màu trung tính dành cho thẻ, ô nhập và vùng đọc nội dung; chữ tối giữ độ tương phản.
- Trang chủ xen kẽ: đầu trang xanh → chuyên khoa trắng → bác sĩ xanh → dịch vụ trắng → giới thiệu xanh → hướng dẫn trắng → câu hỏi xanh. Chuyên khoa và dịch vụ vẫn cùng nền.
- Biến màu dùng chung nằm trong `src/workspaces/public/public-theme.css`, giới hạn trong `.public-site`. Áp dụng cho các trang công khai: trang chủ, bác sĩ, chuyên khoa, dịch vụ, tin tức và trang chức năng đang phát triển. Không thay đổi giao diện quản trị hoặc màn hình đăng nhập.
- Màu cảnh báo/lỗi vẫn giữ ý nghĩa riêng; không ép thành màu thương hiệu.

Kiểm tra: 6 kiểm thử bảng màu, 5 kiểm thử ảnh, 10 kiểm thử trang tin tức, 20 kiểm tra điều hướng và 10 kiểm tra thanh trượt đều đạt. Các cặp chữ/nền chính được kiểm tra tỷ lệ tương phản tối thiểu 4,5:1. Build/lint đạt; còn cảnh báo kích thước gói JavaScript đã có trước.

Trình duyệt xác nhận màu nền xen kẽ đúng, chân trang/nút có chữ dễ đọc, trang dịch vụ và tin tức nhận cùng biến màu; không tràn ngang ở 375px và viewport desktop. Bản xem thử hiện tại: `http://127.0.0.1:5198/`. Chưa commit, push hoặc triển khai.

### Điều chỉnh chân trang

Thử nền xanh ngọc trầm `#123F3B` cho chân trang, là sắc độ tối của màu chính. Chữ trắng ngà `#F5F7F4`, liên kết xanh bạc hà `#DDEFE8`; giữ nguyên banner đặt khám và các phần phía trên. Hai cặp chữ/nền này cũng được kiểm tra tương phản tối thiểu 4,5:1 trong `public-theme.test.cjs`.

# Vị trí cuộn khi điều hướng

`RouteScrollManager` được gắn một lần bên trong `BrowserRouter` ở `src/main.tsx`, áp dụng cho trang công khai và các không gian làm việc.

- Chuyển đường dẫn, thay tham số truy vấn, nhấn lại liên kết hoặc dùng Quay lại/Tiến tới: mở đầu trang, đặt cả trục dọc và ngang về 0.
- Dùng `behavior: 'instant'` và layout effect để không cuộn từ từ từ vị trí cũ sang trang mới. Tắt khôi phục vị trí cuộn tự động của trình duyệt trong thời gian ứng dụng hoạt động; hoàn trả thiết lập khi tháo thành phần.
- Liên kết có fragment như `/#about` hoặc `/#how-it-works` vẫn đến đúng phần, tôn trọng `scroll-margin` của phần đó. ID tiếng Việt được giải mã an toàn. Nếu chưa có phần đích do đang tải, quan sát nội dung trong tối đa 8 giây; dừng ngay khi tìm thấy, chuyển trang khác hoặc tháo thành phần. Fragment không tồn tại không làm lỗi trang.
- Không thay vị trí cuộn khi chỉ nhập liệu, mở hộp thoại hay cập nhật trạng thái mà không điều hướng; không tự đổi focus toàn cục. Giữ các xử lý focus phục vụ khả năng truy cập ở từng trang.
- Bỏ các lệnh đưa về đầu trang riêng lẻ ở trang tin tức, trang đang phát triển và phân trang dịch vụ để tránh xử lý trùng.

Kiểm thử: `node --test tests/route-scroll.test.cjs` gồm 9 trường hợp: truy cập ban đầu, đường dẫn/tham số/liên kết lặp, Quay lại/Tiến tới, fragment và ID tiếng Việt, phần đích xuất hiện muộn, dọn dẹp khi rời trang, fragment sai, khôi phục thiết lập trình duyệt và vị trí tích hợp. Bộ kiểm tra liên quan tin tức/bảng màu/ảnh chuyên khoa tổng 33 trường hợp đạt. Build/lint đạt; vẫn còn cảnh báo kích thước gói JavaScript đã có trước.

Trình duyệt xác nhận từ cuối trang chủ → Dịch vụ và cuối Dịch vụ → Bác sĩ đều về `scrollY = 0`; Quay lại/Tiến tới cũng về 0. Liên kết Về FoMed vẫn đến phần giới thiệu, cách mép trên khoảng 96px để không bị thanh điều hướng che. Không tạo/sửa dữ liệu hoặc thay API.

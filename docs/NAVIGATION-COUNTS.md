# Số đếm trên thanh điều hướng

Đã triển khai và kiểm tra cục bộ ngày 06/10/2026. Không sửa dữ liệu Azure,
không thêm yêu cầu tải hồ sơ chỉ để đếm, chưa commit/push/deploy.

## Quy tắc

- Bỏ số đếm cố định trong cấu hình điều hướng của cả sáu vai trò.
- Bệnh nhân: số lịch **sắp tới** từ danh sách lịch hẹn đã tải đầy đủ, không phải
  tổng số lịch hoặc số thẻ trên trang hiện tại. Không hiển thị số khi lọc ngày.
- Lễ tân: số lượt trong hàng chờ hôm nay, chỉ khi đang xem tất cả bác sĩ.
  Lọc một bác sĩ hoặc xem ngày khác thì ẩn số, tránh dùng tập con làm tổng số.
- Bác sĩ: số lượt chờ của bác sĩ đang đăng nhập hôm nay, không cộng lượt đang khám.
- Chỉ ba trang nguồn nêu trên cung cấp số đếm. Trang khác không hiển thị số khi
  chưa có dữ liệu phù hợp; không lưu lại số cũ hoặc dùng số của vai trò khác.
- Đang tải, tải lỗi hoặc chưa có dữ liệu: ẩn số, không giả định là 0.
  Danh sách rỗng tải thành công: hiển thị **0**.
- Trên 99 hiển thị `99+`; nhãn đọc màn hình và chú thích vẫn giữ số chính xác.
  Khi thu gọn menu, chú thích liên kết vẫn mô tả số và phạm vi của nó.

Số đếm phản ánh **danh sách đã tải**, không phải cập nhật thời gian thực. Dùng
“Làm mới” hoặc luồng làm mới sau thao tác hiện có để lấy trạng thái mới từ máy chủ.
Không thêm polling, không tải thêm lịch sử bệnh nhân và không thay đổi quyền truy cập.

Ngày hôm nay được xác định theo giờ Việt Nam, dựa trên đồng hồ thiết bị. Kiểm tra
ngày mỗi 30 giây/khi quay lại cửa sổ; khi sang ngày mới, ẩn số của danh sách ngày
cũ, không tự thay bộ lọc ngày người dùng đã chọn và không tự gửi yêu cầu tải thêm.
Máy chủ vẫn quyết định dữ liệu và quyền thao tác cuối cùng.

## Xác minh

- `node tests/navigation-counts.audit.cjs`: **56 kiểm tra đạt**, dựng menu và ba
  trang thật với dữ liệu tổng hợp; chặn các API ngoài phạm vi kiểm thử.
- Kiểm tra hồi quy: lịch hẹn bệnh nhân 51, trạng thái hóa đơn đã thu 32,
  thông báo SePay thành công 22 kiểm tra đạt.
- `npm run build`: đạt; còn cảnh báo kích thước gói JavaScript trên 500 kB.
- ESLint các tệp thuộc thay đổi này và trang DEMO: đạt. Không tuyên bố toàn dự án
  hết lỗi lint. Trang DEMO cũng qua kiểm tra TypeScript nghiêm ngặt riêng.
- Trình duyệt DEMO: lịch sắp tới 3 trên tổng 6 lịch; rỗng 0; lỗi/đang tải ẩn số;
  lọc ngày ẩn số; đổi vai trò không dùng lại số cũ; lễ tân 4, bác sĩ 2;
  lọc bác sĩ chỉ còn hai lượt nhưng không hiển thị tổng số; thu gọn/mở rộng menu;
  sang ngày mới ẩn số cũ mà không tải thêm dữ liệu.
- Điện thoại 390 × 844: menu hiển thị đúng số, không tràn ngang; không ghi nhận
  lỗi trình duyệt. Đã khôi phục kích thước mặc định và đóng tab kiểm thử.

Trang `tests/fixtures/navigation-counts.html` dùng tài khoản/danh sách tổng hợp,
chặn HTTP và thao tác ghi. Không đọc hồ sơ thật hoặc thực hiện thanh toán.
Ảnh kiểm tra nằm trong `dist/review-navigation-counts/` (Git bỏ qua; build lại sẽ xóa).

Thay chữ cái vai trò bằng biểu tượng người và chuyển thông báo sang Sonner
vẫn là các việc riêng, chưa thực hiện trong bước này.

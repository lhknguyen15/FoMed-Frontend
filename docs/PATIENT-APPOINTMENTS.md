# Phân nhóm lịch hẹn bệnh nhân

Kiểm tra cục bộ ngày 06/10/2026. Chỉ thay đổi cách hiển thị và chặn thao tác
không còn hợp lệ; không tự cập nhật trạng thái lịch và không sửa dữ liệu Azure.

## Quy tắc hiển thị

- **Sắp tới:** chờ xác nhận/đã xác nhận và thời điểm bắt đầu lớn hơn thời điểm hiện tại.
- **Đang khám:** trạng thái đang khám, kể cả lịch từ ngày trước.
- **Cần xử lý:** lịch chờ/đã xác nhận đã đến hoặc qua giờ hẹn; dữ liệu có thời gian
  không hợp lệ hoặc trạng thái chưa biết cũng được giữ ở đây để không bị mất dấu.
- **Đã khám:** đã hoàn tất, vẫn có nút xem bệnh án.
- **Đã hủy / Vắng mặt:** chỉ các trạng thái tương ứng đã được máy chủ ghi nhận.

Sắp tới/đang khám sắp xếp từ sớm đến muộn. Các nhóm còn lại từ mới đến cũ;
thời gian không hợp lệ nằm cuối. Lọc theo ngày vẫn áp dụng cho nhóm đang chọn.
Đổi nhóm/ngày trở về trang 1; nếu danh sách thu nhỏ theo thời gian, trang hiện tại
được giới hạn để không mắc ở một trang trống.

## Thời gian và thao tác

Giờ khám không có múi giờ trong hợp đồng hiện tại là giờ Việt Nam (UTC+07),
theo `ClinicTime` của máy chủ. Giá trị có `Z` hoặc độ lệch múi giờ được giữ đúng
thời điểm rồi hiển thị theo giờ Việt Nam. Không dùng múi giờ trình duyệt để phân nhóm.

Đồng hồ giao diện cập nhật mỗi 30 giây, khi cửa sổ được tập trung, khi đổi trạng thái
hiển thị trang, và khi bấm Làm mới. Đồng hồ không gửi yêu cầu ghi dữ liệu và không
tự tải lại trạng thái từ máy chủ; nút Làm mới tải lại danh sách. Thời gian hiện tại
phụ thuộc đồng hồ thiết bị; máy chủ vẫn quyết định quyền thao tác cuối cùng.

Nút đổi/hủy chỉ xuất hiện cho lịch chờ/đã xác nhận còn hơn 24 giờ, đồng bộ
`AppointmentService.PatientChangeCutoff`. Lịch gần giờ hẹn có lời nhắc liên hệ lễ tân.
Kiểm tra lại thời hạn trước khi mở cửa sổ và ngay trước khi gửi đổi/hủy, tránh cửa
sổ đã mở từ trước vượt mốc thời gian. Chỉ thao tác người dùng xác nhận mới gọi API ghi.

## Bằng chứng kiểm thử

- `node tests/patient-appointments.audit.cjs`: **51 kiểm tra đạt**. Bao gồm mốc
  đúng giờ hẹn, hạn đổi/hủy 24 giờ, tất cả trạng thái, dữ liệu lỗi, tính đầy đủ/không
  trùng nhóm, không sửa nguồn, thứ tự, múi giờ, và dựng trang thật với dữ liệu giả.
- `npm run build`: đạt; vẫn có cảnh báo kích thước gói JavaScript trên 500 kB.
- ESLint riêng trang, tiện ích và trang DEMO: đạt. Không tuyên bố toàn dự án hết lỗi lint.
- Kiểm thử trình duyệt với `tests/fixtures/patient-appointments.html`: năm nhóm,
  phân trang, chuyển nhóm trở về trang 1, lọc ngày có/không có lịch, tải lại danh sách,
  chuyển đồng hồ DEMO sang ngày kế tiếp khi ở trang 2 (danh sách còn một lịch và trở
  về trang 1), cửa sổ đổi giờ cho lịch ngoài hạn 24 giờ, thời gian khung giờ Việt Nam.
- Kích thước điện thoại 390 × 844: nhóm xuống dòng, bộ lọc/thẻ không làm trang tràn ngang,
  lịch thiếu giờ vẫn hiển thị. Khôi phục kích thước mặc định sau kiểm tra.

Trang DEMO dùng tài khoản/lịch tổng hợp; chặn HTTP và toàn bộ thao tác ghi.
Không đăng nhập, không đọc hồ sơ thật, không xác nhận đổi/hủy lịch thật.
Ảnh kiểm tra lưu trong `dist/review-patient-appointments/` (Git bỏ qua; build lại sẽ xóa).

Đây là xác minh cục bộ, chưa commit/push/deploy và chưa kiểm thử tài khoản bệnh nhân
trên cloud. Số đếm cố định trên thanh điều hướng và thay thông báo bằng Sonner
thuộc các bước sau, chưa thay đổi trong mục này.

Cập nhật 06/10/2026: số đếm điều hướng đã được xử lý trong bước riêng;
xem [Số đếm điều hướng](NAVIGATION-COUNTS.md). Sonner vẫn chưa triển khai.

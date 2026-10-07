# FM-02 — Trang lịch bác sĩ dành cho lễ tân

Đường dẫn: `/reception/schedules`; menu **Lễ tân → Lịch bác sĩ**. Trang yêu cầu vai trò `Receptionist` hoặc `Admin`.

- Xem, lọc bác sĩ/ngày/trạng thái và phân trang ca làm việc hằng tuần.
- Thêm nhiều ngày cùng ca; sửa từng ngày; ngừng áp dụng có xác nhận; không xóa lịch sử.
- Lịch nghỉ chỉ xem, gồm cả nghỉ toàn phòng khám; lễ tân không có thao tác chỉnh lịch nghỉ hoặc hồ sơ bác sĩ.
- Lưu thành công mới thông báo; khi thất bại giữ biểu mẫu và thông báo tiếng Việt. Khóa gửi trùng, xử lý tiêu điểm/Tab/Escape trong cửa sổ.
- Sửa/ngừng ca gửi phiên bản đã đọc. Nếu người khác đã thay đổi, đóng cửa sổ, tải lại và kiểm tra trước khi sửa tiếp.
- API chặn thay đổi làm mất khung khám của lịch hẹn chưa hoàn tất từ hôm nay hoặc lượt đang khám. Hệ thống không tự chuyển/hủy lịch hẹn; lịch nghỉ vẫn được ưu tiên khi đặt lịch.

API mới nằm tại `/api/reception/schedules`, không gọi các tuyến quản trị để cấp thêm quyền cho lễ tân. Cập nhật API trước khi triển khai frontend. Không cần migration mới.

```powershell
node tests/reception-schedules.audit.cjs
node tests/admin-notifications.audit.cjs
node tests/medicine-catalog.audit.cjs
npm run lint
npm run build
```

44 kiểm tra mới về xác thực đầu vào, hợp đồng API, kết xuất trang và thao tác dùng dữ liệu giả. Chưa nghiệm thu trực tiếp trên Vercel; kiểm thử này không phải kiểm thử trình duyệt toàn tuyến. Build có cảnh báo kích thước gói JavaScript lớn, không phải lỗi.

Backend: 57 kiểm tra, gồm SQL Server cục bộ độc lập và cạnh tranh đặt lịch/ngừng ca. Tài liệu đầy đủ trong kho FoMed-API: `docs/fm-02-reception-doctor-schedules.md`.

Nghiệm thu thủ công sau triển khai: đăng nhập lễ tân → mở Lịch bác sĩ → thêm ca demo → kiểm tra giờ ở màn hình đặt lịch → đặt một lịch demo → thử thu hẹp/ngừng ca và kiểm tra bị chặn → kiểm tra lịch nghỉ → xác nhận bệnh nhân không mở được màn hình này.

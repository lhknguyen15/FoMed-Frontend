# Mở tiếp lượt đang khám

## Thay đổi

- `/doctor/queue` có khối **Đang khám** riêng, nằm trên danh sách bệnh nhân đang chờ.
- Khối này tải `GET /api/appointments/doctor-in-progress`. API chỉ cho role Doctor, xác định bác sĩ từ tài khoản đăng nhập; không nhận doctorId từ client.
- Chỉ lấy bệnh án chưa chốt có lịch hẹn InProgress và cùng bác sĩ phụ trách ở cả lịch hẹn/bệnh án. Gồm hồ sơ ngày trước, không phụ thuộc bộ lọc ngày của hàng chờ; sắp xếp lịch cũ trước để tránh bỏ quên.
- **Tiếp tục khám** chỉ điều hướng `/doctor/exam/{medicalRecordId}` để tải bệnh án đã lưu, không gọi API tạo bệnh án, không đổi trạng thái hoặc số thứ tự.
- API hàng chờ và chức năng bắt đầu khám giữ nguyên. Làm mới cập nhật cả hai khối; tải lỗi có cảnh báo và nút thử lại, không trình bày như danh sách trống.
- Sau khi chốt, bệnh án không còn trong danh sách đang khám ở lần tải tiếp theo. Nếu hồ sơ thay đổi giữa lúc tải danh sách và bấm mở, trang khám vẫn dùng API quyền/khóa bệnh án hiện có.
- Bố cục xếp dọc và nút rộng trên mobile; chia hàng trên desktop. Không sửa vấn đề lịch sử khám trong thay đổi này.

Không cần migration SQL. Backend cloud phải được deploy phiên bản mới trước khi frontend sử dụng endpoint này. API local đang chạy trước khi sửa cần khởi động lại để nạp mã mới. Chưa commit/push/deploy.

## Kiểm thử ngày 06/10/2026

- `dotnet run --project tests/DoctorResume -c DoctorResumeAudit`: **17/17 đạt**, dùng EF InMemory, không đọc cấu hình bí mật, không kết nối SQL local/Azure. Kiểm tra lọc quyền sở hữu, bác sĩ khác/không có hồ sơ/inactive, bệnh án ngày trước, ID hiện có, fresh DbContext mô phỏng request mới, dữ liệu nháp không đổi, loại bỏ sau khi chốt, danh sách trống, hàng chờ giữ nguyên và attribute role của endpoint.
- `node tests/doctor-resume.audit.cjs`: **8/8 đạt**, kiểm tra component render dữ liệu, loading/error/empty, nút tiếp tục, CSS responsive, tên bệnh nhân được escape.
- `npm run build`: TypeScript/Vite đạt; còn cảnh báo bundle lớn đã có, không phải lỗi build.
- ESLint đạt trên các file API/type/component/page được sửa.
- Kiểm tra trình duyệt bằng `tests/fixtures/doctor-resume.html`: desktop và mobile 390px, điều hướng record ID 101, trạng thái lỗi và phục hồi qua nút thử lại. Fixture chỉ dùng dữ liệu giả trong bộ nhớ frontend, không gọi API/database và không thay đổi phiên thật. Ảnh local trong `dist/review-doctor-resume/`.

Giới hạn: InMemory không kiểm chứng SQL Server translation/constraints; attribute kiểm tra role không thay cho HTTP authorization E2E. Chưa kiểm thử lại Render vì endpoint mới chưa push/deploy, không tạo thêm hồ sơ demo trên Azure. Cần kiểm thử một lượt đang khám trên bản triển khai mới sau khi deploy. Các lỗi lịch sử khám/tab Sắp tới/badge trong `CLOUD-WORKFLOW-AUDIT.md` vẫn là việc riêng.

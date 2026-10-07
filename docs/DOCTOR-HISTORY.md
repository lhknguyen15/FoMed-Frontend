# Lịch sử khám trong màn hình bác sĩ

Ngày 06/10/2026. Đã sửa code local; chưa commit/push/deploy hoặc kiểm thử lại endpoint trên Render.

## Nguyên nhân và thay đổi

Trang khám trước đây ưu tiên `recentHistory` trong navigation state; khi tải lại thì lấy trang đầu của danh sách bệnh án toàn bác sĩ rồi lọc bệnh nhân ở frontend. Những lần khám nằm ngoài trang đầu bị bỏ sót.

- Bổ sung `GET /api/clinical/records/{id}/history`. Server xác định bệnh nhân từ bệnh án đang mở, không nhận patientId/doctorId từ client.
- Chỉ bác sĩ đang hoạt động, có role Doctor và phụ trách bệnh án/lịch hẹn tương ứng được truy cập. Context bệnh án/lịch hẹn không khớp bị từ chối.
- Lọc đúng bệnh nhân **trước** khi lấy tối đa 5 mục: bệnh án đã chốt, lịch hẹn Completed và ngày khám trước lượt hiện tại; không bao gồm lượt hiện tại, bản nháp, lịch hủy hoặc lần khám tương lai.
- Sắp xếp theo ngày khám của lịch hẹn giảm dần, sau đó ID bệnh án giảm dần để ổn định khi cùng thời điểm. Bao gồm tóm tắt lần khám trước của bác sĩ khác trong context bệnh nhân được phân công; không cấp quyền mở chi tiết bệnh án của bác sĩ khác.
- Hàng chờ và endpoint lịch sử dùng chung tiêu chí `MedicalRecordHistoryQuery`.
- Ghi nhật ký Read cho từng bệnh án lịch sử trả về, source `RecordHistory`; metadata không sao chép chẩn đoán/ghi chú. UI nhật ký dịch source thành “Xem lịch sử khám trong bệnh án”.
- Trang khám chỉ lấy lịch sử từ API theo record ID, không dựa vào navigation state hay `clinicalApi.records(1)`. Dữ liệu query được gắn record ID để không hiện lịch sử cũ khi đổi bệnh án.
- Component phân biệt đang tải, tải lỗi kèm nút thử lại và chưa có lần khám trước. Ghi chú xuống dòng trên màn hình hẹp.

Đây là **tóm tắt 5 lần khám trước**, chưa phải màn hình tra cứu toàn bộ lịch sử có phân trang. Không thay đổi thao tác lưu/chốt bệnh án, sinh hiệu, chỉ định hoặc kê đơn.

## Kiểm chứng đã chạy

- Backend `tests/DoctorHistory`: 27 kiểm tra đạt. Database InMemory với dữ liệu giả; kiểm tra scope bệnh nhân, giới hạn/thứ tự, quyền truy cập, audit, lịch sử trống, context không khớp, queue preview và request mới. Kiểm tra dịch LINQ sang SQL Server bằng `ToQueryString()` **không mở kết nối SQL**.
- Frontend `tests/doctor-history.audit.cjs`: 10 kiểm tra render đạt; trạng thái tải/lỗi/trống, thứ tự, ngày hiển thị, xuống dòng và escape nội dung.
- Hồi quy mục 1: backend DoctorResume 17 kiểm tra đạt; component tiếp tục khám 8 kiểm tra đạt.
- Frontend production build và lint các file ứng dụng liên quan đạt.
- Skill computer-use kiểm tra component trong AppShell bằng fixture cô lập, desktop và mobile 390×844: 5 mục hiển thị, tải lại, lỗi/thử lại, trạng thái trống; không tràn ngang trên mobile. Fixture không gọi API, không dùng phiên đăng nhập hay ghi dữ liệu database. Ảnh ở `dist/review-doctor-history/` là artifact local, không commit.

Các kiểm tra này **không thay thế kiểm thử HTTP/UI với API đã deploy**, không xác nhận hiệu năng SQL thực tế. Không thay đổi dữ liệu local/Azure hoặc cấu hình cloud.

## Chạy lại

Từ thư mục gốc FoMed, dùng configuration riêng để không đụng DLL Debug của API đang chạy:

```powershell
dotnet run --project tests/DoctorHistory -c DoctorHistoryAudit
dotnet run --project tests/DoctorResume -c DoctorResumeAudit
```

Từ FoMed-Frontend:

```powershell
node tests/doctor-history.audit.cjs
node tests/doctor-resume.audit.cjs
npm run build
```

Fixture giao diện: chạy Vite và mở `/tests/fixtures/doctor-history.html`. Fixture chỉ kiểm tra component, không mô phỏng toàn bộ trang khám hay luồng API.

## Khi triển khai

Không cần SQL migration. Phải deploy API mới trước khi dùng frontend mới với Render (cả endpoint tiếp tục khám của mục 1 và endpoint lịch sử của mục 2). Không dùng fallback danh sách bệnh án trang đầu khi endpoint chưa deploy.

Sau deploy: với bệnh án demo bác sĩ phụ trách, so sánh lịch sử từ hàng chờ → trang khám, tải lại và mở trực tiếp cùng record ID; kiểm tra tài khoản bác sĩ khác bị từ chối. Nếu có dưới 5 lần khám **đã chốt trước lượt hiện tại**, hiển thị ít hơn 5 là đúng nghiệp vụ. GET có thể ghi nhật ký truy cập, nhưng không được tạo/sửa dữ liệu lâm sàng hay thanh toán.

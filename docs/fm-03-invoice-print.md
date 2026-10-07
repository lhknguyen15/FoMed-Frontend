# FM-03 — Trang xem trước và in hóa đơn

**Thu ngân → Chi tiết hóa đơn → In hóa đơn** mở `/reception/cashier/{invoiceId}/print`, không in toàn bộ màn hình làm việc. Quyền truy cập giữ trong nhóm `Receptionist`/`Admin`.

Mẫu có tên/mã bệnh nhân, ngày lập, chi tiết phí, khoản thu đã lưu, số dư và trạng thái. Tiền khách đưa/tiền thừa tách riêng; giao dịch SePay Test có cảnh báo mô phỏng rõ ràng. Hóa đơn hủy không yêu cầu thu tiền; hóa đơn chưa trả đủ không xác nhận đã thu đủ. Thiếu dữ liệu hoặc số tiền không khớp sẽ khóa nút in và hướng dẫn tải lại.

Trên trang xem trước có Về thu ngân, Tải lại, In hóa đơn. Có thể Lưu thành PDF trong cửa sổ in của trình duyệt, nhưng chưa có chức năng tải PDF trực tiếp. Không tự in khi vừa mở trang; không thu/hủy hóa đơn bằng trang in.

CSS dùng trang in A4 có tên riêng, ẩn thanh công cụ/thông báo nổi, cho phép xuống dòng và lặp tiêu đề bảng. Không ảnh hưởng quy tắc in đơn thuốc. Chưa xác minh ngắt trang bằng trình duyệt/máy in thật.

API cần ba trường bổ sung trên hóa đơn: `patientName`, `patientCode`, `createdAt` (UTC). Triển khai API trước frontend; không cần migration. Giá và mô tả dùng khoản mục đã lưu, không tính lại từ danh mục hiện tại. Tên bệnh nhân ưu tiên tên lưu lúc lập; hóa đơn cũ không có tên riêng dùng tên hiện tại. Trang là ảnh chụp tại thời điểm tải, không tự cập nhật giao dịch mới của thiết bị khác.

```powershell
node tests/invoice-print.audit.cjs
node tests/cashier-paid-state.audit.cjs
node tests/sepay-success.audit.cjs
node tests/invoice-filters.audit.cjs
node tests/user-messages.audit.cjs
npm run lint
npm run build
```

64 kiểm tra frontend mới với dữ liệu giả; backend có 38 kiểm tra mới trong bộ nhớ/SQL cục bộ. Các kiểm tra này không phải nghiệm thu Vercel hay in vật lý.

Nghiệm thu tiếp: xem A4 trên trình duyệt với hóa đơn ngắn/nhiều trang, font tiếng Việt, logo, mô tả dài; kiểm tra chưa thu/thu một phần/đã hủy/miễn phí/mô phỏng; lưu PDF từ hộp thoại in và kiểm tra đầy đủ trang. Không dùng dữ liệu bệnh nhân thật.

Tài liệu đầy đủ: `docs/fm-03-invoice-print.md` trong kho FoMed-API. Thay đổi chưa commit/push/triển khai.

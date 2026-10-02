# Màn hình lễ tân và API FoMed

Tài liệu này đối chiếu workflow VC-07 đến VC-11 trong review-erd-net06 với các endpoint đang có trong FoMed-API. Giao diện lễ tân dùng chung `AppShell`, `Card`, `PageTitle`, `Button`, `Badge` và thông báo trạng thái thành công/lỗi.

## Luồng thao tác chuẩn

1. Vào **Đặt lịch tại quầy**, tìm bệnh nhân theo tên, số điện thoại hoặc mã bệnh nhân.
2. Nếu chưa có hồ sơ, chọn **Tạo nhanh hồ sơ** ngay trên trang đặt lịch. Modal VC-09 chỉ yêu cầu họ tên và số điện thoại; sau khi xác nhận, bệnh nhân được chọn ngay trong lịch đặt.
3. Chọn chuyên khoa, bác sĩ, dịch vụ, ngày và slot trống; sau đó chọn **Đặt lịch**.
4. Màn hình **Hồ sơ bệnh nhân** dùng cho tra cứu/cập nhật độc lập. Khi đã chọn một bệnh nhân, nút **Đặt lịch** sẽ chuyển sang đặt lịch với bệnh nhân đó.

Hồ sơ tạo nhanh dùng `POST /api/patients/staff`, không có `UserId` nên được xác định là khách vãng lai/chưa có tài khoản. Nút **Tạo hồ sơ mới** ở VC-08 vẫn mở form đầy đủ để quản lý hồ sơ lâu dài. Nút điều hướng `/reception` chỉ dùng để theo dõi lịch hẹn và check-in; không lặp lại nút tạo hồ sơ. Sidebar dùng trạng thái active chính xác để không đồng thời tô sáng `/reception` và `/reception/patients`.

## VC-07 — Bàn tiếp đón / lịch hẹn trong ngày

- UI: `/reception`
- API: `GET /api/appointments/staff-appointments?date={yyyy-MM-dd}&status=&doctorId=`
- Check-in: `PUT /api/appointments/{id}/check-in`, body tùy chọn `{ reason }`
- Không đến: `PUT /api/appointments/{id}/no-show`, body tùy chọn `{ reason }`
- Điều hướng: tạo bệnh nhân mới tại `/reception/patients`, đặt lịch hộ tại `/reception/booking`, hàng chờ tại `/reception/queue`.

Review có thể biểu diễn lịch hẹn bằng endpoint tổng quát và PATCH; FoMed-API thực tế dùng endpoint staff riêng và PUT. UI hiển thị trạng thái theo response, đồng thời chặn thao tác không phù hợp với trạng thái hiện tại.

## VC-08 — Hồ sơ bệnh nhân

- UI: `/reception/patients`
- Tìm kiếm: `GET /api/patients/staff?phone=&name=&patientCode=&page=&pageSize=`
- Xem chi tiết: `GET /api/patients/staff/{id}`
- Tạo walk-in: `POST /api/patients/staff`
- Cập nhật: `PUT /api/patients/staff/{id}`
- Lịch sử khám: `GET /api/patients/staff/{id}/history`

Review có phần quản lý dị ứng riêng. API hiện tại chỉ có trường `Allergies` trong hồ sơ bệnh nhân, chưa có endpoint CRUD dị ứng; form vì vậy lưu thông tin dị ứng cùng hồ sơ và không giả lập endpoint chưa tồn tại.

## VC-09 — Đặt lịch hộ

- UI: `/reception/booking`
- Danh mục: `GET /api/specialties`, `GET /api/doctors`, `GET /api/services`
- Khung giờ: `GET /api/appointments/available-slots?doctorId=&date=&serviceId=`
- Đặt lịch: `POST /api/appointments/staff-book` với `{ patientId, doctorId, startTime, serviceId?, source, reason? }`

Nguồn đặt lịch được giữ theo contract API: `1` là điện thoại, `2` là khách đến trực tiếp. Sau thao tác, UI thông báo mã lịch hẹn trả về từ server.

## VC-10 — Hàng chờ

- UI: `/reception/queue`
- Danh sách: `GET /api/appointments/waiting-queue?date=&doctorId=`
- Gọi số tiếp theo: `POST /api/appointments/call-next?date=&doctorId=`
- Chuyển cuối hàng: `PUT /api/appointments/{id}/move-to-end`, body `{ reason? }`

Review có thể gọi nút là “Gọi lại số”. FoMed-API hiện cung cấp `call-next` để ghi nhận lượt gọi tiếp theo và không có endpoint “recall” độc lập, nên UI dùng nhãn trung thực “Gọi số tiếp theo”.

## VC-11 — Thu ngân

- UI: `/reception/cashier/:invoiceId`
- Hóa đơn: `GET /api/invoices/{id}`
- Ghi nhận thanh toán: `POST /api/invoices/{id}/payments` với `{ amount, method, note? }`
- Hủy hóa đơn: `POST /api/invoices/{id}/cancel` với `{ reason? }`
- In: dùng hộp thoại in của trình duyệt.

FoMed-API hiện **không có** `GET /api/invoices/{id}/pdf`, endpoint tải file đính kèm, hoặc nghiệp vụ hoàn tiền. Vì vậy nút xuất PDF được hiển thị vô hiệu hóa kèm giải thích, còn hoàn tiền chưa được giả lập bằng một API khác. API thanh toán chỉ nhận khoản tiền dương và cho phép ghi nhận nhiều lần đến đủ tổng tiền.

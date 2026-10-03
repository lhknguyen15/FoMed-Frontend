# Workflow VC-12 đến VC-15

| Màn hình | API chính | Luồng thành công | Luồng lỗi cần hiển thị |
| --- | --- | --- | --- |
| `/doctor/queue` (VC-12) | `GET /appointments/doctor-queue?date=`; `POST /clinical/appointments/{appointmentId}/record`; `POST /appointments/call-next` | Bác sĩ xem đúng hàng chờ theo token, gọi lượt hoặc bắt đầu khám. Tạo bệnh án chuyển lịch hẹn sang `InProgress`. | Chưa check-in (`409`), không có quyền (`403`), hàng chờ rỗng (`404`). |
| `/doctor/exam/:recordId` (VC-13) | `GET/PUT /clinical/records/{id}`; `PUT /appointments/{appointmentId}/complete` | Lưu sinh hiệu, ICD-10, chẩn đoán, hướng điều trị, ngày tái khám; hoàn tất để chốt bệnh án. | Thiếu chẩn đoán, còn chỉ định pending, bệnh án đã chốt, sai người phụ trách. |
| `/doctor/exam/:recordId/services` (VC-14) | `GET /clinical/records/{id}/services`; `GET /clinical/services?page=`; `POST /clinical/records/{id}/services`; `PUT /clinical/orders/{id}/cancel` | Tạo chỉ định với số lượng/giá snapshot; chỉ định `Ordered` được hủy có xác nhận; kết quả do kỹ thuật viên trả về sẽ hiển thị lại; `Completed` được giữ để tính phí. | Không thể hủy chỉ định đã có kết quả; bệnh án đã chốt; dịch vụ không tồn tại. API hiện chưa có endpoint attachment. |
| `/doctor/exam/:recordId/prescription` (VC-15) | `GET/POST/PUT /clinical/records/{id}/prescription`; `GET /clinical/medicines?page=` | Tạo/cập nhật đơn nháp, lưu số lượng, liều dùng, hướng dẫn và xác nhận dị ứng. | Thuốc inactive/không tồn tại, thiếu dòng thuốc, chưa xác nhận dị ứng, bệnh án đã chốt. |
| `/technician/orders` (phần VC-14) | `GET /clinical/lab-orders?page=`; `POST /clinical/lab-orders/{id}/result` | Kỹ thuật viên nhận chỉ định pending, nhập kết quả/kết luận/khoảng tham chiếu; chỉ định chuyển `Completed`. | Chỉ định đã hoàn tất/hủy, thiếu kết quả, không đúng role Technician. |

## Trạng thái nghiệp vụ

- `Confirmed` + `CheckedInAt` → bác sĩ được tạo bệnh án → `InProgress`.
- Chỉ định dịch vụ: `0 Pending`, `1 Completed`, `2 Canceled`.
- Chỉ hoàn tất lượt khám khi chẩn đoán đã nhập và không còn chỉ định `Pending`.
- Sau `isFinalized = true`, API từ chối sửa bệnh án, đơn thuốc và chỉ định.

## Kiểm tra VC-14: chỉ định, hóa đơn và tệp đính kèm

- Khi tạo chỉ định, `ClinicalService.OrderServiceAsync` lưu `UnitPriceSnapshot = service.Price`; frontend hiển thị giá snapshot, không lấy lại giá catalog để tính phí.
- Chỉ lập hóa đơn khi cuộc hẹn đã `Completed` và không còn service order `status = 0`; các order `status = 1` mới được thêm vào invoice item. Vì thao tác hoàn tất lượt khám đồng thời chốt bệnh án (`isFinalized`), điều kiện “Completed và bệnh án được chốt” đang được API đảm bảo theo workflow.
- Chỉ `status = 0` (`Ordered`) mới được hủy. `status = 1` (`Completed`) không thể hủy và vẫn được tính phí; `status = 2` (`Canceled`) không được đưa vào hóa đơn.
- `FoMed-API` hiện có bảng `clinical.attachments` nhưng chưa có controller/service endpoint upload, download hoặc list attachment. UI chỉ hiển thị định dạng dự kiến `jpg`, `png`, `pdf`, `dicom` và trạng thái chờ API; chưa coi đây là chức năng upload đã hoàn tất.

Các page chỉ gửi dữ liệu qua API FoMed, không dùng record/queue mẫu để thay thế dữ liệu thật.

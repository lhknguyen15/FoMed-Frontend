# Đối chiếu màn hình bệnh nhân với FoMed API

Nguồn UI/workflow: `review-erd-net06`, nhóm Vitalis VC-03 đến VC-06. Frontend ưu tiên contract thực tế trong `FoMed-API`; không gọi endpoint chỉ tồn tại trong bản review.

| Màn hình | Hành động theo review | Endpoint FoMed-API sử dụng | Trạng thái |
| --- | --- | --- | --- |
| `/booking` | Tải chuyên khoa | `GET /api/specialties` | Có |
| `/booking` | Tải bác sĩ theo chuyên khoa | `GET /api/doctors?specialtyId=` | Có |
| `/booking` | Lấy slot trống | `GET /api/appointments/available-slots?doctorId=&date=&serviceId=` | Có; khác URL review |
| `/booking` | Đặt lịch | `POST /api/appointments/book` | Có; khác URL review |
| `/booking` | Hiển thị thẻ BHYT | `GET /api/patient/me` | Có; BHYT không gửi trong request đặt lịch |
| `/my-appointments` | Danh sách, lọc trạng thái | `GET /api/appointments/my-appointments?date=&status=` | Có; API chưa hỗ trợ page |
| `/my-appointments` | Hủy lịch | `PUT /api/appointments/{id}/cancel` | Có; review mô tả PATCH |
| `/my-appointments` | Đổi giờ | `PUT /api/appointments/{id}/reschedule` | Có; review mô tả PATCH |
| `/my-appointments` | Chọn slot đổi giờ | `GET /api/appointments/available-slots` | Có |
| `/my-records` | Danh sách bệnh án đã chốt | `GET /api/clinical/records?page=` | Có; khác URL review |
| `/my-records` | Xem đơn thuốc | `GET /api/clinical/records/{id}/prescription` | Có |
| `/my-records` | Xem chỉ định/kết quả CLS | `GET /api/clinical/records/{id}/services` | Có |
| `/my-records` | Tải file đính kèm | — | FoMed-API chưa có attachment/download endpoint |
| `/my-invoices` | Danh sách hóa đơn | `GET /api/invoices?page=` | Có; khác URL review |
| `/my-invoices` | Chi tiết hóa đơn | `GET /api/invoices/{id}` | Có; list hiện đã trả đủ chi tiết |
| `/my-invoices` | Tải hóa đơn PDF | — | FoMed-API chưa có `/api/invoices/{id}/pdf` |

## Khoảng trống contract cần bổ sung ở backend

- Appointment list chưa có phân trang server-side hoặc tổng số bản ghi.
- Invoice DTO chưa có ngày tạo và số tiền bảo hiểm, nên UI chưa thể hiển thị hai cột này như VC-06.
- Chưa có endpoint xuất hóa đơn PDF.
- Chưa có attachment metadata/download cho kết quả cận lâm sàng.

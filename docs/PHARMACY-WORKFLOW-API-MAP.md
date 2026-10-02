# Workflow VC-16 đến VC-18

| Màn hình | API | Chức năng UI |
| --- | --- | --- |
| `/pharmacy/dispense` | `POST /pharmacy/prescriptions/{id}/dispense` | Nhập mã đơn, phát thuốc theo FEFO, hiển thị các lô đã xuất và xử lý idempotent khi bấm lại. |
| `/pharmacy/inventory` | `GET /pharmacy/inventory`; `POST /pharmacy/inventory/receipts`; `POST /pharmacy/inventory/adjustments`; `GET /pharmacy/inventory/{batchId}/transactions` | Lọc thuốc/hạn dùng, phân trang 50 lô, nhập lô nhanh, điều chỉnh tồn có lý do, xem thẻ kho. |
| `/pharmacy/receipt` | `POST /pharmacy/receipts` | Tạo phiếu nhập nhiều dòng gồm nhà cung cấp, số chứng từ, thuốc, số lô, hạn dùng, số lượng và giá nhập. |

## Quy tắc API được phản ánh trên UI

- Chỉ `Pharmacist` hoặc `Admin` được thao tác các endpoint nhà thuốc.
- Không nhập lô có hạn dùng đã qua ngày hiện tại.
- Không trùng thuốc + số lô trong cùng phiếu nhập.
- Điều chỉnh tồn bắt buộc có lý do và không được tạo tồn âm.
- Phát thuốc tự chọn các lô còn hạn theo FEFO; gọi lại API sau khi đã phát đủ không trừ kho lần hai.

FoMed-API hiện không có endpoint tìm kiếm danh sách đơn thuốc dành cho dược sĩ, vì vậy màn hình phát thuốc dùng mã đơn thuốc và gọi trực tiếp endpoint phát theo đúng hợp đồng API.

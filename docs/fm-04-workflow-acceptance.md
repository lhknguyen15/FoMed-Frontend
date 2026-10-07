# FM-04 — Nghiệm thu quy trình FoMed

Ngày kiểm tra: **07/10/2026**. Phần tự động cục bộ đã đạt; **chưa nghiệm thu giao
diện toàn luồng trên Vercel/Render**. Chưa commit/push/deploy hoặc ghi dữ liệu Azure.

FoMed-API đạt 321 kiểm tra HTTP/JWT/SQL toàn quy trình và 129 kiểm tra SePay giả.
Kiểm tra thuốc/lịch mới, bác sĩ nhận kết quả rồi sửa đơn, dữ liệu in hóa đơn,
thu tiền mặt, phát thuốc, quyền truy cập và báo cáo đều đạt trong lượt chạy cuối.
Các lỗi ở fixture/helper trung gian đã sửa rồi chạy lại, không gộp vào lượt đạt.

Frontend đạt **264 kiểm tra React ngoại tuyến**:

| Bộ kiểm thử | Số kiểm tra đạt |
| --- | --- |
| Danh mục thuốc | 38 |
| Lịch bác sĩ của lễ tân | 44 |
| In hóa đơn | 64 |
| Kết quả chỉ định/lọc | 24 |
| Thu ngân đã thanh toán | 32 |
| Thông báo SePay thành công | 22 |
| Lọc hóa đơn | 16 |
| Thông báo cho người dùng | 24 |

```powershell
node tests/medicine-catalog.audit.cjs
node tests/reception-schedules.audit.cjs
node tests/invoice-print.audit.cjs
node tests/service-order-results.audit.cjs
node tests/cashier-paid-state.audit.cjs
node tests/sepay-success.audit.cjs
node tests/invoice-filters.audit.cjs
node tests/user-messages.audit.cjs
npm run lint
npm run build
```

Lint, TypeScript và Vite đạt; còn cảnh báo gói JavaScript trên 500 KB.
Kiểm thử React không mở trình duyệt, không gọi API thật, không chứng minh layout
desktop/mobile, hộp thoại in hoặc luồng click-through trên bản triển khai.

## Danh sách nghiệm thu thủ công còn mở

- [ ] Một lượt đặt online và một lượt lễ tân tạo tại quầy → hàng chờ → bác sĩ khám.
- [ ] Chỉ định → kỹ thuật viên trả kết quả → bác sĩ thấy kết quả và thông báo đúng
  một lần → kê đơn/chốt; tải lại vẫn giữ đúng trạng thái.
- [ ] Tiền mặt: số tiền thu/tiền khách đưa/tiền thừa đúng, reload và thử lại không
  thu trùng; dược sĩ cấp thuốc, kiểm tra tồn và lịch sử bệnh nhân.
- [ ] SePay Test: hiện kết quả thành công trong cửa sổ thanh toán, không phải tự
  đóng màn hình chờ; phát lại không thu thêm. Không chuyển tiền thật.
- [ ] In hóa đơn A4 nhiều trang/tiếng Việt, không menu/form, không cắt hàng;
  bản lưu PDF và dấu mô phỏng đúng. Xem [FM-03](fm-03-invoice-print.md).
- [ ] Phân quyền, đường dẫn sâu, hết phiên, mất mạng, mobile, bàn phím và thông báo.
- [ ] Báo cáo/công nợ khớp đúng lượt demo; không tính tiền khách đưa thành doanh thu.

Chỉ dùng dữ liệu giả và ghi các mã liên quan để đối chiếu. Thực hiện sau khi người
dùng quyết định triển khai API mới trước rồi frontend; chưa tạo dữ liệu mới trên
cloud trong bước này. Bản public hiện tại không được mặc nhiên coi đã có FM-01/02/03.

Chi tiết fixture, lệnh SQL/HTTP, kết quả hồi quy và bảo vệ database nằm tại
`docs/fm-04-workflow-acceptance.md` trong repository FoMed-API. Công cụ trình duyệt
không khả dụng theo chính sách phiên làm việc nên phần browser E2E/visual còn mở.
Bước phát triển tiếp theo là FM-05; không đóng nghiệm thu thủ công FM-04 chỉ vì
kiểm thử cục bộ đã đạt.

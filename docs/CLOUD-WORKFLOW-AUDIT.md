# Kiểm thử workflow trên Render và Azure SQL

Ngày: 06/10/2026 (Asia/Saigon).

## Phạm vi và kết quả

Frontend local dùng proxy HTTPS đến `https://fomed-api.onrender.com`; backend thao tác trên Azure `FoMedDbDemo`. Đây không phải kiểm thử API/database local. Chạy qua UI bằng các tài khoản demo bệnh nhân, lễ tân, bác sĩ, kỹ thuật viên và quản trị; không sửa mã nghiệp vụ trong lượt kiểm thử này.

Đã thực hiện một hành trình từ đặt lịch đến thu tiền mặt demo. Kiểm tra đọc lại API trước thanh toán: **18 đạt, 0 lỗi**; sau thanh toán: **19 đạt, 0 lỗi**. Hai lần kiểm tra là hai trạng thái của cùng một hồ sơ, không phải 37 workflow độc lập. Không kết luận toàn bộ dự án đã đạt mọi tình huống.

## Dữ liệu demo đã tạo và giữ lại

Marker: `[DEMO-CLOUD-20261006-1300]`. Nội dung khám, kết quả và đơn thuốc ghi rõ là dữ liệu giả, không có giá trị điều trị.

| Đối tượng | Mã/ID |
| --- | --- |
| Lịch hẹn | AP0000000659, 06/10/2026 13:30–14:00, BS Phạm Văn An |
| Bệnh nhân demo | patient01, patientId 1006 |
| Bệnh án | medicalRecordId 1004 |
| Chỉ định công thức máu | orderId 1005, Completed, snapshot 120.000đ |
| Chỉ định ECG | orderId 1006, Canceled, snapshot 90.000đ |
| Đơn thuốc | prescriptionId 1003, Paracetamol 500mg, 2 × 1.000đ |
| Hóa đơn | invoiceId 185, HD0000000203 |
| Thanh toán tiền mặt demo | paymentId 1007 |

Mã lịch hẹn/hóa đơn sinh theo sequence **không phải row ID**; script lấy appointmentId từ bệnh án, không suy ra từ mã hiển thị.

## Các bước đã kiểm tra

1. Bệnh nhân đặt lịch còn trống; lịch chuyển Pending và khung giờ đã chọn không còn trong danh sách khả dụng.
2. Lễ tân thấy lịch trong ngày, xác nhận rồi check-in; số thứ tự 1 được lưu.
3. Bác sĩ bắt đầu khám, lưu triệu chứng/chẩn đoán demo và sinh hiệu: huyết áp 120/80, mạch 72, nhiệt độ 36,5, cân nặng 65kg, chiều cao 170cm. Đọc lại đủ sáu giá trị.
4. Tạo hai chỉ định Ordered với giá snapshot. Hủy ECG khi còn Ordered, giữ lịch sử Canceled. Bệnh án không chốt được khi xét nghiệm công thức máu vẫn đang chờ.
5. Kỹ thuật viên nhập/lưu kết quả công thức máu; chỉ định chuyển Completed, biến mất khỏi danh sách chờ và hiện trong lịch sử kết quả. Bác sĩ đọc được kết quả, chỉ định Completed không còn nút hủy.
6. Lưu đơn thuốc demo; nút In đơn được bật. Không in thực tế, không cấp phát thuốc.
7. Chốt bệnh án thành công sau khi các chỉ định được xử lý. Tải lại: bệnh án đã khóa, lịch hẹn Completed. Bệnh án không có trong danh sách chờ lập hóa đơn trước khi chốt; có sau khi chốt.
8. Lập hóa đơn: phí khám 150.000đ + xét nghiệm Completed 120.000đ + thuốc 2.000đ = **272.000đ**. ECG đã hủy không lên hóa đơn. Trước thu tiền: doanh thu thực thu 0đ, công nợ 272.000đ.
9. Nhập `150000` được hiểu là 150.000đ, không phải 150đ; UI cảnh báo chưa đủ và khóa xác nhận thu. Nhập `300000` hiển thị 300.000đ, tiền thừa 28.000đ.
10. Sau khi người dùng cho phép rõ ràng, ghi nhận **một** khoản thu tiền mặt giả: amount 272.000đ, cashReceived 300.000đ, changeAmount 28.000đ. Tải lại UI và API: đúng một payment, có người thu và idempotencyKey; paidAmount 272.000đ, remainingAmount 0đ. Đây chỉ là ghi nhận demo, không chuyển tiền thật và không gọi SePay. Không thử gửi lại POST thanh toán để kiểm chứng chống trùng.
11. Bệnh nhân xem được bệnh án đã chốt, kết quả, đơn thuốc và chi tiết hóa đơn với lịch sử tiền khách đưa/tiền thừa. Tài khoản patient02 bị API từ chối đọc bệnh án và hóa đơn của patient01 (403).
12. Dashboard có 1 lượt hoàn thành, đã thu 272.000đ, công nợ 0đ. Báo cáo lọc riêng ngày 06/10 và bác sĩ Phạm Văn An: 1 lượt, 1 hoàn thành, hóa đơn 272.000đ, thực thu 272.000đ, công nợ 0đ, không đến 0%. Nhật ký API có sự kiện Finalize của bệnh án 1004.

## Vấn đề cần xử lý tiếp

### Ưu tiên cao: mở tiếp lượt đang khám

Đã bổ sung code API và UI local ngày 06/10/2026, xem `DOCTOR-RESUME.md` và các kiểm thử cô lập. Chưa commit/push/deploy hoặc xác nhận lại trên Render; mô tả dưới đây là hiện trạng đã quan sát ở bản cloud trước thay đổi.

Sau khi bắt đầu khám và đăng nhập lại, `/doctor/queue` trống mặc dù bệnh án 1004 chưa chốt. Để tiếp tục test phải mở đường dẫn bệnh án đã biết. `AppointmentRepository.GetDoctorQueueAsync` chỉ lấy Confirmed đã check-in; `DoctorQueuePage` chưa có danh sách/đường dẫn tiếp tục các lượt InProgress. Cần bổ sung luồng “Đang khám → Tiếp tục khám”, không mở rộng danh sách chờ theo cách cho phép bắt đầu lại cùng một lượt.

### Lịch sử khám không nhất quán khi tải lại

Đã sửa code API và UI local ngày 06/10/2026, xem `DOCTOR-HISTORY.md`: truy vấn lịch sử từ bệnh án được phân công, lọc đúng bệnh nhân trước khi lấy tối đa 5 lần khám đã chốt trước lượt hiện tại, kiểm soát quyền và audit. Kiểm thử cô lập đạt; chưa commit/push/deploy hoặc xác nhận lại trên Render. Mô tả dưới đây là hiện trạng cloud đã quan sát trước thay đổi.

Đi từ hàng chờ có 5 mục lịch sử, nhưng mở trực tiếp/tải lại bệnh án chỉ còn 1 mục trong lần kiểm thử. `DoctorExamPage` dùng history từ navigation state hoặc lấy `clinicalApi.records(1)` rồi mới lọc patientId ở frontend. Cách lọc trên một trang có thể bỏ sót lịch sử bệnh nhân. Cần truy vấn lịch sử theo bệnh nhân ở server, có kiểm soát quyền, không phụ thuộc navigation state.

### Các điểm UI khác

- Tab “Sắp tới” của bệnh nhân vẫn chứa lịch Pending/Confirmed trong tháng 9. `MyAppointmentsPage` hiện lọc theo status, không theo thời gian; cần quyết định cách hiển thị lịch quá hạn/chưa xử lý.
- Badge sidebar hàng chờ 6/lịch hẹn 2 không khớp dữ liệu thực tế trong phiên thử; cần bỏ số cứng hoặc nối số liệu phù hợp.
- Chi tiết bệnh án bệnh nhân còn nhãn kỹ thuật `MEDICAL_RECORDS`, `PRESCRIPTION_ITEMS`, `LAB_RESULTS`; khối đầu hiển thị nhiều lần khám dù đang mở chi tiết một hồ sơ. Cần rà lại bố cục và nhãn nghiệp vụ.
- Cloud đang tắt lưu file lâm sàng nhưng UI vẫn có điều khiển file. Cần hiển thị khả năng sử dụng rõ ràng hoặc triển khai lưu trữ bền vững trước khi mở upload.
- Đăng nhập UI lần đầu có một lần chờ lâu rồi báo “Có lỗi khi xử lý yêu cầu”; thử lại thành công, các bước sau hoạt động. Chưa đủ chứng cứ để quy nguyên nhân cho cold start hay database; cần đối chiếu Render logs. Không có thay đổi mã để che lỗi.

## Chưa kiểm thử

- Dược sĩ/cấp phát và trừ tồn kho: snapshot cloud không có tài khoản demo dược sĩ riêng. Không dùng tài khoản cá nhân đa vai trò và không tự cấp thêm quyền. Đơn 1003 chưa cấp phát.
- Upload/download file: cloud tắt chức năng lưu file; chưa kiểm tra các định dạng hoặc lưu trữ trên Render.
- In thực tế/PDF, xuất CSV, các ca dị ứng có cảnh báo, hoàn tiền/thu một phần và tranh chấp đồng thời.
- SePay/webhook/chuyển khoản thật: không nằm trong lượt thu tiền mặt demo này.

## Chạy kiểm tra đọc lại

Từ thư mục `FoMed-Frontend`:

```powershell
$demoPassword = Read-Host 'Mat khau cac tai khoan demo' -AsSecureString
./tests/cloud-workflow.verify.ps1 -DemoPassword $demoPassword -Stage Settled
$demoPassword = $null
```

Script cố định hồ sơ demo nêu trên; chỉ POST đăng nhập và GET kiểm tra, không tạo/sửa/xóa dữ liệu lâm sàng hoặc thanh toán. Đăng nhập tạo phiên xác thực; GET bệnh án có thể tạo nhật ký truy cập theo nghiệp vụ. Nếu dữ liệu đã thay đổi, assertion có thể không còn đạt. Không chạy Stage Unpaid sau khi hóa đơn đã thu.

Ảnh bằng chứng ở `dist/review-cloud-workflow/` (artifact local, không commit). Dữ liệu demo cloud được giữ lại; không reset/xóa database, không thay đổi dữ liệu local, tài khoản/vai trò/mật khẩu, cấu hình cloud, hoặc dùng tài khoản SQL admin trong lượt này. Chưa commit/push.

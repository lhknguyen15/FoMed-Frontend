# Điều hướng thu ngân và cập nhật trạng thái tại quầy

Ngày thực hiện: 08/10/2026. Đã sửa code frontend và kiểm thử tự động cục bộ;
chưa triển khai hoặc nghiệm thu trực quan trên Vercel.

## Quay lại danh sách hóa đơn

- Trang chi tiết có nút **Về danh sách hóa đơn**, kể cả lúc đang tải hoặc tải lỗi.
  Nút tạm khóa khi thao tác ghi nhận thanh toán/hủy hóa đơn đang gửi.
- Khi mở từ danh sách, giữ tab, từ khóa, trạng thái, khoảng ngày và số trang.
  Ngữ cảnh nằm trong query `returnTo`, vẫn giữ khi tải lại trang hoặc đi qua trang in.
- Mở trực tiếp một hóa đơn thì trở về `/reception/cashier`. Không dựa vào lịch sử
  trình duyệt có thể dẫn sang trang khác; chỉ chấp nhận đường dẫn danh sách nội bộ.
- Nút quay lại không hủy hóa đơn hoặc yêu cầu chuyển khoản. Luồng thu tiền,
  chống ghi nhận trùng và kết quả SePay không thay đổi.

## Bệnh nhân sau khi được gọi

Backend hiện có hai thao tác khác nhau, không đổi trong lần sửa này:

- **Gọi bệnh nhân tiếp theo**: ghi nhận lần gọi, chưa chuyển sang đang khám.
- **Bắt đầu khám**: tạo bệnh án và chuyển lịch hẹn sang đang khám. API hàng chờ
  chỉ trả lịch đã tiếp đón và còn chờ, nên bệnh nhân đã bắt đầu khám không còn ở đó.

Tại quầy, hàng chờ loại bệnh nhân theo kết quả API mới; số đếm hàng chờ thay đổi
theo. Danh sách lịch hẹn trong ngày vẫn giữ tên với trạng thái **Đang khám**, sau
đó **Đã khám xong**, để lễ tân theo dõi toàn bộ lượt khám, không xóa lịch hẹn.
Trang lịch hẹn bổ sung tổng số đang khám và nút Làm mới.

## Cách cập nhật

- Chỉ opt-in ở trang hàng chờ và lịch hẹn lễ tân, đọc lại sau mỗi 15 giây kể từ
  lần đọc hoàn tất; không phải cập nhật tức thời bằng socket.
- Ngừng lịch đọc tự động khi tab ẩn; đọc khi quay lại tab/tiêu điểm. Một lần đọc
  đang chạy có thể hoàn tất sau khi tab bị ẩn, không tạo lần đọc mới ở tab ẩn.
- Không gửi chồng request. Khi đang đọc mà có yêu cầu làm mới sau thao tác,
  gộp thành một lần đọc tiếp để đối chiếu dữ liệu mới.
- Tạm dừng đọc tự động khi gửi thao tác hoặc đang mở xác nhận tại trang lịch hẹn.
  Các bản nháp/đối tượng đang chọn không được thay bằng dữ liệu polling.
- Đổi ngày/bác sĩ hoặc rời trang sẽ hủy request cũ và dọn timer/listener.
  Phản hồi cũ không được thay danh sách của bộ lọc mới.
- Đọc nền không thay toàn bộ bảng bằng spinner. Khi tải lỗi thì bỏ dữ liệu/thao
  tác cũ, không hiển thị danh sách rỗng hoặc số 0 như đã xác nhận thành công.
- Lỗi liên tiếp có thời gian chờ tăng dần và dừng tự động sau ba lần. 401/403 dừng
  ngay; 429 tuân thủ thời gian chờ, kể cả khi bấm làm mới. Có nút thử lại thủ công.
- Polling chỉ GET danh sách; không tự gọi số, tiếp đón, tạo hóa đơn hoặc thu tiền.
  `useApiQuery` và các trang khác không bị đổi sang polling chung.

## Kiểm thử

```powershell
node tests/reception-flow.audit.cjs
node tests/invoice-filters.audit.cjs
node tests/invoice-print.audit.cjs
node tests/navigation-counts.audit.cjs
node tests/cashier-paid-state.audit.cjs
node tests/sepay-success.audit.cjs
node tests/user-messages.audit.cjs
node tests/auth-rate-limit.audit.cjs
node tests/reception-schedules.audit.cjs
npm run lint
npm run build
```

49 kiểm tra mới đạt: hook thật với timer/HTTP tổng hợp, render/handler trang thật;
kiểm tra đường dẫn trả về an toàn, reload/in, trạng thái chờ/đang khám, tab ẩn,
pause, single-flight, phản hồi chậm, lỗi mạng, 429, hết phiên và dọn tài nguyên.
Các bộ hồi quy liên quan đạt; lint/TypeScript/Vite đạt. Còn cảnh báo bundle
JavaScript trên 500 KB, không phải lỗi build.

Không dùng trình duyệt, dữ liệu bệnh nhân thật, Azure hoặc SePay trong kiểm thử
lần này. Chưa coi các kiểm tra tổng hợp là nghiệm thu thực tế trên cloud.

## Kiểm tra thủ công còn lại

1. Mở hóa đơn từ danh sách trang 2 có bộ lọc, quay lại và kiểm tra bộ lọc còn nguyên;
   làm tương tự sau khi reload và mở trang in.
2. Mở hàng chờ lễ tân và bác sĩ ở hai phiên đăng nhập demo riêng. Bấm gọi: bệnh
   nhân vẫn chờ. Bấm bắt đầu khám: sau lần đọc tiếp ở quầy, bệnh nhân rời hàng chờ;
   danh sách lịch hẹn vẫn còn tên với trạng thái đang khám.
3. Hoàn tất lượt khám: danh sách lịch hẹn đổi thành đã khám xong. Đổi bộ lọc, ẩn
   tab/quay lại, thử mất mạng và xác nhận không còn hiển thị hành động cũ khi tải lỗi.

Chỉ thử thao tác thay đổi trên dữ liệu demo được cho phép. Lượt sửa này không thay
đổi backend, database/schema, cấu hình cloud hoặc trạng thái của lịch hẹn thật.

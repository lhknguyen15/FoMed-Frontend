# SePay trên màn hình thu ngân

## Luồng UI

Tại `/reception/cashier/:invoiceId`, chọn **Chuyển khoản** → **Tạo mã QR SePay**. Frontend gọi `POST /api/invoices/{id}/sepay/payment-requests` không gửi body, không gửi số tiền hay tài khoản do người dùng nhập. API tính số dư và dùng lại yêu cầu Pending còn hiệu lực.

Modal cùng phong cách hệ thống, responsive, cuộn bên trong, focus trap của native dialog, Escape để đóng. Hiển thị số tiền, ngân hàng/chủ tài khoản, số tài khoản, nội dung chuyển khoản, thời hạn và sao chép. Không có nút “đã chuyển” hoặc “xác nhận thu” thủ công cho SePay.

- **Test:** cảnh báo không chuyển tiền thật; không tải/hiển thị ảnh QR. Dùng code và amount để mô phỏng trên dashboard SePay Test mode.
- **Live:** chỉ hiển thị QR khi URL HTTPS `vietqr.app/img` khớp chính xác tài khoản, ngân hàng, số tiền và nội dung từ response đã kiểm tra. Lỗi tải ảnh không biến thành thành công.
- Modal GET trạng thái ngay khi mở, sau đó mỗi 3 giây sau response Pending (không chồng request). Timeout 15 giây; đóng/unmount hủy request và timer. Không POST lại tự động.
- Paid: tự thay nội dung chờ QR bằng màn hình kết quả **Thanh toán thành công** ngay trong dialog, không đợi người dùng đóng QR để nhìn thấy thông báo phía sau. Test ghi rõ **Thanh toán mô phỏng thành công**, không có tiền thật được chuyển. Hiển thị mã hóa đơn/số tiền đã ghi nhận, bỏ QR, countdown, số tài khoản, nội dung và hướng dẫn chuyển tiền. Chuyển focus đến tiêu đề kết quả, cuộn dialog về đầu; không tự tắt thông báo trước khi người dùng đọc.
- Hóa đơn được tải lại ngay khi nhận Paid, không phụ thuộc nút đóng. Nút **Xem hóa đơn** chỉ đóng màn hình kết quả để xem số đã thu/công nợ/lịch sử, không gửi xác nhận thu. Sau tải hóa đơn, focus chuyển về thông báo thành công còn lưu trên trang. Lịch sử hiển thị nguồn SePay và mã giao dịch, không giả người thu.
- InvoiceSettled: hóa đơn được thu qua luồng khác, không diễn giải là SePay đã thu. InvoiceCancelled/Expired/Superseded: ngừng poll, không cho sử dụng QR.
- ReviewRequired: cảnh báo không thu lại, khóa thao tác thu/hủy **trong màn hình hiện tại**. Đây không phải cơ chế phân quyền hoặc mở khóa ở backend. Reload không thay thế nghiệp vụ đối soát; API tạo QR vẫn từ chối khi có yêu cầu cần đối soát. Hiện chưa có UI/API giải quyết đối soát hoặc hoàn tiền.
- Mất mạng/response bất thường: ngừng poll, ẩn QR và khóa sao chép thông tin để chuyển; cho phép **Kiểm tra lại trạng thái**, chỉ GET. Không báo thu thành công. Countdown client chỉ ẩn hướng dẫn khi hết giờ, không tự kết luận thanh toán.
- Đóng modal không hủy yêu cầu ngân hàng. Nếu khách đã chuyển thì kiểm tra/đối soát trước khi thu theo phương thức khác. Mở lại chủ động gọi POST; backend quyết định dùng lại hoặc thay yêu cầu, frontend không tự đổi code.

Thu tiền mặt và tính tiền thừa giữ nguyên; thẻ/ví điện tử giữ luồng ghi nhận hiện tại. Thanh toán một phần không được đưa vào UI. Module bệnh nhân chưa bổ sung nút thanh toán SePay; component lịch sử chung đã nhận trường nguồn giao dịch.

## Cấu hình trước khi dùng

Frontend không cần SePay Secret Key hoặc API Key; chỉ gọi FoMed-API qua cấu hình/proxy đang có. Không đặt secret vào `VITE_*`, source hoặc browser storage.

Backend mặc định tắt. Chuẩn bị **database chỉ chứa dữ liệu giả**, xác nhận `SePay:TestDatabaseName` khớp tên DB thực tế, áp dụng migration cash/SePay, cấu hình tài khoản Test mode và secret HMAC riêng qua User Secrets/environment. Có thể dùng FoMedDb khi toàn bộ dữ liệu đã được xác nhận là demo; tên DB không tự chứng minh dữ liệu giả. Xem [hướng dẫn backend](../../docs/sepay-integration.md) và [Render + Azure SQL](../../docs/deploy-render-azure.md) ở workspace FoMed; các tài liệu này không được đóng gói trong repo frontend độc lập.

Webhook cần URL HTTPS công khai trỏ đến backend `/api/webhooks/sepay`, không phải localhost/frontend. Luồng demo hiện dùng backend Render và Azure SQL, không dùng tunnel local. Nút tạo QR báo lỗi cấu hình từ API nếu SePay chưa bật. Thay đổi giao diện local không đồng nghĩa backend/frontend cloud đã được deploy lại.

## Kiểm thử

Chạy Vite ở cổng kiểm thử local, không dùng API thật:

```powershell
node node_modules/vite/bin/vite.js --configLoader runner --host 127.0.0.1 --port 5186 --strictPort
node tests/sepay-payment.audit.cjs
node tests/cashier-money-input.audit.cjs
```

Nếu Playwright nằm ở cache, đặt `PLAYWRIGHT_MODULE` đến package đã cài. Script chặn **toàn bộ** API và QR bên ngoài; clipboard cũng được giả lập. Không tạo giao dịch/ngân hàng/payment thật. JSON và ảnh kiểm thử tại `dist/sepay-ui-audit/` và `dist/money-input-audit/`, được ignore.

Lượt triển khai này: **186 assertions / 36 ca SePay UI** đạt trên desktop 1440px/mobile 390px. Regression thu tiền đạt **542 assertions / 128 ca**; chuyển khoản không còn nằm trong nhóm xác nhận thủ công của script tiền mặt mà được kiểm tra bằng suite SePay riêng. TypeScript, ESLint và build đạt; build còn cảnh báo bundle lớn hơn 500 kB, chưa tách chunk trong phạm vi này.

Kiểm tra tạo chủ động, busy/không gửi client amount, Pending → Paid, các trạng thái kết thúc, 503/409, mất mạng/retry GET, đóng/dừng poll/mở lại, response sai/thông tin thay đổi bất thường, ảnh QR lỗi, countdown, focus và responsive. Không thay thế nghiệm thu webhook từ SePay, ứng dụng ngân hàng đọc QR, thiết bị mobile thật hoặc vận hành Live.

### Bổ sung thông báo thành công — 06/10/2026

Các số liệu 186/542 ở trên là kết quả lượt trước, không phải toàn bộ suite được chạy lại trong lượt sửa thông báo này.

- `node tests/sepay-success.audit.cjs`: **22 kiểm tra** render tĩnh và kiểm tra phản hồi, bao gồm Paid Test/Live, thông tin chuyển tiền bị loại khỏi kết quả, accessible status, escape mã hóa đơn, terminal khác không giả thành công và Paid sai dữ liệu bị từ chối. Không kiểm thử polling bằng render tĩnh.
- `tests/fixtures/sepay-success.html?case=paid`: trang độc lập dùng **ReceptionCashierPage, SePayPaymentModal và hook polling thật**, nhưng các hàm API được thay bằng dữ liệu trong RAM trước khi mount. `fetch` bị chặn; Test không tải QR bên ngoài. Không dùng phiên đăng nhập, không gọi Render/Azure/SePay, không ghi database.
- Đã kiểm tra qua trình duyệt: Pending → Paid không bấm đóng, tự tải hóa đơn/lịch sử/công nợ; lỗi mạng → GET retry → Paid không tạo thêm yêu cầu; ReviewRequired, InvoiceSettled, Expired và Paid không hợp lệ không báo thành công; đóng Pending không ghi thu và dừng polling; mở với Paid có sẵn không GET thêm; Pending → Paid trên mobile 390px. Desktop 1280px và mobile không tràn ngang màn hình kết quả; focus đặt ở tiêu đề và về thông báo trên hóa đơn khi chọn Xem hóa đơn. **9 kịch bản trình duyệt cô lập**, không phải 9 giao dịch cloud.
- Case fixture: `paid`, `retry`, `review`, `settled`, `expired`, `invalid`, `pending`, `initial-paid`. Chọn Chuyển khoản → Tạo mã QR SePay trên dữ liệu DEMO. Các case terminal tự trả kết quả sau lượt đọc thứ hai; `retry` trả kết quả sau nút kiểm tra lại, không POST yêu cầu mới.
- TypeScript/build và lint các file liên quan đạt. Lint toàn dự án còn 3 lỗi fast-refresh trong fixture cũ doctor-history/doctor-resume/user-messages, không phải lỗi mới của luồng SePay. Build còn cảnh báo chunk lớn hơn 500 kB.
- Chưa commit/push/deploy; chưa nghiệm thu lại webhook cloud với thay đổi thông báo này. Phần form bị khóa đã được thay trong lượt hoàn thiện hóa đơn đã thanh toán bên dưới.

### Hóa đơn đã thanh toán — 06/10/2026

- Trang thu ngân thay toàn bộ form thu bằng khối **Đã thanh toán**, số tiền đã thu và hướng dẫn xem lịch sử/in hóa đơn. Không còn chọn phương thức, nhập tiền khách đưa/ghi chú, tạo QR, xác nhận thu hoặc hủy hóa đơn đã thu đủ.
- Khối này dựa vào hóa đơn tải từ API: đúng ID, trạng thái đã thanh toán, tổng tiền/số đã thu hữu hạn và không âm, số đã thu không thấp hơn tổng tiền, số dư 0. Số dư 0 một mình hoặc thông báo từ modal không đủ để kết luận hóa đơn đã thanh toán.
- Giữ lịch sử SePay/Test và tiền mặt, bao gồm tiền khách đưa/tiền thừa/người thu. Giữ nút In hóa đơn; Xuất PDF vẫn chưa khả dụng. Không thêm thao tác hoàn tiền hoặc xác nhận SePay thủ công.
- Form của hóa đơn chưa thanh toán/còn công nợ, hóa đơn đã hủy và cảnh báo/khóa cần đối soát trong màn hình hiện tại giữ nguyên. Không thêm cơ chế mở khóa đối soát khi tải lại.
- `node tests/cashier-paid-state.audit.cjs`: **32 kiểm tra** render trang thu ngân thật với snapshot truy vấn trong RAM (API không được gọi). Kiểm tra form biến mất, lịch sử/in còn, mở lại trạng thái đã thu, tiền mặt, còn nợ, đã hủy, số dư 0 chưa xác nhận, dữ liệu lệch/không hợp lệ, loading/error. Chạy lại `node tests/sepay-success.audit.cjs`: **22 kiểm tra** đạt.
- Bổ sung fixture `sepay-success.html` với `paid-reload`, `cash-reload`, `cash`, `partial`, `cancelled`, `zero-open`. Case `cash` chỉ ghi khoản thu giả trong RAM với đúng 261.000đ/tiền khách đưa 300.000đ; không gọi backend. Toàn bộ `fetch` tiếp tục bị chặn.
- **10 kịch bản trình duyệt cô lập** đã kiểm tra trong lượt này: hóa đơn SePay đã thu mở/tải lại desktop; Pending → Paid desktop; thu tiền mặt desktop; công nợ một phần; đã hủy; số dư 0 chưa xác nhận; ReviewRequired khóa form; hóa đơn SePay đã thu mobile; tiền mặt mở/tải lại mobile; Pending → Paid mobile. Mobile 390px không tràn ngang; focus trở về thông báo sau Xem hóa đơn. Không gọi Render/Azure/SePay, không ghi khoản thu cloud.
- Build, lint trang/fixture sửa và typecheck fixture đạt; build vẫn cảnh báo chunk lớn hơn 500 kB. Các script Playwright tiền mặt/SePay cũ đã cập nhật kỳ vọng form bị loại bỏ thay vì chỉ disabled và kiểm tra cú pháp, **chưa chạy lại toàn bộ suite 186/542** trong lượt này.
- Chưa commit/push/deploy. Còn nghiệm thu với webhook SePay Test và bản triển khai thực tế.

### Nghiệm thu frontend local với SePay Test — 06/10/2026

- HD000170 được người dùng cho phép mô phỏng 211.500đ. Dialog xác nhận Test, QR bị ẩn; người dùng thực hiện mô phỏng trên SePay, không chuyển tiền thật.
- Quan sát trực tiếp: thông báo **Thanh toán mô phỏng thành công** tự hiện trong dialog, đúng hóa đơn/số tiền. Xem hóa đơn chỉ mở phần hóa đơn, không xác nhận thu thủ công.
- Tải lại dữ liệu: đã thu 211.500đ, còn phải thu 0đ, khoản thu 1009/giao dịch SePay 36423. Form thu và nút QR/hủy không còn; lịch sử và nút In hóa đơn vẫn có.
- Sau người dùng báo phát lại, tải lại FoMed vẫn chỉ thấy một khoản thu 1009, tiền không tăng. Chưa có bằng chứng độc lập về lần gửi lại báo HTTP 200 trong nhật ký SePay; nghiệm thu chống trùng qua lần gửi lại thực tế còn cần xác nhận này.
- Chạy lại 22 kiểm tra thông báo và 32 kiểm tra hóa đơn đã thu đạt; build đạt, lint riêng billing/thu ngân/fixture SePay đạt. Lint toàn dự án vẫn còn 3 lỗi fast-refresh trong fixture doctor-history/doctor-resume/user-messages; không chạy lại toàn bộ suite trình duyệt 186/542 trong đợt rà soát này.
- Đây là frontend local sử dụng backend hiện tại, không chứng minh frontend/backend có thay đổi mới đã deploy. Chưa commit/push/deploy hoặc bật Live.

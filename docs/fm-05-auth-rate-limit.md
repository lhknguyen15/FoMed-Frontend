# FM-05 — Thông báo giới hạn đăng nhập/đăng ký

Ngày thực hiện: 07/10/2026. Hoàn thành code và kiểm thử cục bộ giai đoạn 1;
chưa triển khai hay nghiệm thu trực quan trên Vercel.

## Hành vi giao diện

- Khi login/register nhận HTTP 429, hiển thị thông báo Sonner một lần và lỗi tại
  form bằng tiếng Việt có dấu: “Bạn thao tác quá nhanh. Vui lòng chờ … giây rồi thử lại.”
- Khóa nút gửi, hiển thị đếm ngược; giữ dữ liệu đang nhập và cho phép chỉnh sửa.
  Handler cũng chặn gửi trong thời gian chờ và chặn gửi đồng thời.
- Hết thời gian chờ chỉ mở nút, **không tự đăng nhập/đăng ký lại**. Không refresh JWT
  vì 429; các lỗi 401/403 giữ cách xử lý cũ, không bị coi là giới hạn tần suất.
- Đọc `Retry-After` dạng số giây hoặc HTTP-date, sau đó mới dùng trường
  `retryAfterSeconds`; chỉ nhận thời gian trong 1–86400 giây. Khi metadata thiếu/sai,
  giao diện chờ 60 giây. Không hiển thị nguyên văn thông tin chẩn đoán từ server.
- Timer được dọn khi rời trang; tính bằng thời gian thực đã trôi qua. Rời/tải lại
  trang có thể xóa bộ đếm giao diện, **không xóa hạn mức trên server**.

Shared HTTP client áp thông báo 429 an toàn cho request/download. Chỉ trang đăng
nhập và đăng ký dùng cooldown mới; không thay đổi thao tác thu tiền, khám hay SePay.

## Hợp đồng với API

API trả HTTP 429, `Retry-After`, `Cache-Control: no-store` và body có
`statusCode`, `retryAfterSeconds`, `message`. CORS phải expose `Retry-After` cho
origin frontend đã cho phép. Không có API mới, migration hay biến Vite mới.

Mặc định API: login 10 yêu cầu/60 giây/IP đã xác minh, register 5/600 giây/IP;
đồng thời có hạn mức chung mỗi tiến trình là login 200/60 giây, register 50/60 giây.
**Trên Render chưa xác minh ingress proxy, chế độ Auto chỉ bật hạn mức chung;
chưa bật quota theo từng IP khách.** Không lấy tùy ý `X-Forwarded-For` và không dùng
dải IP outbound mở firewall Azure làm danh sách ingress proxy tin cậy.

Chi tiết cấu hình, giới hạn vận hành và runner API nằm trong repo FoMed-API,
`docs/fm-05-auth-rate-limit.md`. Bộ đếm API nằm trong bộ nhớ, độc lập mỗi instance,
không thay thế chống DDoS hoặc chống dò mật khẩu theo tài khoản.

## Kiểm thử

Trong repo frontend:

```powershell
node tests/auth-rate-limit.audit.cjs
npm run lint
npm run build
```

45 kiểm tra React/HTTP tổng hợp mới và 264 kiểm tra hồi quy đạt. Kiểm tra metadata,
thông báo, giữ dữ liệu, đếm ngược, dọn timer, gửi đồng thời và không tự retry.
Lint/TypeScript/Vite đạt; còn cảnh báo bundle JavaScript trên 500 KB.
Đây không phải browser E2E hoặc bằng chứng nghiệm thu Render/Vercel.

Backend đạt 93 kiểm tra middleware/proxy và 12 kiểm tra API/SQL giới hạn;
hồi quy 321 quy trình, 129 SePay mô phỏng, 51 SQL. Chỉ dùng dữ liệu tạm localhost,
không ghi Azure hoặc chuyển tiền thật.

Sau khi triển khai theo quyết định của người dùng, cần kiểm tra thủ công với dữ
liệu demo: form bị giới hạn giữ dữ liệu, thông báo có dấu, đếm ngược/mở nút đúng;
đăng nhập bình thường vẫn hoạt động. Không flood production để kiểm thử.

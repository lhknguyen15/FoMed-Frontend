# Triển khai FoMed-Frontend trên Vercel

## Phạm vi

Frontend React + Vite được phục vụ dưới dạng trang tĩnh. FoMed-API vẫn chạy
trên Render và database vẫn ở Azure SQL. Cấu hình trong repository không tự
tạo project Vercel hoặc thay đổi môi trường backend.

Chỉ dùng dữ liệu giả cho bản demo công khai. Vercel Hobby dành cho mục đích cá
nhân, phi thương mại; cần đánh giá lại gói dịch vụ và bảo mật trước khi vận hành
phòng khám thật. Không bật thanh toán thật trong quy trình triển khai demo này.

## Tạo project

1. Trong tài khoản Vercel Hobby, chọn **Add New → Project**, import repository
   GitHub `lhknguyen15/FoMed-Frontend`.
2. Chọn framework **Vite**, Root Directory là gốc repository (`.`), không phải
   thư mục `FoMed-Frontend` bên trong repository. Đây là repository frontend độc lập.
3. Bản chuẩn bị được push trên nhánh `nguyen`. Đảm bảo deployment lấy đúng nhánh
   và commit mới nhất; nếu dùng `main`, phải merge trước. Cấu hình Production Branch
   theo nhánh đã chọn; deployment nhánh khác có thể chỉ là Preview.
4. `vercel.json` đặt Install Command `npm ci`, Build Command
   `npm run lint && npm run build`, Output Directory `dist`.
5. Trước khi build, thêm Environment Variable:

   ```text
   VITE_API_URL=https://fomed-api.onrender.com/api
   ```

   Áp dụng cho Production; chỉ áp dụng Preview nếu muốn Preview dùng chung
   backend demo. Không thêm dấu `/` cuối giá trị. Vite nhúng giá trị vào bản build,
   nên đổi biến cần redeploy. Không đưa SQL password, JWT key hoặc SePay secret/API
   key vào `VITE_*`, source hay `vercel.json`.
6. Deploy, ghi nhận URL frontend ổn định được Vercel cấp.

`VITE_API_PROXY_TARGET` và proxy `/api` trong `vite.config.ts` chỉ phục vụ Vite dev
server; chúng không chuyển tiếp API trong bản deploy tĩnh. Thiếu `VITE_API_URL`
khi build sẽ khiến ứng dụng gọi `/api` trên frontend thay vì FoMed-API.

## Cho phép frontend kết nối FoMed-API

Trong Render → FoMed-API → Environment, giữ các origin hiện có và thêm biến
`Cors__AllowedOrigins__N` tại chỉ số chưa sử dụng, với giá trị là origin frontend
chính xác, ví dụ `https://<ten-project>.vercel.app`.

Không dùng wildcard, không có đường dẫn hay dấu `/` cuối. Sau đó lưu và triển khai
lại API. Nếu dùng Preview, URL Preview khác origin Production và phải được cho
phép riêng nếu cần; không mở CORS cho toàn bộ `*.vercel.app`.

Không đổi JWT key, SQL credentials hoặc cấu hình SePay chỉ để frontend kết nối.
Webhook SePay vẫn gửi đến backend Render `/api/webhooks/sepay`, không đến Vercel.

## Kiểm tra sau deploy

- Xác nhận commit và nhánh thực tế của deployment đúng phiên bản dự định.
- Mở trang chủ; kiểm tra logo, danh sách bác sĩ/chuyên khoa/dịch vụ và các tệp CSS/JS.
- Mở trực tiếp rồi tải lại `/login`, `/doctors`, `/specialties` và một đường dẫn
  workspace theo quyền tài khoản demo. Rewrite trong `vercel.json` phục vụ
  `/index.html` cho React Router, tránh 404 khi tải lại đường dẫn sâu.
- Kiểm tra yêu cầu API đi đến HTTPS Render, không phải localhost hay `/api` của Vercel;
  kiểm tra đăng nhập và đăng xuất bằng tài khoản demo, không gửi mật khẩu vào chat.
- Kiểm tra quyền giữa các vai trò. Chỉ kiểm thử ghi hồ sơ hoặc thanh toán mô phỏng
  trên dữ liệu demo với phạm vi đã được chủ dự án cho phép.
- Render Free có thể thức dậy chậm sau khi không hoạt động. Giao diện tải được
  không đồng nghĩa API/database đã sẵn sàng.

Lint/build và bài kiểm tra cấu hình ngoại tuyến không thay thế việc nghiệm thu
đường dẫn, CORS hoặc nghiệp vụ trên deployment Vercel thực tế.

## Tham khảo

- [Vite trên Vercel và cấu hình SPA](https://vercel.com/docs/frameworks/frontend/vite)
- [Cấu hình vercel.json](https://vercel.com/docs/project-configuration/vercel-json)
- [Điều kiện Vercel Hobby](https://vercel.com/docs/plans/hobby)

# FoMed-Frontend

Giao diện của **FoMed — hệ thống quản lý phòng khám**, xây dựng bằng React và
TypeScript, kết nối FoMed-API cho quy trình đặt lịch, khám bệnh, kho thuốc và thu ngân.
Đây là repository frontend độc lập; backend được quản lý riêng.

- Website demo: [fo-med-frontend.vercel.app](https://fo-med-frontend.vercel.app/)
- Frontend: [FoMed-Frontend](https://github.com/lhknguyen15/FoMed-Frontend)
- Backend: [FoMed-API](https://github.com/lhknguyen15/FoMed-API)
- API demo: [fomed-api.onrender.com](https://fomed-api.onrender.com/health)

Bản công khai chỉ dùng dữ liệu giả. **Không nhập hồ sơ bệnh nhân thật hoặc chuyển
tiền thật để thử demo.** Dữ liệu nghiệp vụ được lưu ở database phía API, không nằm
trong bản build frontend.

## Chức năng

### Trang công khai

- Trang chủ, danh sách chuyên khoa, bác sĩ và dịch vụ từ API.
- Hồ sơ bác sĩ với ảnh, giới thiệu, năm hành nghề và phí khám.
- Tìm bác sĩ, chọn lịch và chuyển vào luồng đặt khám sau đăng nhập.
- Menu “Đặt khám theo”, danh sách trượt ngang và giao diện thích ứng màn hình nhỏ.
- Tư vấn trực tuyến và tin tức y tế hiện dẫn tới trang **chức năng đang phát triển**.

### Không gian theo vai trò

| Vai trò | Chức năng |
| --- | --- |
| Bệnh nhân | Đặt/hủy lịch, lịch hẹn, hồ sơ khám, hóa đơn và hồ sơ cá nhân |
| Lễ tân | Tiếp đón, hồ sơ bệnh nhân, đặt lịch tại quầy, hàng chờ, hóa đơn và thu ngân |
| Bác sĩ | Hàng chờ, khám/tiếp tục khám, lịch sử bệnh án, chỉ định, kê đơn và hồ sơ bác sĩ |
| Kỹ thuật viên | Danh sách chỉ định và trả kết quả cận lâm sàng |
| Dược sĩ | Tồn kho, lô thuốc, nhập kho và cấp phát thuốc |
| Quản trị | Tổng quan, bác sĩ/chuyên khoa/dịch vụ, lịch làm việc/nghỉ, người dùng/vai trò, báo cáo và nhật ký |

Đăng nhập, đăng ký bệnh nhân, refresh phiên, đổi mật khẩu và các màn nghiệp vụ
đã kết nối API. Tài khoản có nhiều vai trò có thể chuyển không gian làm việc.
Frontend kiểm tra quyền điều hướng; API vẫn chịu trách nhiệm xác thực và phân quyền dữ liệu.

Thông báo thao tác dùng **Sonner**; lỗi nhập liệu, cảnh báo nghiệp vụ và trạng thái
thanh toán cần theo dõi vẫn hiển thị tại vị trí liên quan, không chỉ trong thông báo tạm.

### Phần chưa hoàn thiện/giới hạn

- Quên mật khẩu có màn tiếp nhận yêu cầu nhưng backend **chưa hoàn thiện gửi email
  và đặt lại mật khẩu qua token**. Không coi thông báo tiếp nhận là email đã được gửi.
- Thu ngân tích hợp SePay: tạo yêu cầu, theo dõi trạng thái, hiển thị kết quả và lịch
  sử thu. Bản demo dùng **Test**; hash/secret/API key của SePay không đặt ở frontend.
- Tệp bệnh án phụ thuộc lưu trữ phía backend. Render demo hiện tắt kho đính kèm local;
  không coi lỗi tính năng này là lý do lưu tệp nhạy cảm vào frontend.
- Một số chức năng phụ, gồm xuất PDF hóa đơn và hoàn tiền, chưa hỗ trợ đầy đủ.
  Xem tài liệu từng quy trình; không coi mọi nút hiển thị là chức năng đã nghiệm thu.

## Công nghệ và cấu trúc

- React 19, TypeScript 5.8 và Vite 7.
- React Router 7 cho điều hướng và route theo vai trò.
- Tailwind CSS 4, Lucide React và Sonner.
- HTTP client dùng Fetch, JWT/refresh phiên và chuyển lỗi API thành thông báo phù hợp.
- Vercel phục vụ bản build tĩnh; Render và Azure SQL nằm phía backend.

```text
src/
  App.tsx                # Các route đang sử dụng
  cms/                   # Màn hình quản trị
  workspaces/            # Trang công khai, tài khoản và từng vai trò
  shared/                # HTTP client, kiểu dữ liệu, tiện ích dùng chung
  components/            # Thành phần giao diện dùng chung
  layouts/               # Bố cục trang
  routes/                # Kiểm tra đăng nhập và vai trò
public/                  # Logo, favicon và tài nguyên tĩnh
docs/                    # Hợp đồng giao diện/API và hướng dẫn triển khai
tests/                   # Kiểm tra cấu hình, thông báo, nghiệp vụ và fixtures
vercel.json              # Build và rewrite cho SPA
```

## Chạy trên máy

### 1. Cài dependencies

Dùng Node.js phù hợp Vite 7: **20.19+ hoặc 22.12+**, cùng npm và Git.

```powershell
git clone https://github.com/lhknguyen15/FoMed-Frontend.git
cd FoMed-Frontend
npm ci
Copy-Item .env.example .env.local
```

Đây là gốc repository frontend; không cần thư mục `FoMed-API` bên trong.
`npm ci` cài theo `package-lock.json` để môi trường nhất quán.

### 2. Cấu hình API

Nội dung `.env.local` khi dùng backend local với profile HTTP:

```env
VITE_API_URL=/api
VITE_API_PROXY_TARGET=http://localhost:5068
```

Khởi động backend theo [README FoMed-API](https://github.com/lhknguyen15/FoMed-API#chạy-trên-máy),
sau đó chạy frontend:

```powershell
npm run dev
```

Mở `http://localhost:5174`. Nếu cổng đã được dùng, xem địa chỉ Vite in trong terminal.
Nếu dùng backend HTTPS local, đổi proxy target thành `https://localhost:7239`.

Có thể dùng API demo cloud trong môi trường dev:

```env
VITE_API_URL=/api
VITE_API_PROXY_TARGET=https://fomed-api.onrender.com
```

Proxy target là **origin backend**, không thêm `/api`; HTTP client đã gửi đường dẫn
`/api/...`. Khởi động lại Vite sau khi đổi env. Khi dùng cloud, thao tác nghiệp vụ sẽ
ghi vào database demo trên Azure, không phải database local.

Không cần biến `VITE_USE_MOCK_DATA` để chạy các luồng nghiệp vụ hiện tại. Fixtures
kiểm thử không phải nguồn dữ liệu thay thế API trong bản deploy.

### 3. Kiểm tra và build

```powershell
npm run lint
npm run build
npm run preview
```

Bản build nằm trong `dist/`. `npm run preview` xem bản build trên máy và có thể kế
thừa proxy từ cấu hình Vite; đây không phải môi trường Vercel. Để kiểm tra cấu hình
gọi API cloud giống bản deploy, đặt URL API tuyệt đối trước khi build.

Một số kiểm tra ngoại tuyến có thể chạy trực tiếp:

```powershell
node tests/vercel-config.audit.cjs
node tests/public-navigation.audit.cjs
node tests/public-carousel.audit.cjs
node tests/user-messages.audit.cjs
node tests/sepay-success.audit.cjs
node tests/service-order-results.audit.cjs
node tests/invoice-filters.audit.cjs
```

Các kiểm tra này không thay thế nghiệm thu trên trình duyệt/API thật. Đọc hướng dẫn
trước khi chạy các script cloud hoặc workflow có thao tác ghi.

## Triển khai trên Vercel

Import repository **FoMed-Frontend**, chọn nhánh production đã merge (hiện dùng
`main`) và Root Directory `.`. `vercel.json` đã cấu hình:

| Cấu hình | Giá trị |
| --- | --- |
| Framework | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run lint && npm run build` |
| Output Directory | `dist` |
| SPA rewrite | Các đường dẫn frontend phục vụ `index.html` |

Đặt biến môi trường khi build:

```env
VITE_API_URL=https://fomed-api.onrender.com/api
```

`VITE_API_PROXY_TARGET` chỉ phục vụ Vite server cục bộ (dev/preview); Vercel không
chuyển tiếp `/api` qua proxy này. Biến `VITE_*` được nhúng vào JavaScript công khai: **không đặt mật khẩu,
SQL connection string, JWT signing key hoặc SePay secret/API key trong đó**.
Đổi `VITE_API_URL` cần build/deploy lại.

Ở Render, allowlist CORS phải chứa origin frontend chính xác
`https://fo-med-frontend.vercel.app`, không có `/` cuối. URL Preview khác origin
Production và cần được cho phép riêng nếu muốn gọi API; không mở wildcard cho mọi Vercel project.
Webhook SePay tiếp tục gửi thẳng đến backend `/api/webhooks/sepay`, không gửi đến Vercel.

Xem [hướng dẫn triển khai Vercel](docs/DEPLOY-VERCEL.md). Kiểm tra nhánh/commit thực tế
trên Dashboard; tài liệu này có ghi nhận giai đoạn chuẩn bị trên nhánh `nguyen`.

## Lưu ý khi dùng demo

- Đăng nhập bằng tài khoản của database API đang kết nối; không công khai mật khẩu.
- API/database demo có thể cần thời gian khởi động lại sau khi không hoạt động.
  Trang frontend tải được không đồng nghĩa database đã sẵn sàng.
- Thêm dữ liệu vào Azure chỉ cần tải lại danh sách; không cần deploy lại frontend.
- Nếu đổi API URL hoặc code, cần build/deploy lại và kiểm tra đường dẫn sâu như `/login`.
- QR Test không dùng để quét và chuyển tiền bằng tài khoản ngân hàng thật.

## Tài liệu

- [Cấu trúc frontend](docs/FRONTEND-STRUCTURE.md)
- [Trang chủ và danh mục công khai](docs/PUBLIC-HOME.md)
- [Thông báo Sonner](docs/NOTIFICATIONS.md)
- [Nội dung hiển thị cho người dùng](docs/USER-FACING-COPY.md)
- [Thu ngân SePay](docs/SEPAY-CASHIER.md)
- [Lịch sử khám](docs/DOCTOR-HISTORY.md)
- [Tiếp tục khám](docs/DOCTOR-RESUME.md)
- [Các điểm cần hoàn thiện](docs/FRONTEND-FOLLOW-UP.md)

Một số tài liệu lưu kết quả kiểm thử theo từng giai đoạn; đối chiếu source và bản
deploy hiện tại trước khi suy ra trạng thái toàn bộ hệ thống.

# FoMed Frontend

Frontend mới cho hệ thống quản lý phòng khám FoMed, xây dựng bằng Vite, React, TypeScript và Tailwind CSS.

## Chạy dự án

```bash
npm install
npm run dev
```

Ứng dụng chạy mặc định tại `http://localhost:5174`. Đăng nhập bằng tài khoản trong FoMed-API; tài khoản có nhiều role có thể chuyển không gian làm việc tại sidebar.

## Cấu hình API

Sao chép `.env.example` thành `.env` và cập nhật:

```env
VITE_API_URL=https://localhost:7001/api
VITE_USE_MOCK_DATA=true
```

Auth đã kết nối trực tiếp với FoMed-API qua Vite proxy trong môi trường development. Các workspace nghiệp vụ còn lại vẫn dùng dữ liệu trình diễn và sẽ được chuyển sang API thật theo từng module.

```env
VITE_API_URL=/api
VITE_API_PROXY_TARGET=https://localhost:7239
```

Chạy backend trước frontend:

```powershell
dotnet run --project ..\FoMed-API\FoMed.Api
npm run dev
```

## Auth đã triển khai

- Đăng nhập bằng `POST /api/auth/login`.
- Đăng ký Patient bằng `POST /api/auth/register`.
- Quên mật khẩu bằng `POST /api/auth/forgot-password`.
- Refresh phiên bằng `POST /api/auth/refresh`.
- Đổi mật khẩu bằng `PUT /api/profile/change-password`.
- Ghi nhớ đăng nhập, đăng xuất, `returnUrl` và phân quyền route theo role.

## Không gian nghiệp vụ

- Bệnh nhân: đặt lịch, lịch hẹn, hồ sơ sức khỏe, hóa đơn.
- Lễ tân: bàn tiếp đón, hồ sơ bệnh nhân, đặt lịch tại quầy, hàng chờ, thu ngân.
- Bác sĩ: hàng chờ, khám bệnh, chỉ định cận lâm sàng, kê đơn.
- Kỹ thuật viên: tiếp nhận chỉ định và trả kết quả.
- Dược sĩ: tồn kho, phát thuốc FEFO, nhập thuốc.
- Quản trị: bác sĩ, lịch làm việc, dịch vụ, người dùng, báo cáo, audit log.

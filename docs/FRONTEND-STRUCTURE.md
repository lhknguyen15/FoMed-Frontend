# FoMed Frontend structure

Đây là khung thư mục mục tiêu của frontend. Các file scaffold chỉ là placeholder và chưa chứa implementation.

## Phân vùng chính

```text
src/
├── app/           # Khởi tạo router, provider và query client
├── routes/        # Route guard, phân quyền và khai báo đường dẫn
├── layouts/       # Public, Auth, Patient, Workspace và CMS layout
├── workspaces/    # Page được tổ chức theo vai trò sử dụng
├── cms/           # Khu vực quản trị hệ thống dành cho Admin
├── features/      # API, hook, type, schema và component nghiệp vụ
├── shared/        # Hạ tầng và component dùng chung
├── assets/        # Logo, hình ảnh, font và illustration
└── styles/        # Global style và design tokens
```

## Workspace

```text
workspaces/
├── public/        # Khách chưa đăng nhập
├── patient/       # Bệnh nhân
├── reception/     # Lễ tân
├── doctor/        # Bác sĩ
├── technician/    # Kỹ thuật viên
└── pharmacy/      # Dược sĩ
```

Workspace chỉ ghép page và trình bày giao diện. Nghiệp vụ và API được đặt trong `features`.

## Admin CMS

```text
cms/
├── dashboard/
├── doctors/
├── specialties/
├── schedules/
├── time-off/
├── services/
├── users/
├── roles/
├── reports/
└── audit/
```

## Feature domains

```text
features/
├── auth/
├── profile/
├── catalogs/
├── appointments/
├── patients/
├── queue/
├── clinical/
├── laboratory/
├── prescriptions/
├── billing/
├── pharmacy/
├── doctors/
├── schedules/
├── reports/
└── audit/
```

Mỗi feature có thể chứa `api`, `hooks`, `components`, `schemas`, `types`, `mappers` và `constants` tùy nhu cầu thực tế.

## Quy ước phụ thuộc

```text
app/routes
    ↓
layouts/workspaces/cms
    ↓
features
    ↓
shared
```

- Page không gọi HTTP trực tiếp.
- Workspace không sở hữu API contract.
- Feature không phụ thuộc workspace hoặc CMS.
- Shared không chứa nghiệp vụ phòng khám.
- DTO frontend phải bám theo contract thực tế của `FoMed-API`.

## Prototype hiện tại

- `src/modules/auth` là vertical slice đầu tiên đã được triển khai đầy đủ UI, API, session và route guard.
- `src/workspaces/WorkspacePages.tsx` tạm thời chứa composition của các workspace đang hoạt động.
- `src/App.tsx`, `src/components` và `src/data` vẫn phục vụ prototype hiện tại.

`WorkspacePages.tsx` sẽ được tách dần vào từng workspace theo vertical slice, không chuyển toàn bộ trong một lần.

## Brand asset

Logo chính thức được đặt tại:

```text
src/assets/images/FoMed_Logo.png
```

Các layout và header sau này sẽ dùng duy nhất asset này làm logo chính.

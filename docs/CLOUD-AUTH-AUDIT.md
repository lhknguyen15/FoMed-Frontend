# Kiểm thử đăng nhập và phân quyền cloud

Ngày kiểm tra: 06/10/2026. API: `https://fomed-api.onrender.com`.
Frontend hiện tại chạy bằng Vite, `/api` được proxy tới Render; database đích là Azure SQL demo. Đây không phải kiểm thử frontend đã deploy.

## Kết quả API

Script `tests/cloud-auth.audit.ps1`: **39 kiểm tra đạt, 0 thất bại**.

- Chưa đăng nhập hoặc JWT sai: endpoint bảo vệ trả 401.
- Bốn tài khoản đăng nhập thành công, nhận đúng vai trò và đọc đúng hồ sơ bản thân (`userId`).
- Endpoint được cấp quyền trả 200; endpoint sai vai trò trả 403.
- Refresh thành công, xoay refresh token và giữ nguyên người dùng; sử dụng lại refresh token cũ trả 401.
- Access token mới đọc được hồ sơ bản thân.

## Kết quả giao diện

| Vai trò / tài khoản demo | Trang sau đăng nhập | Dữ liệu quan sát | Truy cập sai quyền |
| --- | --- | --- | --- |
| Admin / `admin` | `/admin/dashboard` | `/admin/users` hiển thị 10/26 tài khoản, 3 trang | `/booking` chuyển tới `/forbidden` |
| Lễ tân / `letan01` | `/reception` | Danh sách bác sĩ tải được; ngày kiểm tra không có lịch hẹn | `/admin/users` chuyển tới `/forbidden` |
| Bác sĩ / `bs.an` | `/doctor/queue` | Hàng chờ ngày kiểm tra rỗng; nút gọi tiếp theo bị vô hiệu hóa | `/admin/users` chuyển tới `/forbidden` |
| Bệnh nhân / `patient01` | `/booking` | 5 chuyên khoa, 5 bác sĩ, 8 dịch vụ; `/my-appointments` tải 4 lịch hẹn | `/admin/users` chuyển tới `/forbidden` |

- Bỏ trống thông tin: thông báo yêu cầu nhập đầy đủ, không gửi đăng nhập.
- Nhập sai mật khẩu: thông báo lỗi; vẫn ở trang đăng nhập và có thể thử lại.
- Tải lại trang bác sĩ và bệnh nhân: giữ phiên và đúng không gian làm việc.
- Đăng xuất tại trang 403 và tại menu hồ sơ: trở về đăng nhập.
- Sau đăng xuất, mở `/admin/users`: chuyển tới đăng nhập, không hiển thị dữ liệu quản trị.
- Đăng nhập lại từ URL `/login?returnUrl=%2Fforbidden`: thực tế trở về `/booking`, không bị mắc ở 403.

Ảnh kiểm thử lưu tại `dist/review-cloud-auth/` (không theo dõi bằng Git): `admin-users.png`, `reception-home.png`, `doctor-home.png`, `patient-home.png`, `anonymous-protected-route.png`.

## Điểm cần theo dõi, không sửa trong lần kiểm thử này

- Đăng xuất vẫn thêm `returnUrl` của trang cũ, kể cả `/forbidden`. `GuestRoute` hiện đưa người đã đăng nhập về trang theo vai trò; luồng đăng nhập lại đã thử không gặp lỗi, nhưng hai cơ chế chuyển trang cần thống nhất khi cải tiến xác thực.
- Các badge sidebar và danh sách ở tab "Sắp tới" cần đối chiếu dữ liệu/ngày trong bước kiểm thử workflow. Có lịch hẹn chưa hoàn tất nhưng ngày đã qua xuất hiện trong tab này; không suy luận rằng bộ lọc đã đúng từ việc tải dữ liệu thành công.
- Chưa kiểm thử tự refresh trên UI sau khi access token hết hạn theo thời gian thực, lưu phiên dài hạn với "Ghi nhớ đăng nhập", hoặc mọi tổ hợp quyền của toàn bộ endpoint. Refresh phía API đã được kiểm tra.

## Chạy lại

Trong thư mục `FoMed-Frontend`, dùng PowerShell:

```powershell
$demoPassword = Read-Host 'Mật khẩu chung của bốn tài khoản demo' -AsSecureString
.\tests\cloud-auth.audit.ps1 -DemoPassword $demoPassword
$demoPassword = $null
```

Script cố định đích tới API demo nói trên, không nhận URL tùy ý. Chỉ chạy khi bốn tài khoản vẫn là tài khoản test có mật khẩu chung; không dùng với dữ liệu thật. Không in mật khẩu, token hay nội dung hồ sơ ra terminal.

## Phạm vi và tác động

Chỉ kiểm thử xác thực, đọc dữ liệu và phân quyền. Login/refresh tạo hoặc xoay phiên xác thực trên cloud. Đăng xuất UI xóa phiên phía trình duyệt; API hiện không có endpoint đăng xuất để thu hồi ngay các refresh token còn hiệu lực do kiểm thử tạo ra.

Không thay đổi mật khẩu/vai trò/tài khoản, không tạo lịch hẹn, bệnh án hay thanh toán, không reset database. Phiên trình duyệt kiểm thử riêng đã đăng xuất; Vite kiểm thử riêng được dừng, không dừng Vite của người dùng. Chưa commit/push.

Bước tiếp theo là kiểm thử workflow trên cloud bằng dữ liệu demo riêng; chưa được thực hiện trong báo cáo này. Đổi mật khẩu mặc định và thu hồi phiên sao chép là bước bảo mật riêng cần thực hiện trước khi mở demo rộng rãi. SePay vẫn chưa được kiểm thử ở bước này.

# Các điểm giao diện cần hoàn thiện

## Biểu tượng vai trò trên thanh điều hướng

Ghi nhận ngày 06/10/2026 theo góp ý của người dùng. **Đã triển khai và kiểm tra cục bộ.**

- Thay ô chữ cái đầu như “BỆ” cạnh “Bệnh nhân / Không gian làm việc” bằng
  biểu tượng người hoặc hình đại diện minh họa phù hợp.
- Ưu tiên biểu tượng người có sẵn trong bộ biểu tượng của dự án, đồng bộ màu sắc
  và phong cách FoMed; không dùng ảnh người thật làm ảnh mặc định.
- Giữ tên vai trò bằng tiếng Việt bên cạnh để dễ nhận biết; áp dụng nhất quán
  cho các vai trò và cả thanh điều hướng thu gọn/màn hình nhỏ.
- Kiểm tra biểu tượng không làm đổi hành vi chọn vai trò hoặc ảnh hưởng khả năng
  sử dụng bằng bàn phím/trình đọc màn hình.

Vị trí: ô chọn vai trò trong `src/components/AppShell.tsx`.

Đã dùng `UserRound` trong ô nền xanh, giữ tên vai trò và “Không gian làm việc”
khi menu mở rộng. Biểu tượng chỉ để minh họa; nút có nhãn “Chọn vai trò: …”,
trạng thái mở/đóng và chú thích khi thu gọn. Escape đóng danh sách lựa chọn và
trả tiêu điểm về nút; Enter/Tab vẫn dùng được. Thêm nhãn cho nút mở/đóng menu
điện thoại. Không đổi quyền, đường dẫn vai trò hoặc ảnh đại diện tài khoản phía trên.

Xác minh: `node tests/navigation-counts.audit.cjs` hiện có **80 kiểm tra đạt**
(56 kiểm tra số đếm và 24 kiểm tra biểu tượng/nhãn cho sáu vai trò); build và
ESLint riêng `AppShell.tsx` đạt. Build vẫn cảnh báo gói JavaScript trên 500 kB.
Trình duyệt dùng dữ liệu DEMO: menu mở rộng/thu gọn, Enter/Tab/Escape trả tiêu điểm,
đổi vai trò bằng bàn phím, menu điện thoại 390 × 844 và chuyển vai trò trên điện thoại
đều đạt; không ghi nhận lỗi trình duyệt. Không gọi dữ liệu thật hoặc sửa Azure.
Ảnh trong `dist/review-role-icon/` được Git bỏ qua và sẽ bị xóa khi build lại.

## Số đếm trên thanh điều hướng

Đã triển khai và kiểm tra cục bộ ngày 06/10/2026. Bỏ số cố định; chỉ hiển thị
số từ danh sách phù hợp đã tải thành công. Chưa có dữ liệu, tải lỗi, đang tải
hoặc chỉ có tập con theo bộ lọc thì ẩn số. Danh sách rỗng đã tải thành công hiện 0.
Chi tiết phạm vi và bằng chứng: [Số đếm điều hướng](NAVIGATION-COUNTS.md).

Chưa commit/push/deploy. Sonner đã được triển khai bước đầu như bên dưới;
xử lý các lỗi lint còn lại là việc riêng.

## Thông báo Sonner

Đã thêm điểm hiển thị dùng chung và chuyển thông báo thao tác ở lịch hẹn bệnh nhân,
hàng chờ lễ tân/bác sĩ, thu ngân và hồ sơ tài khoản. Lỗi biểu mẫu và cảnh báo đối soát
vẫn hiển thị tại chỗ; kết quả SePay vẫn nằm trong cửa sổ thanh toán.
Đã chuyển tiếp nhóm bác sĩ: lưu/chốt bệnh án, tạo/cập nhật đơn thuốc, thêm/hủy
chỉ định; giữ nguyên cảnh báo dị ứng, tồn kho và trạng thái khóa. Lỗi hủy chỉ định
được hiển thị ngay trong cửa sổ xác nhận. Đã kiểm tra bằng dữ liệu DEMO,
không sửa hồ sơ thật.
Ngày 07/10/2026 đã chuyển tiếp nhập kho/cấp phát thuốc; đơn đã phát trước đó
có lời nhắc riêng, lỗi nhập liệu/tồn kho vẫn tại chỗ. Build và kiểm thử DEMO
đạt, không sửa kho thuốc thật.
Đã chuyển tiếp lưu kết quả của kỹ thuật viên: thông báo thành công dùng Sonner,
lỗi nhập/lưu nằm cạnh nút lưu và giữ bản nháp. Kiểm thử phản hồi chậm, lỗi lưu,
lưu được nhưng tải lại lỗi và điện thoại bằng DEMO đạt; không sửa kết quả thật.
Đã chuyển điều chỉnh tồn kho và nhập lô nhanh: Sonner sau khi lưu thành công,
lỗi ngay trong cửa sổ, khóa thao tác đang chờ và giữ cảnh báo tăng/giảm tồn.
Build và kiểm thử kho DEMO đạt, không nhập/xuất thuốc thật.
Đã chuyển nhóm quản trị: bác sĩ/chuyên khoa/dịch vụ, lịch làm việc/lịch nghỉ,
khóa/mở khóa/gán vai trò và đặt lại mật khẩu. Lỗi biểu mẫu và cảnh báo bảo mật
giữ tại chỗ; sửa lỗi xóa lịch nghỉ bị hiển thị như thành công và bắt lỗi thao
tác tài khoản. Kiểm thử DEMO không thay đổi quyền/tài khoản/lịch thật;
tạo tài khoản/đặt lại mật khẩu chưa kiểm thử gửi trên trình duyệt.
Đã chuyển đặt lịch mới, đặt lịch hộ/tạo nhanh hồ sơ vãng lai và đính kèm tệp:
thành công sau phản hồi, giữ lỗi biểu mẫu và trạng thái chờ lễ tân xác nhận;
tải xuống chỉ báo bàn giao tệp cho trình duyệt. Kiểm thử DEMO đạt, không ghi
lịch/hồ sơ hoặc tải bệnh án thật. Chặn lặp tại trang không thay bảo đảm phía máy chủ.
Đã chuyển đăng ký/đổi mật khẩu và tạo/sửa hồ sơ bệnh nhân; giữ màn hình tiếp
nhận yêu cầu quên mật khẩu thường trực, không khẳng định email đã được giao.
Kiểm tra hàm xử lý tài khoản bằng dữ liệu giả, không gửi mật khẩu trên trình
duyệt; hồ sơ/quên mật khẩu được kiểm thử DEMO. Đã sửa tràn ngang trang hồ sơ
trên điện thoại khi chọn bệnh nhân và chuyển lỗi vào biểu mẫu.
Tiếp theo rà soát hồi quy các nhóm đã chuyển, thông báo còn sót và thao tác
bàn phím/tiêu điểm trong cửa sổ. Chưa tuyên bố toàn giao diện hết lỗi.
Chưa commit/push/deploy.
Xem [Thông báo Sonner](NOTIFICATIONS.md) để tiếp tục từng nhóm.

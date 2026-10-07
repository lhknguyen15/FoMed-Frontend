# Nội dung hiển thị cho người dùng

## Nguyên tắc

- Nhãn trên giao diện mô tả nghiệp vụ, không hiển thị tên trường, tên bảng hay thuật ngữ lập trình.
- Thông báo dùng tiếng Việt có dấu, nêu lý do và hướng dẫn tiếp theo khi có thể.
- Giữ nguyên thông tin do người dùng nhập, dữ liệu bệnh án và các giá trị phục vụ xử lý nội bộ.
- Không đưa lỗi máy chủ, đường dẫn, mã kỹ thuật hoặc thông tin xác thực lên giao diện.

## Xử lý dùng chung

`src/shared/api/user-messages.ts` chuẩn hóa các thông báo cũ đã nhận diện, gồm tiếng Việt không dấu và hai thông báo tài khoản bị lỗi mã hóa. Thông báo nghiệp vụ có dấu được giữ lại nếu không chứa nội dung kỹ thuật. Lỗi chưa nhận diện sử dụng thông báo an toàn theo tình huống.

Các yêu cầu dữ liệu, tải tệp, làm mới phiên đăng nhập và thao tác trên trang sử dụng cách xử lý này. Lỗi máy chủ luôn dùng thông báo tạm gián đoạn; thông tin chẩn đoán nội bộ không được hiển thị. Việc này không tự sửa lỗi nghiệp vụ hay thay đổi trạng thái hồ sơ.

Đây là lớp tương thích phía giao diện. Các thông báo cũ tại backend chưa được sửa trong thay đổi này. Về sau nên cung cấp mã lỗi ổn định và lưu nội dung tiếng Việt đúng UTF-8 ở backend để giảm phụ thuộc vào chuỗi thông báo.

## Kiểm tra

- `node tests/user-messages.audit.cjs`: 24 kiểm tra, chỉ sử dụng phản hồi mô phỏng; không gọi hệ thống thật.
- `node tests/doctor-history.audit.cjs`: kiểm tra hồi quy lịch sử khám.
- `node tests/doctor-resume.audit.cjs`: kiểm tra hồi quy tiếp tục ca khám.
- `npm run build`: kiểm tra biên dịch và đóng gói.
- Kiểm tra trình duyệt tại `/tests/fixtures/user-messages.html`: tình huống trùng lịch, mất kết nối, lỗi nội bộ, thiếu chẩn đoán; desktop và chiều rộng 390px không tràn ngang.

Trang minh họa không nằm trong các trang nghiệp vụ của ứng dụng, không đăng nhập và không ghi dữ liệu. Bộ kiểm tra nội dung tĩnh không đảm bảo bao phủ mọi thông báo động hoặc dữ liệu do người dùng nhập.

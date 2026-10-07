# Thông báo bằng Sonner

Triển khai cục bộ ngày 06/10/2026, dùng Sonner 2.0.8. Chưa commit/push/deploy.

## Quy tắc dùng chung

- Một `AppToaster` tại gốc ứng dụng, bên ngoài các trang/đường dẫn. Thông báo không
  mất khi trang nguồn chuyển sang màn hình tiếp theo.
- Kết quả thao tác: thông báo nổi thành công sau phản hồi thành công, không báo
  trước khi máy chủ trả kết quả; không tự bật thông báo cho mỗi lần tải danh sách.
- Lời nhắc: thông báo thông tin, không dùng màu thành công để mô tả thao tác bị chặn.
- Lỗi thao tác không có biểu mẫu (như gọi số): Sonner, qua `displayError` để giữ
  tiếng Việt có dấu và che nội dung kỹ thuật. Không hiển thị đồng thời một thanh lỗi trùng.
- Lỗi nhập liệu, lỗi trong biểu mẫu/cửa sổ cần sửa, lỗi tải có nút Thử lại, thông tin
  bệnh án và cảnh báo tài chính: giữ tại vị trí liên quan, không biến thành thông báo tự mất.
- Không đưa tên người bệnh, chi tiết bệnh án, số tài khoản hoặc thông tin xác thực
  vào lời gọi thông báo mới. Dùng mô tả thao tác hoặc số thứ tự khi cần.
- Thành công hiện 5 giây, lời nhắc 7 giây, lỗi 8 giây; có nút “Đóng thông báo”.
  Cấu hình Sonner giữ cách tương tác/đọc màn hình sẵn có, nhãn tiếng Việt, Alt + T
  để tập trung vào thông báo. Màu sắc và phông chữ đồng bộ FoMed.

`src/shared/notifications/notify.ts` là điểm gọi dùng chung; không gọi trong render,
không tự bọc mọi API và không suy ra kết quả nghiệp vụ từ việc đóng thông báo.

## Những trang đã chuyển trong bước này

- Lịch hẹn bệnh nhân: hủy/đổi thành công; lời nhắc quá gần giờ hẹn. Lỗi đổi/hủy
  vẫn trong cửa sổ để người dùng xử lý.
- Hàng chờ lễ tân và bác sĩ: gọi số, chuyển cuối hàng, bắt đầu khám; lỗi thao tác.
  Tên người bệnh không còn được đưa vào thông báo nổi mới.
- Thu ngân: lập hóa đơn, ghi nhận thu thủ công, hủy hóa đơn thành công.
  Thông báo lập hóa đơn dùng khóa đường dẫn và kiểm tra đã phát để không lặp vì
  StrictMode; khóa thông báo khoản thu/hủy dùng hóa đơn tương ứng.
- Hồ sơ tài khoản: lưu thành công; lỗi nhập/lưu vẫn cạnh biểu mẫu.
- Bác sĩ: lưu bệnh án, hoàn tất/chốt lượt khám, tạo/cập nhật đơn thuốc và
  thêm/hủy chỉ định thành công. Chốt lượt khám chỉ thông báo sau cả bước lưu
  và bước chốt thành công. Lỗi nhập/lưu, cảnh báo dị ứng, vượt tồn kho, bệnh án
  đã chốt và đơn đã cấp phát vẫn tại chỗ. Lỗi hủy chỉ định nằm trong cửa sổ
  xác nhận khi cửa sổ mở, không bị che phía sau và không hiển thị trùng.
- Nhà thuốc: hoàn tất phiếu nhập và cấp phát thành công dùng Sonner. Nếu máy chủ
  trả về đơn đã phát trước đó, dùng lời nhắc thông tin và giữ giải thích cạnh
  chi tiết xuất thuốc, không mô tả thành một lần xuất kho mới. Lỗi nhập liệu,
  tải danh sách thuốc, thiếu thuốc và xung đột tồn kho vẫn tại chỗ.
- Kỹ thuật viên: lưu kết quả thành công dùng Sonner, không đưa dịch vụ,
  tên người bệnh hoặc nội dung xét nghiệm vào thông báo nổi. Lỗi nhập/lưu
  giữ cạnh nút lưu, không làm mất bản nháp. Lịch sử và trạng thái kết quả
  vẫn hiển thị thường trực, không chuyển thành thông báo tự mất.
- Kho thuốc: điều chỉnh tồn và nhập lô nhanh thành công dùng Sonner sau khi
  đóng cửa sổ. Lỗi nằm trong cửa sổ, giữ số lượng/lý do đang nhập; lời nhắc
  số dương tăng tồn, số âm giảm tồn không tự mất. Khi đang chờ, khóa ô nhập,
  nút lưu/hủy và thao tác đóng bằng nền cửa sổ.
- Quản trị: tạo/sửa bác sĩ, chuyên khoa, dịch vụ, lịch làm việc/lịch nghỉ;
  ngừng lịch/xóa lịch nghỉ; khóa/mở khóa, gán vai trò và đặt lại mật khẩu
  dùng Sonner sau phản hồi thành công. Lỗi lưu giữ trong biểu mẫu; lỗi thao tác
  xóa dùng thông báo lỗi. Giữ xác nhận xóa và cảnh báo thu hồi phiên đăng nhập.
  Trang vai trò chỉ đọc không tự phát thông báo thành công.

Riêng SePay: giữ kết quả xác nhận trong cửa sổ thanh toán và trạng thái khoản thu
trên hóa đơn; không thay bằng thông báo ngắn hoặc thêm thông báo trùng phía sau
cửa sổ `dialog` đang mở. Cảnh báo cần đối soát/mất phản hồi không tự biến mất;
luồng đối soát và chống thu trùng không bị thay đổi.

Các thông báo khác **chưa rà soát toàn bộ**. Chuyển lần lượt các kết quả thao tác
theo quy tắc trên; không thay các cảnh báo/trạng thái thường trực bằng Sonner.

## Xác minh cục bộ

- `node tests/notifications.audit.cjs`: 15 kiểm tra đạt cho bộ gọi, loại thông báo,
  thời gian, khóa tùy chọn, dịch thông báo không dấu và che lỗi kỹ thuật.
- Hồi quy: số đếm/biểu tượng 80; lịch hẹn 51; hóa đơn đã thu 32; SePay thành công
  22; nội dung lỗi người dùng 24 kiểm tra đạt. Không truy cập hệ thống thật.
- `npm run build`: đạt; vẫn cảnh báo gói JavaScript trên 500 kB.
- ESLint các nguồn thay đổi và trang DEMO: đạt; kiểm tra TypeScript nghiêm ngặt
  riêng trang DEMO đạt. Không tuyên bố toàn dự án hết lỗi lint.
- Trình duyệt với `tests/fixtures/notifications.html`: chờ phản hồi chưa có thông báo,
  nhận phản hồi có một thông báo, lỗi nội bộ không lộ nội dung kỹ thuật, đóng thông báo;
  lập hóa đơn trong StrictMode có một thông báo; thu thành công có một thông báo và
  vùng đã thanh toán; tiền khách đưa thiếu có lỗi tại ô nhập, không có thông báo nổi.
- Thu DEMO xong nhưng mất phản hồi: một khoản thu, thông tin đối soát giữ tại chỗ,
  không báo lỗi/thành công nổi sai, không còn nút thu thêm. Hủy lịch DEMO lỗi vẫn
  trong cửa sổ, thành công đóng cửa sổ và phát thông báo, không có thanh thông báo trùng.
- Điện thoại 390 × 844: lời nhắc dài xuống dòng, không tràn ngang; Alt + T tập trung
  vào thông báo và Enter trên nút đóng hoạt động. Không ghi nhận lỗi trình duyệt.

Trang DEMO dùng dữ liệu tổng hợp trong bộ nhớ, thay tất cả hàm API và chặn HTTP;
không đăng nhập, không gửi tiền, không đọc/sửa hồ sơ thật hoặc dữ liệu Azure.
Ảnh trong `dist/review-notifications/` được Git bỏ qua, build lại sẽ xóa.
Đã khôi phục kích thước trình duyệt và đóng tab DEMO sau kiểm thử.

Tham khảo API của tác giả: https://github.com/emilkowalski/sonner

## Xác minh bổ sung nhóm bác sĩ

- `node tests/doctor-notifications.audit.cjs`: 26 kiểm tra hợp đồng nguồn đạt;
  đây là kiểm tra cấu trúc mã, không thay thế kiểm thử thao tác trên trình duyệt.
- Hồi quy bộ gọi thông báo 15, lịch sử khám 10, tiếp tục khám 8, nội dung lỗi 24
  kiểm tra đạt. Build, ESLint ba trang bác sĩ và TypeScript nghiêm ngặt trang
  DEMO đạt; cảnh báo kích thước gói JavaScript vẫn còn.
- Trình duyệt dùng ba trang thật với `tests/fixtures/doctor-notifications.html`:
  lưu bệnh án/thêm chỉ định đang chờ không báo thành công, phản hồi thành công
  có một thông báo, không có thanh xanh trùng. Lỗi lưu được che nội dung kỹ thuật.
- Lưu được nhưng chốt thất bại: không báo hoàn tất, giữ nội dung đã nhập.
  Chốt thành công: một thông báo hoàn tất và khóa chỉnh sửa bệnh án.
- Đơn thuốc: thiếu liều dùng, chưa xác nhận dị ứng và vượt tồn kho không gửi
  thao tác lưu. Lỗi tồn kho 409 giữ liều dùng/số lượng chưa lưu; tạo và cập nhật
  thành công thông báo bằng Sonner, cảnh báo dị ứng không biến mất.
- Chỉ định: số lượng không hợp lệ có lỗi tại chỗ; lỗi hủy hiển thị trong cửa sổ,
  hủy thành công đóng cửa sổ, một thông báo và trạng thái đã hủy/không tính phí.
- Điện thoại 390 × 844: thông báo dài xuống dòng, không tràn ngang. Bộ DEMO
  ban đầu có lỗi khóa React trùng ở nút đặt lại; đã sửa, mở tab sạch và kiểm tra
  lại đặt lại/thêm chỉ định/lưu bệnh án, không còn lỗi trình duyệt.

Các hàm API đều được thay bằng dữ liệu tổng hợp trong bộ nhớ, chặn `fetch`;
không đọc hoặc ghi hồ sơ thật. Đã dừng máy chủ DEMO riêng và trả kích thước
trình duyệt sau kiểm thử. Ảnh trong `dist/review-doctor-notifications/` được
Git bỏ qua, build lại sẽ xóa. Chưa commit/push/deploy.

## Xác minh bổ sung nhóm nhà thuốc — 07/10/2026

- `node tests/pharmacy-notifications.audit.cjs`: 24 kiểm tra hợp đồng nguồn đạt;
  đây là kiểm tra cấu trúc mã, không thay thế kiểm thử trên trình duyệt.
- Hồi quy: bộ gọi thông báo 15, nhóm bác sĩ 26, nội dung lỗi 24 kiểm tra đạt.
  Build, ESLint hai trang nhà thuốc và trang DEMO, TypeScript nghiêm ngặt
  trang DEMO đạt. Cảnh báo kích thước gói JavaScript trên 500 kB vẫn còn.
- Trình duyệt dùng hai trang thật trong `tests/fixtures/pharmacy-notifications.html`:
  phiếu thiếu thông tin không gửi thao tác; lỗi nội bộ được thay bằng lời nhắc
  tiếng Việt, giữ nội dung đang nhập. Đang chờ khóa nút, chưa báo thành công;
  nhận phản hồi mới có một thông báo và chi tiết phiếu/chi tiết xuất thuốc.
- Thiếu thuốc khóa cấp phát và giữ cảnh báo. Xung đột tồn kho hiển thị tại chỗ,
  không có thông báo thành công. Đơn đã phát trước đó có lời nhắc thông tin,
  chi tiết lần trước và không tăng số lần trừ kho DEMO.
- Lỗi tải danh sách thuốc có nút thử tải lại, chặn hoàn tất phiếu; tải lại
  thành công phục hồi danh sách. Điện thoại 390 × 844: lời nhắc dài xuống dòng,
  không tràn ngang trang; bảng giữ cuộn ngang riêng. Không ghi nhận lỗi trình duyệt.

Các API được thay bằng dữ liệu tổng hợp trong bộ nhớ và chặn `fetch`; không
nhập/cấp phát thuốc thật, không đọc/ghi Azure. Chặn gửi lặp tại giao diện chỉ
áp dụng cho thao tác đang chờ trong trang hiện tại, không thay thế bảo đảm
chống trùng phía máy chủ. Đã trả kích thước trình duyệt và dừng máy chủ DEMO
riêng. Ảnh trong `dist/review-pharmacy-notifications/` được Git bỏ qua và sẽ
bị xóa khi build lại. Chưa commit/push/deploy.

## Xác minh bổ sung nhóm kỹ thuật viên — 07/10/2026

- `node tests/technician-notifications.audit.cjs`: 15 kiểm tra hợp đồng nguồn đạt,
  không phải kiểm thử tích hợp máy chủ. Hồi quy thông báo dùng chung 15,
  nội dung lỗi 24, nhà thuốc 24 và bác sĩ 26 kiểm tra đạt.
- Build, ESLint riêng trang chỉ định/trang DEMO/bộ kiểm tra và TypeScript
  nghiêm ngặt trang DEMO đạt. Đã sửa lỗi kiểu trang mặc định và quy tắc export
  ở bộ DEMO trước khi xác minh lại. Build vẫn cảnh báo JavaScript trên 500 kB.
- Trình duyệt dùng `tests/fixtures/technician-notifications.html`, hai trang
  kỹ thuật viên thật, StrictMode và bộ thông báo thật: kết quả trống không
  gửi thao tác; lỗi nội bộ được che, ba trường bản nháp được giữ. Xung đột
  chỉ định đã có kết quả hiển thị tại chỗ, không báo thành công.
- Phản hồi chậm: ô nhập/nút lưu bị khóa và chưa có thông báo thành công.
  Phản hồi thành công: một thông báo, đóng biểu mẫu, tải lại danh sách chờ
  và thấy nội dung đã lưu trong lịch sử DEMO. Không có thanh xanh trùng.
- Lưu thành công nhưng tải lại thất bại: thông báo đúng thao tác đã lưu,
  lỗi tải có nút Thử lại. Thử lại chỉ đọc danh sách, không tăng số lần gửi lưu.
- Lỗi lưu nằm ngay cạnh nút lưu, một vùng lỗi, không lộ chi tiết kỹ thuật.
  Điện thoại 390 × 844: thông báo xuống dòng, trang không tràn ngang, bảng
  có vùng cuộn riêng. Không ghi nhận lỗi trình duyệt.

Chỉ dùng dữ liệu tổng hợp trong bộ nhớ; thay toàn bộ API lâm sàng và chặn
`fetch`. Không đọc/ghi kết quả thật, không truy cập Azure hoặc thay backend.
Chặn gửi lặp chỉ trong thao tác đang chờ tại trang hiện tại, không cam kết
chống trùng giữa nhiều người dùng hoặc khi máy chủ đã lưu nhưng mất phản hồi.
Đã trả kích thước trình duyệt, đóng tab và dừng máy chủ DEMO riêng. Ảnh trong
`dist/review-technician-notifications/` được Git bỏ qua, build lại sẽ xóa.
Chưa commit/push/deploy. Đính kèm tệp là bước riêng, chưa chuyển trong lượt này.

## Xác minh bổ sung điều chỉnh tồn kho — 07/10/2026

- `node tests/inventory-notifications.audit.cjs`: 22 kiểm tra hợp đồng nguồn đạt,
  không phải kiểm thử tích hợp máy chủ. Hồi quy nhà thuốc 24, kỹ thuật viên 15,
  bộ gọi thông báo 15 và nội dung lỗi 24 kiểm tra đạt.
- Build, ESLint riêng trang kho thuốc/trang DEMO/bộ kiểm tra và TypeScript
  nghiêm ngặt trang DEMO đạt. Cảnh báo JavaScript trên 500 kB vẫn còn.
- Kiểm tra số lượng nguyên, khác 0 và phạm vi điều chỉnh ±1.000.000 theo DTO
  backend hiện có; nhập nhanh yêu cầu số nguyên dương. Số lô/lý do có giới hạn
  độ dài tương ứng. Không đổi API hoặc quy tắc ghi dữ liệu phía máy chủ.
- Trình duyệt `tests/fixtures/inventory-notifications.html`: thiếu thông tin,
  số lượng thập phân và hủy không gửi thao tác. Lỗi vượt tồn/lỗi nội bộ nằm
  trong cửa sổ, một vùng lỗi, giữ số lượng/lý do. Không báo thành công khi lỗi.
- Phản hồi chậm khóa biểu mẫu/nút hủy, chưa báo thành công. Phản hồi thành công
  đóng cửa sổ và phát một thông báo, giảm tồn DEMO từ 10 xuống 8, thẻ kho có -2.
  Tăng tồn thêm 5 đã lưu nhưng tải lại lỗi: thông báo đúng thao tác đã lưu,
  thử tải lại thấy 13, không tăng số lần gửi ghi kho.
- Nhập nhanh: thiếu thông tin và lô khác hạn dùng báo lỗi trong cửa sổ.
  Chờ phản hồi chưa thông báo, phản hồi mới nhập một lô DEMO số lượng 3;
  mở lại biểu mẫu trống, không giữ nội dung của lần nhập đã hoàn tất.
- Lỗi danh sách thuốc có thử tải lại và chặn nhập nhanh; tải lại thành công
  phục hồi danh sách. Điện thoại 390 × 844: cửa sổ, cảnh báo/lỗi và thông báo
  xuống dòng, trang không tràn ngang; bảng giữ cuộn riêng. Không có lỗi console.

Dữ liệu tổng hợp trong bộ nhớ, thay toàn bộ API kho/lâm sàng và chặn `fetch`;
không đọc/ghi kho thật hoặc Azure. Chặn lặp chỉ cho thao tác đang chờ tại trang,
không bảo đảm chống lặp giữa người dùng hay trường hợp máy chủ lưu nhưng mất
phản hồi. Vẫn cần đối chiếu thẻ kho trước khi thử lại khi kết quả không rõ.
Đã trả kích thước trình duyệt, đóng tab và dừng máy chủ DEMO riêng. Ảnh tại
`dist/review-inventory-notifications/` được Git bỏ qua, build lại sẽ xóa.
Chưa commit/push/deploy. Quản lý tiêu điểm/bẫy Tab của các cửa sổ là bước
khả năng tiếp cận riêng, không tuyên bố đã kiểm tra đầy đủ trong lượt này.

## Xác minh bổ sung nhóm quản trị — 07/10/2026

- `node tests/admin-notifications.audit.cjs`: 37 hợp đồng nguồn đạt, không phải
  kiểm thử tích hợp máy chủ. Hồi quy bộ gọi 15, nội dung lỗi 24, kho 22,
  kỹ thuật viên 15 và nhà thuốc 24 kiểm tra đạt.
- Build, ESLint riêng sáu trang/trang DEMO/bộ kiểm tra và TypeScript nghiêm
  ngặt trang DEMO đạt; cảnh báo JavaScript trên 500 kB vẫn còn.
- Trình duyệt `tests/fixtures/admin-notifications.html` dùng sáu trang thật:
  tạo/sửa chuyên khoa, tạo/sửa dịch vụ, sửa bác sĩ, khóa/mở khóa/gán vai trò,
  tạo/sửa lịch làm việc và lịch nghỉ thông báo sau phản hồi thành công.
  Chuyên khoa thiếu tên không gửi yêu cầu; lỗi chuyên khoa, vai trò và lịch
  giữ bản nháp/lựa chọn, không lộ lỗi kỹ thuật. Chờ lưu chuyên khoa/khóa tài
  khoản chưa báo thành công. Thao tác tài khoản/lịch làm việc đang chờ không
  đóng cửa sổ, nhận phản hồi mới đóng và thông báo thành công.
- Sửa nhánh xóa lịch nghỉ riêng từng đưa lỗi vào thanh thành công màu xanh;
  DEMO lỗi xóa nay hiển thị thông báo lỗi. Thao tác tài khoản dùng bộ xử lý
  chung bắt lỗi Promise, không còn lỗi chưa xử lý khi API thất bại.
- Lưu dịch vụ thành công nhưng tải lại lỗi: thông báo đúng kết quả lưu,
  lỗi tải có Thử lại; thử tải lại không tăng số lần gửi lưu. Điện thoại
  390 × 844: trang và thông báo không tràn ngang, bảng cuộn riêng.
  Không ghi nhận lỗi console.
- Xác nhận xóa vẫn giữ trong nguồn. Kiểm thử hộp xác nhận native chưa đầy đủ:
  lượt bấm trong trình duyệt báo hết thời gian chờ rồi thao tác DEMO hoàn tất;
  không tuyên bố đã xác minh nhánh hủy xác nhận trên trình duyệt.
- Tạo tài khoản bác sĩ và đặt lại mật khẩu chỉ kiểm tra hợp đồng nguồn,
  chưa nhập hoặc gửi mật khẩu trên trình duyệt. Không thay chính sách quyền
  hay bảo đảm chống lặp phía máy chủ; chặn lặp tài khoản chỉ tại trang đang mở.

Các API quản trị được thay bằng dữ liệu tổng hợp trong bộ nhớ, chặn `fetch`;
không tạo/sửa tài khoản, quyền, bác sĩ, danh mục, lịch thật hoặc truy cập Azure.
Đã trả kích thước trình duyệt, đóng tab và dừng máy chủ DEMO riêng. Ảnh trong
`dist/review-admin-notifications/` được Git bỏ qua, build lại sẽ xóa.
Khả năng tiếp cận cửa sổ là bước riêng. Chưa commit/push/deploy.

## Xác minh bổ sung đặt lịch mới và tệp — 07/10/2026

- Đặt lịch bệnh nhân, đặt lịch hộ và tạo nhanh hồ sơ vãng lai dùng Sonner sau
  phản hồi thành công. Không đưa tên/mã bệnh nhân vào thông báo nổi. Lịch trực
  tuyến vẫn có trạng thái thường trực “chờ lễ tân xác nhận”, không báo đã xác nhận.
- Đính kèm tệp dùng Sonner khi lưu thành công; lỗi nhập/tải lên ở cạnh biểu mẫu.
  Tải xuống chỉ báo đã gửi tệp tới trình duyệt, không khẳng định đã lưu vào máy.
  Giữ giới hạn định dạng/10 MB, quyền tải lên và chặn tải tệp cũ chưa chuyển kho.
- `node tests/booking-attachments.audit.cjs`: 32 hợp đồng nguồn; không phải
  kiểm thử tích hợp máy chủ. Build, ESLint riêng bốn nguồn/trang DEMO/bộ kiểm tra,
  TypeScript nghiêm ngặt trang DEMO đạt. Cảnh báo JavaScript trên 500 kB còn.
- Trình duyệt `tests/fixtures/booking-attachments.html`: lý do quá ngắn không
  gửi đặt lịch; lỗi giữ nội dung. Chờ phản hồi khóa lựa chọn, chưa báo thành công;
  phản hồi mới có một thông báo, tải lại khung giờ và bỏ giờ đã đặt khỏi danh sách.
- Tạo nhanh thiếu thông tin không gửi; lỗi giữ bản nháp, chờ khóa ô nhập/hủy/đóng;
  thành công đóng cửa sổ và chọn hồ sơ DEMO. Giờ vừa được đặt hiển thị lỗi tại chỗ,
  tải lại danh sách và chặn đặt khung giờ không còn trống.
- Tệp sai định dạng không gửi. Lỗi tải lên giữ lựa chọn, phản hồi chậm khóa thao
  tác; lưu thành công xóa lựa chọn và tải lại danh sách. Lưu được nhưng tải lại
  lỗi vẫn có Thử lại; thử tải lại không tăng số lần gửi ghi. Lỗi quyền tải xuống
  dùng thông báo lỗi, quyền chỉ xem không hiện biểu mẫu tải lên.
- Điện thoại 390 × 844: trang tệp không tràn ngang; kiểm tra thông báo tải xuống
  xuống dòng. Bộ DEMO gặp lỗi khóa trùng khi tự tải lại lúc sửa; đã sửa khóa và
  mở tab sạch kiểm tra lại, không ghi nhận lỗi console trong lượt kiểm tra sạch.

Chỉ dùng dữ liệu tổng hợp và tệp PDF/TXT minh họa, thay toàn bộ API và chặn HTTP;
không tạo lịch/hồ sơ thật, không tải bệnh án thật, không truy cập Azure. Không
tuyên bố đã kiểm tra nội dung/chữ ký tệp phía máy chủ hay tệp đã lưu vật lý vào máy.
Chặn lặp chỉ trong thao tác đang chờ tại trang, không thay chống trùng phía máy chủ.
Ảnh tại `dist/review-booking-attachments/` được Git bỏ qua, build lại sẽ xóa.
Đã trả kích thước trình duyệt, đóng tab và dừng máy chủ DEMO riêng; không dừng
frontend của người dùng. Chưa commit/push/deploy. Khả năng tiếp cận cửa sổ vẫn
là bước riêng.

## Xác minh bổ sung tài khoản và hồ sơ bệnh nhân — 07/10/2026

- Đăng ký và đổi mật khẩu thông báo bằng Sonner sau phản hồi thành công.
  Đăng ký chuyển tiếp sang đặt lịch như trước; đổi mật khẩu xóa ba ô mật khẩu
  sau thành công. Lỗi giữ trong biểu mẫu, chờ phản hồi khóa nhập/gửi và chặn lặp.
  Không thay chính sách mật khẩu, đăng nhập hoặc phân quyền phía máy chủ.
- Quên mật khẩu giữ màn hình tiếp nhận thường trực, không phát thông báo trùng.
  Dùng lời giải thích cố định “Nếu email đã được đăng ký…”; không hiển thị phản
  hồi thô hoặc khẳng định email đã được giao. Không phát triển dịch vụ gửi email.
- Tạo/sửa hồ sơ bệnh nhân dùng Sonner không kèm tên/mã hồ sơ. Mở biểu mẫu mới
  dùng lời nhắc thông tin, không báo đã lưu. Lỗi lưu ở ngay trong biểu mẫu;
  khi đang lưu khóa tìm/chọn hồ sơ, làm mới, các trường và nút lưu.
- `node tests/account-patients-notifications.audit.cjs`: 40 kiểm tra gồm hợp đồng
  nguồn và thực thi hàm xử lý đăng ký/đổi mật khẩu/quên mật khẩu bằng hook giả.
  Kiểm tra nhập thiếu/không hợp lệ, lỗi giữ bản nháp, chờ chặn lặp, thành công
  sau phản hồi và xóa mật khẩu. Đây không phải React E2E hoặc tích hợp máy chủ.
- Build, ESLint riêng bốn trang/trang DEMO và TypeScript nghiêm ngặt trang DEMO
  đạt. Build vẫn có cảnh báo JavaScript trên 500 kB.
- Trình duyệt `tests/fixtures/account-patients-notifications.html`: thiếu thông
  tin không gửi lưu; lỗi giữ bản nháp; phản hồi chậm khóa biểu mẫu/chọn hồ sơ,
  chưa báo thành công. Tạo/sửa thành công có thông báo riêng. Lưu được nhưng
  danh sách tải lỗi: Thử lại chỉ đọc, không tăng số lần ghi DEMO.
- Quên mật khẩu DEMO: email trống không gửi, lỗi giữ email; chờ khóa ô/nút,
  phản hồi mới hiện trạng thái tiếp nhận và lời giải thích cố định. Không nhập
  hoặc gửi mật khẩu, không xác nhận điều khoản/tạo tài khoản trên trình duyệt.
- Điện thoại 390 × 844: phát hiện tràn ngang khi chọn hồ sơ; sửa lưới một cột,
  thẻ co được và nút xuống dòng. Kiểm tra lại trang không tràn ngang, thông báo
  xuống dòng. Lỗi lưu được xác minh nằm trong phần tử `form`.

Chỉ dùng dữ liệu tổng hợp trong bộ nhớ và địa chỉ `demo@example.invalid`, thay
toàn bộ API tài khoản/hồ sơ và chặn `fetch`. Không tạo/sửa tài khoản hoặc hồ sơ
thật, không gửi email, không truy cập Azure. Không bảo đảm chống trùng giữa
người dùng hoặc khi máy chủ lưu nhưng mất phản hồi. Ảnh trong
`dist/review-account-patients/` được Git bỏ qua, build lại sẽ xóa.
Đã trả kích thước trình duyệt, đóng tab kiểm thử và dừng máy chủ DEMO riêng;
không dừng frontend của người dùng. Chưa commit/push/deploy; khả năng tiếp cận
cửa sổ vẫn là việc riêng.
